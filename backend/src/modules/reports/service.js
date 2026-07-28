import mongoose from 'mongoose';
import Sale from '../sales/model.js';
import Purchase from '../purchases/model.js';
import Product from '../products/model.js';
import Customer from '../customers/model.js';
import Payment from '../payments/model.js';
// Ensure schemas are registered
import '../units/model.js';
import '../categories/model.js';
import '../brands/model.js';
import '../warehouses/model.js';

/* ── Sales Report ─────────────────────────────────────────────── */
export const getSalesReport = async (companyId, { startDate, endDate, period } = {}) => {
  const cId = new mongoose.Types.ObjectId(companyId);

  // Build date filter
  let dateFilter = {};
  if (startDate && endDate) {
    dateFilter = { saleDate: { $gte: new Date(startDate), $lte: new Date(endDate) } };
  } else {
    // Default: current month
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    dateFilter = { saleDate: { $gte: monthStart, $lte: monthEnd } };
  }

  const baseMatch = {
    companyId: cId,
    type: 'invoice',
    status: { $nin: ['cancelled'] },
    ...dateFilter,
  };

  // Summary aggregation
  const [summaryResult] = await Sale.aggregate([
    { $match: baseMatch },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$totalAmount' },
        totalPaid: { $sum: '$paidAmount' },
        totalDue: { $sum: '$dueAmount' },
        totalInvoices: { $sum: 1 },
        totalDiscount: { $sum: '$discountAmount' },
        totalTax: { $sum: '$taxAmount' },
      },
    },
  ]);

  const summary = summaryResult || {
    totalRevenue: 0,
    totalPaid: 0,
    totalDue: 0,
    totalInvoices: 0,
    totalDiscount: 0,
    totalTax: 0,
  };

  // Top products by quantity sold
  const topProducts = await Sale.aggregate([
    { $match: baseMatch },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.product',
        name: { $first: '$items.productName' },
        sku: { $first: '$items.sku' },
        totalQty: { $sum: '$items.quantity' },
        totalRevenue: { $sum: '$items.total' },
      },
    },
    { $sort: { totalQty: -1 } },
    { $limit: 10 },
    {
      $project: {
        _id: 0,
        productId: '$_id',
        name: 1,
        sku: 1,
        totalQty: 1,
        totalRevenue: 1,
      },
    },
  ]);

  // Monthly sales trend (last 12 months)
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
  twelveMonthsAgo.setDate(1);
  twelveMonthsAgo.setHours(0, 0, 0, 0);

  const monthlyTrend = await Sale.aggregate([
    {
      $match: {
        companyId: cId,
        type: 'invoice',
        status: { $nin: ['cancelled'] },
        saleDate: { $gte: twelveMonthsAgo },
      },
    },
    {
      $group: {
        _id: { year: { $year: '$saleDate' }, month: { $month: '$saleDate' } },
        revenue: { $sum: '$grandTotal' },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
    {
      $project: {
        _id: 0,
        month: {
          $concat: [
            { $toString: '$_id.year' },
            '-',
            {
              $cond: [
                { $lt: ['$_id.month', 10] },
                { $concat: ['0', { $toString: '$_id.month' }] },
                { $toString: '$_id.month' },
              ],
            },
          ],
        },
        revenue: 1,
        count: 1,
      },
    },
  ]);

  // Top customers by revenue
  const topCustomers = await Sale.aggregate([
    { $match: baseMatch },
    {
      $group: {
        _id: '$customer',
        totalSpent: { $sum: '$grandTotal' },
        totalOrders: { $sum: 1 },
      },
    },
    { $sort: { totalSpent: -1 } },
    { $limit: 5 },
    {
      $lookup: {
        from: 'customers',
        localField: '_id',
        foreignField: '_id',
        as: 'customerInfo',
      },
    },
    { $unwind: { path: '$customerInfo', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 0,
        name: { $ifNull: ['$customerInfo.name', 'Unknown'] },
        totalSpent: 1,
        totalOrders: 1,
      },
    },
  ]);

  // Payment status breakdown
  const [paymentBreakdown] = await Sale.aggregate([
    { $match: { companyId: cId, type: 'invoice', ...dateFilter } },
    {
      $group: {
        _id: '$paymentStatus',
        count: { $sum: 1 },
        amount: { $sum: '$grandTotal' },
      },
    },
  ]).then((rows) => [rows]);

  return {
    summary,
    topProducts,
    monthlyTrend,
    topCustomers,
    paymentBreakdown: paymentBreakdown || [],
  };
};

/* ── Inventory Report ─────────────────────────────────────────── */
export const getInventoryReport = async (companyId) => {
  const cId = new mongoose.Types.ObjectId(companyId);

  // Full inventory list with valuation
  const products = await Product.find({ companyId: cId, isActive: true })
    .populate('category', 'name')
    .populate('brand', 'name')
    .populate('unit', 'name symbol')
    .lean();

  const inventoryList = products.map((p) => ({
    id: p._id,
    name: p.name,
    sku: p.sku,
    category: p.category?.name || '—',
    brand: p.brand?.name || '—',
    unit: p.unit?.symbol || p.unit?.name || '—',
    currentStock: p.currentStock || 0,
    purchasePrice: p.purchasePrice || 0,
    sellingPrice: p.sellingPrice || 0,
    stockValue: (p.currentStock || 0) * (p.purchasePrice || 0),
    retailValue: (p.currentStock || 0) * (p.sellingPrice || 0),
    minStockLevel: p.minStockLevel || 0,
    isLowStock: (p.currentStock || 0) <= (p.minStockLevel || 0),
    status: p.currentStock <= 0 ? 'out_of_stock' : p.currentStock <= p.minStockLevel ? 'low_stock' : 'in_stock',
  }));

  // Summary stats
  const totalStockValue = inventoryList.reduce((sum, p) => sum + p.stockValue, 0);
  const totalRetailValue = inventoryList.reduce((sum, p) => sum + p.retailValue, 0);
  const totalProducts = inventoryList.length;
  const lowStockCount = inventoryList.filter((p) => p.isLowStock && p.currentStock > 0).length;
  const outOfStockCount = inventoryList.filter((p) => p.currentStock <= 0).length;

  // Category-wise stock value
  const categoryBreakdown = Object.values(
    inventoryList.reduce((acc, p) => {
      const cat = p.category;
      if (!acc[cat]) acc[cat] = { category: cat, stockValue: 0, productCount: 0 };
      acc[cat].stockValue += p.stockValue;
      acc[cat].productCount += 1;
      return acc;
    }, {})
  ).sort((a, b) => b.stockValue - a.stockValue);

  return {
    summary: {
      totalProducts,
      totalStockValue,
      totalRetailValue,
      potentialProfit: totalRetailValue - totalStockValue,
      lowStockCount,
      outOfStockCount,
    },
    inventoryList,
    categoryBreakdown,
  };
};

/* ── Profit & Loss Report ─────────────────────────────────────── */
export const getProfitLossReport = async (companyId, { startDate, endDate } = {}) => {
  const cId = new mongoose.Types.ObjectId(companyId);

  const now = new Date();
  const start = startDate ? new Date(startDate) : new Date(now.getFullYear(), 0, 1); // year start
  const end = endDate ? new Date(endDate) : new Date(now.getFullYear(), 11, 31, 23, 59, 59); // year end

  const [salesResult] = await Sale.aggregate([
    {
      $match: {
        companyId: cId,
        type: 'invoice',
        status: { $nin: ['cancelled'] },
        saleDate: { $gte: start, $lte: end },
      },
    },
    {
      $group: {
        _id: null,
        grossRevenue: { $sum: '$totalAmount' },
        totalTax: { $sum: '$taxAmount' },
        totalDiscount: { $sum: '$discountAmount' },
      },
    },
  ]);

  const [purchaseResult] = await Purchase.aggregate([
    {
      $match: {
        companyId: cId,
        type: { $in: ['purchase_invoice', 'purchase_order', 'goods_received'] },
        status: { $nin: ['cancelled'] },
        purchaseDate: { $gte: start, $lte: end },
      },
    },
    {
      $group: {
        _id: null,
        totalCOGS: { $sum: '$totalAmount' },
      },
    },
  ]);

  const grossRevenue = salesResult?.grossRevenue || 0;
  const totalTax = salesResult?.totalTax || 0;
  const totalDiscount = salesResult?.totalDiscount || 0;
  const totalCOGS = purchaseResult?.totalCOGS || 0;
  const netRevenue = grossRevenue - totalTax;
  const grossProfit = netRevenue - totalCOGS;
  const grossMargin = netRevenue > 0 ? ((grossProfit / netRevenue) * 100).toFixed(2) : 0;

  return {
    period: { start, end },
    revenue: {
      gross: grossRevenue,
      tax: totalTax,
      discount: totalDiscount,
      net: netRevenue,
    },
    expenses: {
      cogs: totalCOGS,
    },
    profit: {
      gross: grossProfit,
      grossMarginPercent: parseFloat(grossMargin),
    },
  };
};

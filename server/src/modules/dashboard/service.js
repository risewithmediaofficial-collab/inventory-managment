import mongoose from 'mongoose';
import Sale from '../sales/model.js';
import Purchase from '../purchases/model.js';
import Product from '../products/model.js';
import Customer from '../customers/model.js';
import Supplier from '../suppliers/model.js';
import Payment from '../payments/model.js';
import StockMovement from '../stock-movements/model.js';

const getDateRange = (period) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  switch (period) {
    case 'today':
      return { start: today, end: tomorrow };
    case 'week': {
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());
      return { start: weekStart, end: tomorrow };
    }
    case 'month':
      return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: tomorrow };
    case 'year':
      return { start: new Date(now.getFullYear(), 0, 1), end: tomorrow };
    default:
      return { start: today, end: tomorrow };
  }
};

export const getDashboardStats = async (companyId) => {
  const cId = new mongoose.Types.ObjectId(companyId);
  const { start: todayStart, end: todayEnd } = getDateRange('today');
  const { start: monthStart } = getDateRange('month');

  const [
    todaySales, todayPurchases, monthSales, monthPurchases,
    productStats, customerCount, pendingPayments, pendingReceivables,
    recentSales, recentPurchases, lowStockProducts,
  ] = await Promise.all([
    // Today's sales
    Sale.aggregate([
      { $match: { companyId: cId, type: 'invoice', saleDate: { $gte: todayStart, $lt: todayEnd } } },
      { $group: { _id: null, count: { $sum: 1 }, total: { $sum: '$totalAmount' }, paid: { $sum: '$paidAmount' } } },
    ]),
    // Today's purchases
    Purchase.aggregate([
      { $match: { companyId: cId, type: 'purchase_invoice', purchaseDate: { $gte: todayStart, $lt: todayEnd } } },
      { $group: { _id: null, count: { $sum: 1 }, total: { $sum: '$totalAmount' } } },
    ]),
    // Month sales
    Sale.aggregate([
      { $match: { companyId: cId, type: 'invoice', saleDate: { $gte: monthStart } } },
      { $group: { _id: null, count: { $sum: 1 }, total: { $sum: '$totalAmount' }, paid: { $sum: '$paidAmount' } } },
    ]),
    // Month purchases
    Purchase.aggregate([
      { $match: { companyId: cId, type: 'purchase_invoice', purchaseDate: { $gte: monthStart } } },
      { $group: { _id: null, count: { $sum: 1 }, total: { $sum: '$totalAmount' } } },
    ]),
    // Product stats
    Product.aggregate([
      { $match: { companyId: cId } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: { $sum: { $cond: ['$isActive', 1, 0] } },
          inventoryValue: { $sum: { $multiply: ['$currentStock', '$purchasePrice'] } },
          outOfStock: { $sum: { $cond: [{ $lte: ['$currentStock', 0] }, 1, 0] } },
          lowStock: { $sum: { $cond: [{ $and: [{ $gt: ['$currentStock', 0] }, { $lte: ['$currentStock', '$minStockLevel'] }] }, 1, 0] } },
        },
      },
    ]),
    // Customer count
    Customer.countDocuments({ companyId: cId, isActive: true }),
    // Pending receivables (what customers owe)
    Sale.aggregate([
      { $match: { companyId: cId, type: 'invoice', paymentStatus: { $in: ['unpaid', 'partial'] } } },
      { $group: { _id: null, total: { $sum: '$dueAmount' }, count: { $sum: 1 } } },
    ]),
    // Pending payables (what we owe suppliers)
    Purchase.aggregate([
      { $match: { companyId: cId, type: 'purchase_invoice', paymentStatus: { $in: ['unpaid', 'partial'] } } },
      { $group: { _id: null, total: { $sum: '$dueAmount' }, count: { $sum: 1 } } },
    ]),
    // Recent sales
    Sale.find({ companyId: cId, type: 'invoice' })
      .sort({ createdAt: -1 }).limit(5)
      .populate('customer', 'name').lean(),
    // Recent purchases
    Purchase.find({ companyId: cId, type: 'purchase_invoice' })
      .sort({ createdAt: -1 }).limit(5)
      .populate('supplier', 'name').lean(),
    // Low stock
    Product.find({
      companyId: cId, isActive: true,
      $expr: { $lte: ['$currentStock', '$minStockLevel'] },
    }).select('name sku currentStock minStockLevel unit').populate('unit', 'symbol').limit(10).lean(),
  ]);

  const todaySalesData = todaySales[0] || { count: 0, total: 0 };
  const todayPurchasesData = todayPurchases[0] || { count: 0, total: 0 };
  const monthSalesData = monthSales[0] || { count: 0, total: 0 };
  const monthPurchasesData = monthPurchases[0] || { count: 0, total: 0 };
  const pStats = productStats[0] || { total: 0, active: 0, inventoryValue: 0, outOfStock: 0, lowStock: 0 };
  const todayProfit = todaySalesData.total - todayPurchasesData.total;

  return {
    kpis: {
      revenueToday: todaySalesData.total,
      salesToday: todaySalesData.count,
      purchasesToday: todayPurchasesData.count,
      profitToday: todayProfit,
      inventoryValue: pStats.inventoryValue,
      lowStock: pStats.lowStock,
      outOfStock: pStats.outOfStock,
      pendingReceivables: pendingPayments[0]?.total || 0,
      pendingPayables: pendingReceivables[0]?.total || 0,
      totalCustomers: customerCount,
      revenueMonth: monthSalesData.total,
      purchasesMonth: monthPurchasesData.total,
    },
    recentSales,
    recentPurchases,
    lowStockProducts,
  };
};

export const getSalesTrend = async (companyId, period = 'monthly') => {
  const cId = new mongoose.Types.ObjectId(companyId);
  const now = new Date();

  let groupBy, startDate;
  if (period === 'daily') {
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
    groupBy = { year: { $year: '$saleDate' }, month: { $month: '$saleDate' }, day: { $dayOfMonth: '$saleDate' } };
  } else if (period === 'weekly') {
    startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
    groupBy = { year: { $year: '$saleDate' }, week: { $week: '$saleDate' } };
  } else if (period === 'yearly') {
    startDate = new Date(now.getFullYear() - 3, 0, 1);
    groupBy = { year: { $year: '$saleDate' } };
  } else {
    startDate = new Date(now.getFullYear() - 1, now.getMonth() + 1, 1);
    groupBy = { year: { $year: '$saleDate' }, month: { $month: '$saleDate' } };
  }

  const [salesData, purchaseData] = await Promise.all([
    Sale.aggregate([
      { $match: { companyId: cId, type: 'invoice', saleDate: { $gte: startDate } } },
      { $group: { _id: groupBy, sales: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
    ]),
    Purchase.aggregate([
      { $match: { companyId: cId, type: 'purchase_invoice', purchaseDate: { $gte: startDate } } },
      { $group: { _id: groupBy, purchases: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]),
  ]);

  return { salesData, purchaseData, period };
};

export const getTopProducts = async (companyId, limit = 10) => {
  const cId = new mongoose.Types.ObjectId(companyId);
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  return StockMovement.aggregate([
    { $match: { companyId: cId, type: 'sale', createdAt: { $gte: thirtyDaysAgo } } },
    { $group: { _id: '$product', totalSold: { $sum: '$quantity' }, totalRevenue: { $sum: '$totalCost' } } },
    { $sort: { totalSold: -1 } },
    { $limit: limit },
    { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'product' } },
    { $unwind: '$product' },
    { $project: { name: '$product.name', sku: '$product.sku', totalSold: 1, totalRevenue: 1 } },
  ]);
};

export const getTopCustomers = async (companyId, limit = 10) => {
  const cId = new mongoose.Types.ObjectId(companyId);
  return Sale.aggregate([
    { $match: { companyId: cId, type: 'invoice' } },
    { $group: { _id: '$customer', totalSales: { $sum: '$totalAmount' }, invoiceCount: { $sum: 1 } } },
    { $sort: { totalSales: -1 } },
    { $limit: limit },
    { $lookup: { from: 'customers', localField: '_id', foreignField: '_id', as: 'customer' } },
    { $unwind: '$customer' },
    { $project: { name: '$customer.name', email: '$customer.email', totalSales: 1, invoiceCount: 1 } },
  ]);
};

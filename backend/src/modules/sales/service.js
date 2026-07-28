import Sale from './model.js';
import Product from '../products/model.js';
import StockMovement from '../stock-movements/model.js';
import Customer from '../customers/model.js';
import Notification from '../notifications/model.js';
import { AppError } from '../../utils/AppError.js';
import { emitToCompany } from '../../config/socket.js';
import { getPagination, buildPaginationMeta, buildSort } from '../../utils/apiResponse.js';

const generateInvoiceNumber = async (companyId, type) => {
  const prefixMap = {
    quotation: 'QT',
    sales_order: 'SO',
    invoice: 'INV',
    sales_return: 'SR',
    delivery_challan: 'DC',
  };
  const prefix = prefixMap[type] || 'INV';
  const count = await Sale.countDocuments({ companyId, type });
  return `${prefix}-${String(count + 1).padStart(6, '0')}`;
};

const calculateItemTotals = (item) => {
  const qty = item.quantity;
  const price = item.unitPrice;
  const discountAmount = item.discountType === 'fixed'
    ? item.discount || 0
    : (price * qty * (item.discount || 0)) / 100;
  const subtotal = price * qty - discountAmount;
  const taxAmount = (subtotal * (item.taxRate || 0)) / 100;
  const total = subtotal + taxAmount;
  return { ...item, subtotal, taxAmount, total };
};

export const getSales = async (query, companyId) => {
  const { page, limit, skip } = getPagination(query);
  const sort = buildSort(query, ['saleDate', 'totalAmount', 'createdAt', 'invoiceNumber']);

  const filter = { companyId };
  if (query.type) filter.type = query.type;
  if (query.status) filter.status = query.status;
  if (query.customer) filter.customer = query.customer;
  if (query.paymentStatus) filter.paymentStatus = query.paymentStatus;
  if (query.search) {
    filter.$or = [{ invoiceNumber: new RegExp(query.search, 'i') }];
  }
  if (query.startDate || query.endDate) {
    filter.saleDate = {};
    if (query.startDate) filter.saleDate.$gte = new Date(query.startDate);
    if (query.endDate) {
      const end = new Date(query.endDate);
      end.setHours(23, 59, 59);
      filter.saleDate.$lte = end;
    }
  }

  const [data, total] = await Promise.all([
    Sale.find(filter)
      .populate('customer', 'name email phone')
      .populate('createdBy', 'firstName lastName')
      .sort(sort).skip(skip).limit(limit).lean(),
    Sale.countDocuments(filter),
  ]);

  return { data, pagination: buildPaginationMeta(total, page, limit) };
};

export const getSaleById = async (id, companyId) => {
  const sale = await Sale.findOne({ _id: id, companyId })
    .populate('customer', 'name email phone address gstin')
    .populate('items.product', 'name sku thumbnail')
    .populate('items.unit', 'name symbol')
    .populate('items.warehouse', 'name')
    .populate('createdBy', 'firstName lastName email')
    .populate('salesperson', 'firstName lastName');

  if (!sale) throw new AppError('Sale not found.', 404);
  return sale;
};

export const createSale = async (data, companyId, userId) => {
  // ── 1. Resolve / create customer ──────────────────────────────────────────
  let customer;
  if (data.customer) {
    customer = await Customer.findOne({ _id: data.customer, companyId });
  }
  if (!customer) {
    customer = await Customer.findOne({ name: /Cash Customer|Walk-in Customer/i, companyId });
    if (!customer) {
      customer = await Customer.create({
        name: 'Cash / Walk-in Customer',
        phone: '9999999999',
        companyId,
        type: 'customer',
      });
    }
    data.customer = customer._id;
  }

  // ── 2. Pre-validate stock before touching anything ──────────────────────
  const invoiceType = data.type || 'invoice';
  if ((invoiceType === 'invoice' || invoiceType === 'delivery_challan') && data.status !== 'draft') {
    for (const item of data.items) {
      const product = await Product.findById(item.product);
      if (!product) throw new AppError(`Product not found: ${item.product}`, 404);
      if (product.currentStock < item.quantity) {
        throw new AppError(
          `Insufficient stock for "${product.name}". Available: ${product.currentStock}, Requested: ${item.quantity}`,
          400
        );
      }
    }
  }

  // ── 3. Calculate totals ──────────────────────────────────────────────────
  const items = data.items.map(calculateItemTotals);
  const subtotal      = items.reduce((sum, i) => sum + i.subtotal, 0);
  const taxAmount     = items.reduce((sum, i) => sum + i.taxAmount, 0);
  const discountAmount = data.discountAmount || 0;
  const totalAmount   = subtotal + taxAmount - discountAmount + (data.shippingAmount || 0) + (data.otherCharges || 0);
  const paidAmount    = data.paidAmount || 0;
  const dueAmount     = totalAmount - paidAmount;
  const paymentStatus = paidAmount <= 0 ? 'unpaid' : paidAmount >= totalAmount ? 'paid' : 'partial';
  const invoiceNumber = await generateInvoiceNumber(companyId, invoiceType);
  const status        = data.status || (invoiceType === 'invoice' ? 'confirmed' : 'draft');

  // ── 4. Create the sale document ──────────────────────────────────────────
  const sale = await Sale.create({
    ...data,
    type: invoiceType,
    status,
    items,
    invoiceNumber,
    subtotal,
    taxAmount,
    totalAmount,
    paidAmount,
    dueAmount,
    paymentStatus,
    companyId,
    createdBy: userId,
  });

  // ── 5. Deduct stock ──────────────────────────────────────────────────────
  if ((invoiceType === 'invoice' || invoiceType === 'delivery_challan') && data.status !== 'draft') {
    try {
      await updateStockForSale(sale, companyId, userId, 'decrease');
      sale.isStockUpdated = true;
      await sale.save();
    } catch (stockErr) {
      // Sale already created — mark it but don't fail the whole request
      console.error('Stock update error (non-fatal):', stockErr.message);
    }
  }

  // ── 6. Update customer balance ───────────────────────────────────────────
  if (dueAmount > 0) {
    await Customer.findByIdAndUpdate(data.customer, { $inc: { currentBalance: dueAmount } });
  }

  // ── 7. Real-time events & notifications ─────────────────────────────────
  emitToCompany(companyId, 'sale:created', {
    sale: { _id: sale._id, invoiceNumber, totalAmount, customer: customer.name },
  });
  if (totalAmount > 0) {
    await createSaleNotification(sale, customer, companyId);
  }

  return getSaleById(sale._id, companyId);
};

export const convertSale = async (id, targetType, companyId, userId) => {
  const sourceSale = await Sale.findOne({ _id: id, companyId }).populate('items.product');
  if (!sourceSale) throw new AppError('Source document not found.', 404);

  const validTargetTypes = ['delivery_challan', 'invoice'];
  if (!validTargetTypes.includes(targetType)) {
    throw new AppError(`Invalid target conversion type: ${targetType}`, 400);
  }

  const newSaleData = {
    type: targetType,
    customer: sourceSale.customer,
    warehouse: sourceSale.warehouse,
    items: sourceSale.items.map((i) => ({
      product: i.product._id || i.product,
      productName: i.productName,
      sku: i.sku,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      discount: i.discount,
      discountType: i.discountType,
      taxRate: i.taxRate,
      batchNumber: i.batchNumber,
    })),
    subtotal: sourceSale.subtotal,
    taxAmount: sourceSale.taxAmount,
    discountAmount: sourceSale.discountAmount,
    shippingAmount: sourceSale.shippingAmount,
    otherCharges: sourceSale.otherCharges,
    totalAmount: sourceSale.totalAmount,
    paidAmount: sourceSale.paidAmount,
    dueAmount: sourceSale.dueAmount,
    paymentStatus: sourceSale.paymentStatus,
    paymentMethod: sourceSale.paymentMethod,
    referenceId: sourceSale._id,
    notes: `Converted from ${sourceSale.invoiceNumber} (${sourceSale.type})`,
  };

  return createSale(newSaleData, companyId, userId);
};

const updateStockForSale = async (sale, companyId, userId, direction) => {
  for (const item of sale.items) {
    const product = await Product.findById(item.product);
    if (!product) throw new AppError(`Product ${item.product} not found.`, 404);

    const quantityChange = direction === 'decrease' ? -item.quantity : item.quantity;

    if (direction === 'decrease' && product.currentStock < item.quantity) {
      throw new AppError(
        `Insufficient stock for "${product.name}". Available: ${product.currentStock}, Requested: ${item.quantity}`,
        400
      );
    }

    const newStock = product.currentStock + quantityChange;

    await Product.findByIdAndUpdate(item.product, { $inc: { currentStock: quantityChange } });

    await StockMovement.create({
      type: direction === 'decrease' ? 'sale' : 'sale_return',
      product: item.product,
      warehouse: item.warehouse || sale.warehouse,
      quantity: Math.abs(item.quantity),
      previousStock: product.currentStock,
      newStock,
      unitCost: item.unitPrice,
      totalCost: item.total,
      referenceType: 'Sale',
      referenceId: sale._id,
      referenceNumber: sale.invoiceNumber,
      companyId,
      createdBy: userId,
    });
  }
};

const createSaleNotification = async (sale, customer, companyId) => {
  await Notification.create({
    title: 'New Sale Invoice',
    message: `Invoice ${sale.invoiceNumber} created for ${customer.name} - ₹${sale.totalAmount.toFixed(2)}`,
    type: 'new_sale',
    reference: sale._id,
    referenceType: 'Sale',
    referenceNumber: sale.invoiceNumber,
    isGlobal: true,
    companyId,
  });
};

export const updateSale = async (id, data, companyId, userId) => {
  const sale = await Sale.findOne({ _id: id, companyId });
  if (!sale) throw new AppError('Sale not found.', 404);
  if (sale.status === 'cancelled') throw new AppError('Cannot update a cancelled sale.', 400);

  data.updatedBy = userId;
  const updated = await Sale.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true });
  emitToCompany(companyId, 'sale:updated', { saleId: id });
  return updated;
};

export const deleteSale = async (id, companyId) => {
  const sale = await Sale.findOne({ _id: id, companyId });
  if (!sale) throw new AppError('Sale not found.', 404);

  if (sale.type !== 'quotation' && sale.type !== 'draft') {
    throw new AppError('Only quotations and drafts can be deleted. Cancel invoices instead.', 400);
  }

  await Sale.findByIdAndDelete(id);
  emitToCompany(companyId, 'sale:deleted', { saleId: id });
};

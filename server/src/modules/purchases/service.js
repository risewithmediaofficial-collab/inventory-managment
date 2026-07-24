import Purchase from './model.js';
import Product from '../products/model.js';
import Supplier from '../suppliers/model.js';
import StockMovement from '../stock-movements/model.js';
import { AppError } from '../../utils/AppError.js';
import { getPagination, buildPaginationMeta, buildSort } from '../../utils/apiResponse.js';
import { emitToCompany } from '../../config/socket.js';
import mongoose from 'mongoose';

const generatePurchaseNumber = async (companyId, type) => {
  const prefixMap = { purchase_order: 'PO', purchase_invoice: 'PI', goods_received: 'GRN', purchase_return: 'PR' };
  const prefix = prefixMap[type] || 'PO';
  const count = await Purchase.countDocuments({ companyId, type });
  return `${prefix}-${String(count + 1).padStart(6, '0')}`;
};

const calculateItemTotals = (item) => {
  const qty = item.quantity, price = item.unitPrice;
  const discountAmount = item.discountType === 'fixed' ? item.discount || 0 : (price * qty * (item.discount || 0)) / 100;
  const subtotal = price * qty - discountAmount;
  const taxAmount = (subtotal * (item.taxRate || 0)) / 100;
  return { ...item, subtotal, taxAmount, total: subtotal + taxAmount };
};

export const getPurchases = async (query, companyId) => {
  const { page, limit, skip } = getPagination(query);
  const sort = buildSort(query, ['purchaseDate', 'totalAmount', 'createdAt']);
  const filter = { companyId };
  if (query.type) filter.type = query.type;
  if (query.status) filter.status = query.status;
  if (query.supplier) filter.supplier = query.supplier;
  if (query.paymentStatus) filter.paymentStatus = query.paymentStatus;
  if (query.search) filter.purchaseNumber = new RegExp(query.search, 'i');

  const [data, total] = await Promise.all([
    Purchase.find(filter).populate('supplier', 'name email').populate('createdBy', 'firstName lastName').sort(sort).skip(skip).limit(limit).lean(),
    Purchase.countDocuments(filter),
  ]);
  return { data, pagination: buildPaginationMeta(total, page, limit) };
};

export const getPurchaseById = async (id, companyId) => {
  const purchase = await Purchase.findOne({ _id: id, companyId })
    .populate('supplier', 'name email phone address gstin')
    .populate('items.product', 'name sku')
    .populate('items.unit', 'name symbol')
    .populate('createdBy', 'firstName lastName');
  if (!purchase) throw new AppError('Purchase not found.', 404);
  return purchase;
};

export const createPurchase = async (data, companyId, userId) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const supplier = await Supplier.findOne({ _id: data.supplier, companyId });
    if (!supplier) throw new AppError('Supplier not found.', 404);

    const items = data.items.map(calculateItemTotals);
    const subtotal = items.reduce((s, i) => s + i.subtotal, 0);
    const taxAmount = items.reduce((s, i) => s + i.taxAmount, 0);
    const totalAmount = subtotal + taxAmount + (data.shippingAmount || 0) + (data.otherCharges || 0) - (data.discountAmount || 0);
    const paidAmount = data.paidAmount || 0;
    const dueAmount = totalAmount - paidAmount;
    const paymentStatus = paidAmount <= 0 ? 'unpaid' : paidAmount >= totalAmount ? 'paid' : 'partial';
    const purchaseNumber = await generatePurchaseNumber(companyId, data.type);

    const [purchase] = await Purchase.create([{
      ...data, items, purchaseNumber, subtotal, taxAmount, totalAmount, paidAmount, dueAmount, paymentStatus, companyId, createdBy: userId,
    }], { session });

    // Update stock for received invoices
    if (data.type === 'purchase_invoice' && data.status === 'received') {
      for (const item of items) {
        const product = await Product.findById(item.product).session(session);
        if (!product) throw new AppError(`Product not found.`, 404);
        const newStock = product.currentStock + item.quantity;
        await Product.findByIdAndUpdate(item.product, { $inc: { currentStock: item.quantity } }, { session });
        await StockMovement.create([{
          type: 'purchase', product: item.product, warehouse: item.warehouse || data.warehouse,
          quantity: item.quantity, previousStock: product.currentStock, newStock,
          unitCost: item.unitPrice, totalCost: item.total,
          referenceType: 'Purchase', referenceId: purchase._id, referenceNumber: purchaseNumber,
          companyId, createdBy: userId,
        }], { session });
      }
      purchase.isStockUpdated = true;
      await purchase.save({ session });
    }

    // Update supplier balance
    if (dueAmount > 0) await Supplier.findByIdAndUpdate(data.supplier, { $inc: { currentBalance: dueAmount } }, { session });
    await session.commitTransaction();
    emitToCompany(companyId, 'purchase:created', { purchase: { _id: purchase._id, purchaseNumber, totalAmount } });
    return getPurchaseById(purchase._id, companyId);
  } catch (e) {
    await session.abortTransaction();
    throw e;
  } finally {
    session.endSession();
  }
};

export const updatePurchase = async (id, data, companyId, userId) => {
  const purchase = await Purchase.findOne({ _id: id, companyId });
  if (!purchase) throw new AppError('Purchase not found.', 404);
  data.updatedBy = userId;
  const updated = await Purchase.findByIdAndUpdate(id, { $set: data }, { new: true });
  emitToCompany(companyId, 'purchase:updated', { purchaseId: id });
  return updated;
};

export const deletePurchase = async (id, companyId) => {
  const purchase = await Purchase.findOne({ _id: id, companyId });
  if (!purchase) throw new AppError('Purchase not found.', 404);
  if (purchase.isStockUpdated) throw new AppError('Cannot delete purchase with updated stock.', 400);
  await Purchase.findByIdAndDelete(id);
};

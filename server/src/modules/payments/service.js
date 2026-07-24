import Payment from './model.js';
import { AppError } from '../../utils/AppError.js';
import { getPagination, buildPaginationMeta, buildSort } from '../../utils/apiResponse.js';
import Sale from '../sales/model.js';
import Purchase from '../purchases/model.js';

export const getPayments = async (query, companyId) => {
  const { page, limit, skip } = getPagination(query);
  const sort = buildSort(query, ['paymentDate', 'amount', 'createdAt']);
  const filter = { companyId };
  if (query.type) filter.type = query.type;
  if (query.partyType) filter.partyType = query.partyType;
  if (query.paymentMethod) filter.paymentMethod = query.paymentMethod;
  if (query.status) filter.status = query.status;

  const [data, total] = await Promise.all([
    Payment.find(filter).populate('createdBy', 'firstName lastName').sort(sort).skip(skip).limit(limit).lean(),
    Payment.countDocuments(filter),
  ]);
  return { data, pagination: buildPaginationMeta(total, page, limit) };
};

export const createPayment = async (data, companyId, userId) => {
  const count = await Payment.countDocuments({ companyId });
  const paymentNumber = `PAY-${String(count + 1).padStart(6, '0')}`;

  const payment = await Payment.create({ ...data, paymentNumber, companyId, createdBy: userId });

  // Update invoice payment status
  if (data.allocations?.length) {
    for (const alloc of data.allocations) {
      const Model = alloc.referenceType === 'Sale' ? Sale : Purchase;
      const doc = await Model.findById(alloc.reference);
      if (doc) {
        doc.paidAmount = (doc.paidAmount || 0) + alloc.amount;
        doc.dueAmount = doc.totalAmount - doc.paidAmount;
        doc.paymentStatus = doc.dueAmount <= 0 ? 'paid' : doc.paidAmount > 0 ? 'partial' : 'unpaid';
        await doc.save();
      }
    }
  }

  return payment;
};

export const deletePayment = async (id, companyId) => {
  const payment = await Payment.findOne({ _id: id, companyId });
  if (!payment) throw new AppError('Payment not found.', 404);
  await Payment.findByIdAndDelete(id);
};

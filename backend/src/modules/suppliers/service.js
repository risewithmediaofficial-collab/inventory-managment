import Supplier from './model.js';
import { AppError } from '../../utils/AppError.js';
import { getPagination, buildPaginationMeta, buildSort } from '../../utils/apiResponse.js';

export const getSuppliers = async (query, companyId) => {
  const { page, limit, skip } = getPagination(query);
  const sort = buildSort(query, ['name', 'currentBalance', 'createdAt']);
  const filter = { companyId };
  if (query.search) filter.$or = [{ name: new RegExp(query.search, 'i') }, { email: new RegExp(query.search, 'i') }, { phone: new RegExp(query.search, 'i') }];
  if (query.isActive !== undefined) filter.isActive = query.isActive === 'true';

  const [data, total] = await Promise.all([
    Supplier.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    Supplier.countDocuments(filter),
  ]);
  return { data, pagination: buildPaginationMeta(total, page, limit) };
};

export const getSupplierById = async (id, companyId) => {
  const supplier = await Supplier.findOne({ _id: id, companyId });
  if (!supplier) throw new AppError('Supplier not found.', 404);
  return supplier;
};

export const createSupplier = async (data, companyId, userId) => {
  const count = await Supplier.countDocuments({ companyId });
  data.code = `SUP-${String(count + 1).padStart(5, '0')}`;
  return Supplier.create({ ...data, companyId, createdBy: userId });
};

export const updateSupplier = async (id, data, companyId) => {
  const supplier = await Supplier.findOne({ _id: id, companyId });
  if (!supplier) throw new AppError('Supplier not found.', 404);
  return Supplier.findByIdAndUpdate(id, data, { new: true, runValidators: true });
};

export const deleteSupplier = async (id, companyId) => {
  const supplier = await Supplier.findOne({ _id: id, companyId });
  if (!supplier) throw new AppError('Supplier not found.', 404);
  if (supplier.currentBalance !== 0) throw new AppError('Cannot delete supplier with outstanding balance.', 400);
  await Supplier.findByIdAndDelete(id);
};

import Customer from './model.js';
import { AppError } from '../../utils/AppError.js';
import { getPagination, buildPaginationMeta, buildSort } from '../../utils/apiResponse.js';

export const getCustomers = async (query, companyId) => {
  const { page, limit, skip } = getPagination(query);
  const sort = buildSort(query, ['name', 'currentBalance', 'createdAt']);
  const filter = { companyId };
  if (query.search) filter.$or = [{ name: new RegExp(query.search, 'i') }, { email: new RegExp(query.search, 'i') }, { phone: new RegExp(query.search, 'i') }];
  if (query.isActive !== undefined) filter.isActive = query.isActive === 'true';
  if (query.type) filter.type = query.type;

  const [data, total] = await Promise.all([
    Customer.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    Customer.countDocuments(filter),
  ]);
  return { data, pagination: buildPaginationMeta(total, page, limit) };
};

export const getCustomerById = async (id, companyId) => {
  const customer = await Customer.findOne({ _id: id, companyId });
  if (!customer) throw new AppError('Customer not found.', 404);
  return customer;
};

export const createCustomer = async (data, companyId, userId) => {
  const count = await Customer.countDocuments({ companyId });
  data.code = `CUST-${String(count + 1).padStart(5, '0')}`;
  return Customer.create({ ...data, companyId, createdBy: userId });
};

export const updateCustomer = async (id, data, companyId) => {
  const customer = await Customer.findOne({ _id: id, companyId });
  if (!customer) throw new AppError('Customer not found.', 404);
  return Customer.findByIdAndUpdate(id, data, { new: true, runValidators: true });
};

export const deleteCustomer = async (id, companyId) => {
  const customer = await Customer.findOne({ _id: id, companyId });
  if (!customer) throw new AppError('Customer not found.', 404);
  if (customer.currentBalance !== 0) throw new AppError('Cannot delete customer with outstanding balance.', 400);
  await Customer.findByIdAndDelete(id);
};

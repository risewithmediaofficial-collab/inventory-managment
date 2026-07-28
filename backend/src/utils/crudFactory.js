// Generic CRUD factory for simple master data modules
import { getPagination, buildPaginationMeta } from './apiResponse.js';
import { AppError } from './AppError.js';

export const createCRUDService = (Model) => ({
  getAll: async (query, companyId) => {
    const { page, limit, skip } = getPagination(query);
    const filter = { companyId };
    if (query.search) filter.name = new RegExp(query.search, 'i');
    if (query.isActive !== undefined) filter.isActive = query.isActive === 'true';
    const [data, total] = await Promise.all([
      Model.find(filter).sort({ name: 1 }).skip(skip).limit(limit).lean(),
      Model.countDocuments(filter),
    ]);
    return { data, pagination: buildPaginationMeta(total, page, limit) };
  },
  getById: async (id, companyId) => {
    const item = await Model.findOne({ _id: id, companyId });
    if (!item) throw new AppError('Not found.', 404);
    return item;
  },
  create: async (data, companyId, userId) => {
    return Model.create({ ...data, companyId, createdBy: userId });
  },
  update: async (id, data, companyId) => {
    const item = await Model.findOne({ _id: id, companyId });
    if (!item) throw new AppError('Not found.', 404);
    return Model.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  },
  delete: async (id, companyId) => {
    const item = await Model.findOne({ _id: id, companyId });
    if (!item) throw new AppError('Not found.', 404);
    await Model.findByIdAndDelete(id);
  },
});

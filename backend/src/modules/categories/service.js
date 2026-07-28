import Category from './model.js';
import { AppError } from '../../utils/AppError.js';
import { getPagination, buildPaginationMeta } from '../../utils/apiResponse.js';
import slugify from 'slugify';

export const getCategories = async (query, companyId) => {
  const { page, limit, skip } = getPagination(query);
  const filter = { companyId };
  if (query.search) filter.name = new RegExp(query.search, 'i');
  if (query.parent !== undefined) filter.parent = query.parent || null;
  if (query.isActive !== undefined) filter.isActive = query.isActive === 'true';

  const [data, total] = await Promise.all([
    Category.find(filter).populate('parent', 'name').sort({ name: 1 }).skip(skip).limit(limit).lean(),
    Category.countDocuments(filter),
  ]);
  return { data, pagination: buildPaginationMeta(total, page, limit) };
};

export const createCategory = async (data, companyId, userId) => {
  const slug = slugify(data.name, { lower: true, strict: true });
  const existing = await Category.findOne({ slug, companyId });
  if (existing) throw new AppError('Category with this name already exists.', 409);
  return Category.create({ ...data, slug, companyId, createdBy: userId });
};

export const updateCategory = async (id, data, companyId) => {
  const cat = await Category.findOne({ _id: id, companyId });
  if (!cat) throw new AppError('Category not found.', 404);
  if (data.name) data.slug = slugify(data.name, { lower: true, strict: true });
  return Category.findByIdAndUpdate(id, data, { new: true, runValidators: true });
};

export const deleteCategory = async (id, companyId) => {
  const cat = await Category.findOne({ _id: id, companyId });
  if (!cat) throw new AppError('Category not found.', 404);
  await Category.findByIdAndDelete(id);
};

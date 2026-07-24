import Brand from './model.js';
import { createCRUDService } from '../../utils/crudFactory.js';
import slugify from 'slugify';

const base = createCRUDService(Brand);

export const getBrands = base.getAll;
export const getBrandById = base.getById;
export const createBrand = async (data, companyId, userId) => {
  data.slug = slugify(data.name, { lower: true, strict: true });
  return Brand.create({ ...data, companyId, createdBy: userId });
};
export const updateBrand = base.update;
export const deleteBrand = base.delete;

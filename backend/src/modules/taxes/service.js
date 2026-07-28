import Tax from './model.js';
import { createCRUDService } from '../../utils/crudFactory.js';
const base = createCRUDService(Tax);
export const getTaxes = base.getAll; export const getTaxById = base.getById; export const createTax = base.create; export const updateTax = base.update; export const deleteTax = base.delete;

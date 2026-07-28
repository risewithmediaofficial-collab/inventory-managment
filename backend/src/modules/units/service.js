import Unit from './model.js';
import { createCRUDService } from '../../utils/crudFactory.js';
const base = createCRUDService(Unit);
export const getUnits = base.getAll; export const getUnitById = base.getById; export const createUnit = base.create; export const updateUnit = base.update; export const deleteUnit = base.delete;

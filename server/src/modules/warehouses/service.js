import Warehouse from './model.js';
import { createCRUDService } from '../../utils/crudFactory.js';
import { AppError } from '../../utils/AppError.js';

const base = createCRUDService(Warehouse);

export const getWarehouses = async (query = {}, companyId, user) => {
  const filter = { companyId };
  if (user && user.role?.name === 'warehouse_manager' && user.assignedWarehouse) {
    filter._id = user.assignedWarehouse;
  }
  if (query.search) {
    filter.$or = [{ name: new RegExp(query.search, 'i') }, { code: new RegExp(query.search, 'i') }];
  }
  const data = await Warehouse.find(filter).sort({ isDefault: -1, name: 1 });
  return { data, pagination: { total: data.length, page: 1, limit: data.length, pages: 1 } };
};

export const getWarehouseById = base.getById;
export const createWarehouse = base.create;
export const updateWarehouse = base.update;
export const deleteWarehouse = base.delete;

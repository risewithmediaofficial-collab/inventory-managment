import * as service from './service.js';
import { sendSuccess, sendCreated, sendPaginated } from '../../utils/apiResponse.js';
export const getAll = async (req, res) => { const r = await service.getWarehouses(req.query, req.user.companyId, req.user); sendPaginated(res, r.data, r.pagination); };
export const getById = async (req, res) => { sendSuccess(res, await service.getWarehouseById(req.params.id, req.user.companyId)); };
export const create = async (req, res) => { sendCreated(res, await service.createWarehouse(req.body, req.user.companyId, req.user._id)); };
export const update = async (req, res) => { sendSuccess(res, await service.updateWarehouse(req.params.id, req.body, req.user.companyId)); };
export const remove = async (req, res) => { await service.deleteWarehouse(req.params.id, req.user.companyId); sendSuccess(res, null, 'Deleted'); };

import * as service from './service.js';
import { sendSuccess, sendCreated, sendPaginated } from '../../utils/apiResponse.js';
export const getAll = async (req, res) => { const r = await service.getCustomers(req.query, req.user.companyId); sendPaginated(res, r.data, r.pagination); };
export const getById = async (req, res) => { sendSuccess(res, await service.getCustomerById(req.params.id, req.user.companyId)); };
export const create = async (req, res) => { sendCreated(res, await service.createCustomer(req.body, req.user.companyId, req.user._id)); };
export const update = async (req, res) => { sendSuccess(res, await service.updateCustomer(req.params.id, req.body, req.user.companyId)); };
export const remove = async (req, res) => { await service.deleteCustomer(req.params.id, req.user.companyId); sendSuccess(res, null, 'Deleted'); };

import * as service from './service.js';
import { sendSuccess, sendCreated, sendPaginated } from '../../utils/apiResponse.js';
export const getAll = async (req, res) => { const r = await service.getUnits(req.query, req.user.companyId); sendPaginated(res, r.data, r.pagination); };
export const getById = async (req, res) => { sendSuccess(res, await service.getUnitById(req.params.id, req.user.companyId)); };
export const create = async (req, res) => { sendCreated(res, await service.createUnit(req.body, req.user.companyId, req.user._id)); };
export const update = async (req, res) => { sendSuccess(res, await service.updateUnit(req.params.id, req.body, req.user.companyId)); };
export const remove = async (req, res) => { await service.deleteUnit(req.params.id, req.user.companyId); sendSuccess(res, null, 'Deleted'); };

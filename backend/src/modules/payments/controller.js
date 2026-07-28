import * as service from './service.js';
import { sendSuccess, sendCreated, sendPaginated } from '../../utils/apiResponse.js';
export const getAll = async (req, res) => { const r = await service.getPayments(req.query, req.user.companyId); sendPaginated(res, r.data, r.pagination); };
export const create = async (req, res) => { sendCreated(res, await service.createPayment(req.body, req.user.companyId, req.user._id)); };
export const remove = async (req, res) => { await service.deletePayment(req.params.id, req.user.companyId); sendSuccess(res, null, 'Deleted'); };

import * as service from './service.js';
import { sendPaginated } from '../../utils/apiResponse.js';
export const getAll = async (req, res) => { const r = await service.getStockMovements(req.query, req.user.companyId); sendPaginated(res, r.data, r.pagination); };

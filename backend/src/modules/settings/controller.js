import * as service from './service.js';
import { sendSuccess } from '../../utils/apiResponse.js';
export const getSettings = async (req, res) => { sendSuccess(res, await service.getSettings(req.user.companyId)); };
export const updateSettings = async (req, res) => { sendSuccess(res, await service.updateSettings(req.user.companyId, req.body), 'Settings updated'); };

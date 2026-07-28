import * as service from './service.js';
import { sendSuccess, sendCreated, sendPaginated } from '../../utils/apiResponse.js';
export const getAll = async (req, res) => { const r = await service.getNotifications(req.query, req.user.companyId, req.user._id); res.json({ success: true, ...r }); };
export const markRead = async (req, res) => { sendSuccess(res, await service.markAsRead(req.params.id, req.user._id, req.user.companyId)); };
export const markAllRead = async (req, res) => { sendSuccess(res, await service.markAllAsRead(req.user._id, req.user.companyId)); };
export const create = async (req, res) => { sendCreated(res, await service.createNotification(req.body, req.user.companyId, req.user._id)); };
export const remove = async (req, res) => { await service.deleteNotification(req.params.id, req.user.companyId); sendSuccess(res, null, 'Deleted'); };

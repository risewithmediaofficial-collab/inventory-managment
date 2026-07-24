import * as service from './service.js';
import { sendSuccess, sendCreated, sendPaginated } from '../../utils/apiResponse.js';

export const getAll = async (req, res) => {
  const { data, pagination } = await service.getCategories(req.query, req.user.companyId);
  sendPaginated(res, data, pagination);
};
export const create = async (req, res) => {
  const item = await service.createCategory(req.body, req.user.companyId, req.user._id);
  sendCreated(res, item);
};
export const update = async (req, res) => {
  const item = await service.updateCategory(req.params.id, req.body, req.user.companyId);
  sendSuccess(res, item, 'Updated successfully');
};
export const remove = async (req, res) => {
  await service.deleteCategory(req.params.id, req.user.companyId);
  sendSuccess(res, null, 'Deleted successfully');
};

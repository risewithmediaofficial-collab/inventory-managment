import * as salesService from './service.js';
import { sendSuccess, sendCreated, sendPaginated } from '../../utils/apiResponse.js';

export const getSales = async (req, res) => {
  const { data, pagination } = await salesService.getSales(req.query, req.user.companyId);
  sendPaginated(res, data, pagination, 'Sales fetched');
};

export const getSaleById = async (req, res) => {
  const sale = await salesService.getSaleById(req.params.id, req.user.companyId);
  sendSuccess(res, sale);
};

export const createSale = async (req, res) => {
  const sale = await salesService.createSale(req.body, req.user.companyId, req.user._id);
  sendCreated(res, sale, 'Sale created successfully');
};

export const updateSale = async (req, res) => {
  const sale = await salesService.updateSale(req.params.id, req.body, req.user.companyId, req.user._id);
  sendSuccess(res, sale, 'Sale updated successfully');
};

export const convertSale = async (req, res) => {
  const { targetType } = req.body;
  const sale = await salesService.convertSale(req.params.id, targetType, req.user.companyId, req.user._id);
  sendCreated(res, sale, `Converted successfully to ${targetType}`);
};

export const deleteSale = async (req, res) => {
  await salesService.deleteSale(req.params.id, req.user.companyId);
  sendSuccess(res, null, 'Sale deleted successfully');
};

import * as dashboardService from './service.js';
import { sendSuccess } from '../../utils/apiResponse.js';

export const getStats = async (req, res) => {
  const stats = await dashboardService.getDashboardStats(req.user.companyId);
  sendSuccess(res, stats, 'Dashboard stats fetched');
};

export const getSalesTrend = async (req, res) => {
  const data = await dashboardService.getSalesTrend(req.user.companyId, req.query.period);
  sendSuccess(res, data);
};

export const getTopProducts = async (req, res) => {
  const data = await dashboardService.getTopProducts(req.user.companyId, parseInt(req.query.limit) || 10);
  sendSuccess(res, data);
};

export const getTopCustomers = async (req, res) => {
  const data = await dashboardService.getTopCustomers(req.user.companyId, parseInt(req.query.limit) || 10);
  sendSuccess(res, data);
};

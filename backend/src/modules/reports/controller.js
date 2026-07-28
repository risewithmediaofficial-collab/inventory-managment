import { sendSuccess, sendError } from '../../utils/apiResponse.js';
import { getSalesReport, getInventoryReport, getProfitLossReport } from './service.js';

export const getSalesReportCtrl = async (req, res) => {
  try {
    const { startDate, endDate, period } = req.query;
    const data = await getSalesReport(req.user.companyId, { startDate, endDate, period });
    sendSuccess(res, data, 'Sales report fetched');
  } catch (err) {
    sendError(res, err.message, 500);
  }
};

export const getInventoryReportCtrl = async (req, res) => {
  try {
    const data = await getInventoryReport(req.user.companyId);
    sendSuccess(res, data, 'Inventory report fetched');
  } catch (err) {
    sendError(res, err.message, 500);
  }
};

export const getProfitLossReportCtrl = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const data = await getProfitLossReport(req.user.companyId, { startDate, endDate });
    sendSuccess(res, data, 'Profit & Loss report fetched');
  } catch (err) {
    sendError(res, err.message, 500);
  }
};

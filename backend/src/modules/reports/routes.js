import express from 'express';
import { getSalesReportCtrl, getInventoryReportCtrl, getProfitLossReportCtrl } from './controller.js';
import { protect } from '../../middleware/auth.js';

const router = express.Router();
router.use(protect);

router.get('/sales', getSalesReportCtrl);
router.get('/inventory', getInventoryReportCtrl);
router.get('/profit-loss', getProfitLossReportCtrl);

export default router;

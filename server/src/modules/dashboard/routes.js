import express from 'express';
import { getStats, getSalesTrend, getTopProducts, getTopCustomers } from './controller.js';
import { protect } from '../../middleware/auth.js';

const router = express.Router();
router.use(protect);

router.get('/stats', getStats);
router.get('/sales-trend', getSalesTrend);
router.get('/top-products', getTopProducts);
router.get('/top-customers', getTopCustomers);

export default router;

import express from 'express';
import { auditController } from './service.js';
import { protect } from '../../middleware/auth.js';
import { authorize } from '../../middleware/role.js';
const router = express.Router();
router.use(protect);
router.get('/', authorize('super_admin', 'admin'), auditController.getAll);
export default router;

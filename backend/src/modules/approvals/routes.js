import express from 'express';
import { protect, restrictTo } from '../../middleware/auth.js';
import * as controller from './controller.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(controller.getApprovals)
  .post(controller.createApproval);

router.put('/:id/process', restrictTo('admin', 'branch-manager', 'super-admin'), controller.processApproval);

export default router;

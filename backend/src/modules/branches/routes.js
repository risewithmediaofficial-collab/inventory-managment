import express from 'express';
import { protect, restrictTo } from '../../middleware/auth.js';
import * as controller from './controller.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(controller.getBranches)
  .post(restrictTo('admin', 'super-admin'), controller.createBranch);

router.route('/:id')
  .get(controller.getBranch)
  .put(restrictTo('admin', 'super-admin'), controller.updateBranch)
  .delete(restrictTo('admin', 'super-admin'), controller.deleteBranch);

export default router;

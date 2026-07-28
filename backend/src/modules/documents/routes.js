import express from 'express';
import { protect } from '../../middleware/auth.js';
import * as controller from './controller.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(controller.getDocuments)
  .post(controller.createDocument);

router.delete('/:id', controller.deleteDocument);

export default router;

import express from 'express';
import { getAll } from './controller.js';
import { protect } from '../../middleware/auth.js';
const router = express.Router();
router.use(protect);
router.get('/', getAll);
export default router;

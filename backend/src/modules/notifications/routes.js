import express from 'express';
import { getAll, markRead, markAllRead, create, remove } from './controller.js';
import { protect } from '../../middleware/auth.js';
const router = express.Router();
router.use(protect);
router.get('/', getAll); router.post('/', create); router.put('/mark-all-read', markAllRead); router.put('/:id/read', markRead); router.delete('/:id', remove);
export default router;

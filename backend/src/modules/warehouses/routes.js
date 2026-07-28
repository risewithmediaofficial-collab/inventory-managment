import express from 'express';
import { getAll, getById, create, update, remove } from './controller.js';
import { protect } from '../../middleware/auth.js';
const router = express.Router();
router.use(protect);
router.get('/', getAll); router.get('/:id', getById); router.post('/', create); router.put('/:id', update); router.delete('/:id', remove);
export default router;

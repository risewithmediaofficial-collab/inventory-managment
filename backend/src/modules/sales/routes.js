import express from 'express';
import { getSales, getSaleById, createSale, updateSale, convertSale, deleteSale } from './controller.js';
import { protect } from '../../middleware/auth.js';

const router = express.Router();
router.use(protect);

router.get('/', getSales);
router.get('/:id', getSaleById);
router.post('/', createSale);
router.post('/:id/convert', convertSale);
router.put('/:id', updateSale);
router.delete('/:id', deleteSale);

export default router;

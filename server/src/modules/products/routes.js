import express from 'express';
import {
  getProducts, getProductById, createProduct,
  updateProduct, deleteProduct, getLowStockProducts, getProductStats
} from './controller.js';
import { protect } from '../../middleware/auth.js';
import { uploadMultiple } from '../../middleware/upload.js';

const router = express.Router();

router.use(protect);

router.get('/stats', getProductStats);
router.get('/low-stock', getLowStockProducts);
router.get('/', getProducts);
router.get('/:id', getProductById);
router.post('/', uploadMultiple('images', 5), createProduct);
router.put('/:id', uploadMultiple('images', 5), updateProduct);
router.delete('/:id', deleteProduct);

export default router;

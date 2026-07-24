import express from 'express';
import { globalSearch } from './controller.js';
import { protect } from '../../middleware/auth.js';
const router = express.Router();
router.use(protect);
router.get('/', (req, res, next) => { req.q = req.query.q; req.companyId = req.user.companyId; next(); }, globalSearch);
export default router;

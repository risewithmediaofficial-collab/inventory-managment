import express from 'express';
import { protect, restrictTo } from '../../middleware/auth.js';
import * as controller from './controller.js';

const router = express.Router();

router.use(protect);

router.route('/accounts')
  .get(controller.getAccounts)
  .post(restrictTo('admin', 'accountant', 'super-admin'), controller.createAccount);

// Both /journals and /journal-entries work (frontend uses journal-entries)
router.route('/journals')
  .get(controller.getJournalEntries)
  .post(restrictTo('admin', 'accountant', 'super-admin'), controller.createJournalEntry);

router.route('/journal-entries')
  .get(controller.getJournalEntries)
  .post(restrictTo('admin', 'accountant', 'super-admin'), controller.createJournalEntry);

router.route('/expenses')
  .get(controller.getExpenses)
  .post(controller.createExpense);

router.get('/reports/profit-loss', controller.getProfitLoss);
router.get('/reports/balance-sheet', controller.getBalanceSheet);

export default router;

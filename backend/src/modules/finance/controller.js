import * as financeService from './service.js';

export const getAccounts = async (req, res) => {
  const accounts = await financeService.getAccounts(req.query);
  res.json({ success: true, count: accounts.length, data: accounts });
};

export const createAccount = async (req, res) => {
  const account = await financeService.createAccount(req.body);
  res.status(201).json({ success: true, data: account });
};

export const getJournalEntries = async (req, res) => {
  const entries = await financeService.getJournalEntries(req.query);
  res.json({ success: true, count: entries.length, data: entries });
};

export const createJournalEntry = async (req, res) => {
  const entry = await financeService.createJournalEntry(req.body, req.user._id);
  res.status(201).json({ success: true, message: 'Journal Entry created successfully', data: entry });
};

export const getExpenses = async (req, res) => {
  const expenses = await financeService.getExpenses(req.query);
  res.json({ success: true, count: expenses.length, data: expenses });
};

export const createExpense = async (req, res) => {
  const expense = await financeService.createExpense(req.body, req.user._id);
  res.status(201).json({ success: true, message: 'Voucher recorded successfully', data: expense });
};

export const getProfitLoss = async (req, res) => {
  const report = await financeService.getProfitLossReport(req.query);
  res.json({ success: true, data: report });
};

export const getBalanceSheet = async (req, res) => {
  const report = await financeService.getBalanceSheetReport(req.query);
  res.json({ success: true, data: report });
};

import Account from './account.model.js';
import JournalEntry from './journal.model.js';
import Expense from './expense.model.js';
import { AppError } from '../../utils/AppError.js';

// Chart of accounts
export const getAccounts = async (query = {}) => {
  const filter = {};
  if (query.type) filter.type = query.type;
  if (query.branch) filter.branch = query.branch;
  return await Account.find(filter).sort({ code: 1 });
};

export const createAccount = async (data) => {
  const existing = await Account.findOne({ code: data.code });
  if (existing) throw new AppError('Account code already exists', 400);
  return await Account.create(data);
};

// Journal Entries
export const getJournalEntries = async (query = {}) => {
  const filter = {};
  if (query.branch) filter.branch = query.branch;
  if (query.startDate && query.endDate) {
    filter.date = { $gte: new Date(query.startDate), $lte: new Date(query.endDate) };
  }
  return await JournalEntry.find(filter)
    .populate('items.account', 'name code type')
    .populate('createdBy', 'name')
    .sort({ date: -1 });
};

export const createJournalEntry = async (data, userId) => {
  const totalDebit = data.items.reduce((sum, item) => sum + (Number(item.debit) || 0), 0);
  const totalCredit = data.items.reduce((sum, item) => sum + (Number(item.credit) || 0), 0);

  if (Math.abs(totalDebit - totalCredit) > 0.01) {
    throw new AppError(`Unbalanced Journal Entry: Debits (${totalDebit}) must equal Credits (${totalCredit})`, 400);
  }

  const count = await JournalEntry.countDocuments();
  const entryNumber = `JV-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;

  const entry = await JournalEntry.create({
    ...data,
    entryNumber,
    totalAmount: totalDebit,
    createdBy: userId,
  });

  // Update account balances
  for (const item of data.items) {
    const acc = await Account.findById(item.account);
    if (acc) {
      if (acc.type === 'Asset' || acc.type === 'Expense') {
        acc.balance += (Number(item.debit) - Number(item.credit));
      } else {
        acc.balance += (Number(item.credit) - Number(item.debit));
      }
      await acc.save();
    }
  }

  return entry;
};

// Expenses & Income
export const getExpenses = async (query = {}) => {
  const filter = {};
  if (query.type) filter.type = query.type;
  if (query.branch) filter.branch = query.branch;
  return await Expense.find(filter).populate('recordedBy', 'name').sort({ date: -1 });
};

export const createExpense = async (data, userId) => {
  const count = await Expense.countDocuments();
  const prefix = data.type === 'Income' ? 'INC' : 'EXP';
  const voucherNumber = `${prefix}-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;

  return await Expense.create({
    ...data,
    voucherNumber,
    recordedBy: userId,
  });
};

// Profit & Loss Statement
export const getProfitLossReport = async (query = {}) => {
  const filter = {};
  if (query.branch) filter.branch = query.branch;

  const expenses = await Expense.aggregate([
    { $match: { ...filter, type: 'Expense' } },
    { $group: { _id: '$category', total: { $sum: '$amount' } } }
  ]);

  const incomes = await Expense.aggregate([
    { $match: { ...filter, type: 'Income' } },
    { $group: { _id: '$category', total: { $sum: '$amount' } } }
  ]);

  const totalExpense = expenses.reduce((sum, e) => sum + e.total, 0);
  const totalIncome = incomes.reduce((sum, i) => sum + i.total, 0);

  return {
    incomes,
    expenses,
    totalIncome,
    totalExpense,
    netProfit: totalIncome - totalExpense,
  };
};

// Balance Sheet
export const getBalanceSheetReport = async (query = {}) => {
  const accounts = await Account.find(query.branch ? { branch: query.branch } : {});
  
  const assets = accounts.filter(a => a.type === 'Asset');
  const liabilities = accounts.filter(a => a.type === 'Liability');
  const equity = accounts.filter(a => a.type === 'Equity');

  const totalAssets = assets.reduce((sum, a) => sum + a.balance, 0);
  const totalLiabilities = liabilities.reduce((sum, a) => sum + a.balance, 0);
  const totalEquity = equity.reduce((sum, a) => sum + a.balance, 0);

  return {
    assets,
    liabilities,
    equity,
    totalAssets,
    totalLiabilities,
    totalEquity,
    isBalanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 1,
  };
};

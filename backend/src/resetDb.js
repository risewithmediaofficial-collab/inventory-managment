import mongoose from 'mongoose';
import connectDB from './config/database.js';
import logger from './config/logger.js';

// Import all models to register them
import User, { Role } from './modules/users/model.js';
import Company from './modules/settings/model.js';
import Category from './modules/categories/model.js';
import Brand from './modules/brands/model.js';
import Unit from './modules/units/model.js';
import Warehouse from './modules/warehouses/model.js';
import Tax from './modules/taxes/model.js';
import Product from './modules/products/model.js';
import Customer from './modules/customers/model.js';
import Supplier from './modules/suppliers/model.js';
import Branch from './modules/branches/model.js';
import Account from './modules/finance/account.model.js';
import Expense from './modules/finance/expense.model.js';
import JournalEntry from './modules/finance/journal.model.js';

/**
 * CLEAN RESET
 * Clears all transactional + inventory + master data.
 * KEEPS: users, roles, companies (admin login preserved).
 */
export const resetAndSeedDatabase = async () => {
  try {
    logger.info('🔄 Starting clean reset for M K Corporates ERP...');

    const db = mongoose.connection.db;

    // Collections to CLEAR (everything except users, roles, companies)
    const toKeep = ['users', 'roles', 'companies'];
    const collectionList = await db.listCollections().toArray();
    const toClear = collectionList
      .map(c => c.name)
      .filter(name => !toKeep.includes(name));

    let totalCleared = 0;
    for (const colName of toClear) {
      const result = await db.collection(colName).deleteMany({});
      if (result.deletedCount > 0) {
        logger.info(`  ✅ Cleared ${colName}: ${result.deletedCount} documents`);
        totalCleared += result.deletedCount;
      }
    }

    logger.info(`✅ Reset complete! Cleared ${totalCleared} documents from ${toClear.length} collections.`);
    logger.info('🔐 Admin login preserved. Users, Roles, and Company data kept intact.');
    return { success: true, cleared: totalCleared };
  } catch (error) {
    logger.error('❌ Reset failed:', error);
    throw error;
  }
};

// Run directly if called as main script
const isMain = process.argv[1]?.includes('resetDb');
if (isMain) {
  await connectDB();
  await resetAndSeedDatabase();
  logger.info('Done! Exiting...');
  process.exit(0);
}

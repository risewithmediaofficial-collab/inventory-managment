import mongoose from 'mongoose';
import connectDB from './config/database.js';
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
import JournalEntry from './modules/finance/journal.model.js';
import Expense from './modules/finance/expense.model.js';
import Approval from './modules/approvals/model.js';
import Batch from './modules/warehouses/batch.model.js';
import WarehouseTransfer from './modules/warehouses/transfer.model.js';
import Document from './modules/documents/model.js';
import logger from './config/logger.js';

export const resetAndSeedDatabase = async () => {
  try {
    logger.info('Resetting database... Dropping all existing collections');
    
    // Clear all collections
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }

    logger.info('Database cleared! Seeding fresh initial data...');

    // 1. Roles
    const superAdminRole = await Role.create({
      name: 'super_admin',
      displayName: 'Super Administrator',
      description: 'Full system-wide administrative access',
      permissions: ['*'],
    });

    const adminRole = await Role.create({
      name: 'admin',
      displayName: 'Administrator',
      description: 'Organization administration & user approval access',
      permissions: ['users:*', 'settings:*', 'reports:*'],
    });

    const branchManagerRole = await Role.create({
      name: 'branch_manager',
      displayName: 'Branch Manager',
      description: 'Branch-level sales, inventory & performance management',
      permissions: ['branches:*', 'sales:*', 'inventory:*', 'approvals:*'],
    });

    const accountantRole = await Role.create({
      name: 'accountant',
      displayName: 'Accountant',
      description: 'Financial ledger, cash/bank books & P&L statements',
      permissions: ['finance:*', 'payments:*', 'reports:*'],
    });

    const salesRole = await Role.create({
      name: 'sales_executive',
      displayName: 'Sales Executive',
      description: 'High-speed POS billing & customer order processing',
      permissions: ['sales:*', 'customers:*', 'pos:*'],
    });

    const warehouseRole = await Role.create({
      name: 'warehouse_manager',
      displayName: 'Warehouse Staff / Manager',
      description: 'Godown stock, inter-warehouse transfers & physical audits',
      permissions: ['inventory:*', 'warehouses:*', 'transfers:*'],
    });

    const purchaseRole = await Role.create({
      name: 'purchase_manager',
      displayName: 'Purchase Manager',
      description: 'Procurement requisitions, PO creation & supplier management',
      permissions: ['purchases:*', 'suppliers:*', 'approvals:*'],
    });

    // 2. Company
    const company = await Company.create({
      name: 'StockFlow Enterprises',
      email: 'admin@demo.com',
      phone: '+91 9876543210',
      currencySymbol: '₹',
      currencyCode: 'INR',
      gstin: '27AAAAA0000A1Z5',
      address: { street: '101 Corporate Tower', city: 'Mumbai', state: 'Maharashtra', zipCode: '400001', country: 'India' },
    });

    // 3. Demo Users
    const admin = await User.create({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@demo.com',
      password: 'Admin@123',
      role: superAdminRole._id,
      companyId: company._id,
      isActive: true,
      isApproved: true,
      approvalStatus: 'approved',
    });

    await User.create({
      firstName: 'Warehouse',
      lastName: 'Staff',
      email: 'warehouse@demo.com',
      password: 'Warehouse@123',
      role: warehouseRole._id,
      companyId: company._id,
      isActive: true,
      isApproved: true,
      approvalStatus: 'approved',
    });

    await User.create({
      firstName: 'Accountant',
      lastName: 'User',
      email: 'accountant@demo.com',
      password: 'Accountant@123',
      role: accountantRole._id,
      companyId: company._id,
      isActive: true,
      isApproved: true,
      approvalStatus: 'approved',
    });

    await User.create({
      firstName: 'Sales',
      lastName: 'Executive',
      email: 'sales@demo.com',
      password: 'Sales@123',
      role: salesRole._id,
      companyId: company._id,
      isActive: true,
      isApproved: true,
      approvalStatus: 'approved',
    });

    company.createdBy = admin._id;
    await company.save();

    // 4. Warehouse & Head Office Branch
    const mainWh = await Warehouse.create({ name: 'Central Godown', code: 'WH-CENTRAL', isDefault: true, companyId: company._id, createdBy: admin._id });
    const headBranch = await Branch.create({
      name: 'Headquarters Branch',
      code: 'BR-HO',
      isHeadOffice: true,
      phone: '+91 9876543210',
      email: 'ho@stockflow.com',
      gstin: '27AAAAA0000A1Z5',
      warehouse: mainWh._id,
      manager: admin._id,
      address: { city: 'Mumbai', state: 'Maharashtra', zipCode: '400001' }
    });

    // 5. Units & Categories
    const pc = await Unit.create({ name: 'Piece', symbol: 'pcs', type: 'piece', companyId: company._id, createdBy: admin._id });
    const kg = await Unit.create({ name: 'Kilogram', symbol: 'kg', type: 'weight', companyId: company._id, createdBy: admin._id });

    const electronics = await Category.create({ name: 'Electronics', slug: 'electronics', companyId: company._id, createdBy: admin._id });
    const officeSupplies = await Category.create({ name: 'Office Supplies', slug: 'office-supplies', companyId: company._id, createdBy: admin._id });

    const samsung = await Brand.create({ name: 'Samsung', slug: 'samsung', companyId: company._id, createdBy: admin._id });
    const hp = await Brand.create({ name: 'HP', slug: 'hp', companyId: company._id, createdBy: admin._id });

    // 6. Tax
    const gst18 = await Tax.create({ name: 'GST 18%', rate: 18, type: 'GST', companyId: company._id, createdBy: admin._id });

    // 7. Fresh Demo Products
    await Product.create([
      {
        name: 'Samsung 4K Smart Monitor 32"',
        sku: 'SAM-MON-32',
        barcode: '880609500101',
        category: electronics._id,
        brand: samsung._id,
        unit: pc._id,
        tax: gst18._id,
        sellingPrice: 34999,
        purchasePrice: 28000,
        mrp: 39999,
        currentStock: 40,
        minStockLevel: 5,
        warehouse: mainWh._id,
        branch: headBranch._id,
        companyId: company._id,
        createdBy: admin._id,
      },
      {
        name: 'HP Wireless Keyboard & Mouse Combo',
        sku: 'HP-KM-200',
        barcode: '880609500102',
        category: officeSupplies._id,
        brand: hp._id,
        unit: pc._id,
        tax: gst18._id,
        sellingPrice: 1899,
        purchasePrice: 1200,
        mrp: 2499,
        currentStock: 15,
        minStockLevel: 20,
        warehouse: mainWh._id,
        branch: headBranch._id,
        companyId: company._id,
        createdBy: admin._id,
      },
    ]);

    // 8. Demo Parties
    await Customer.create({
      code: 'CUST-0001',
      name: 'Apex Solutions Pvt Ltd',
      email: 'contact@apexsolutions.com',
      phone: '+91 9820011223',
      companyId: company._id,
      createdBy: admin._id,
    });

    await Supplier.create({
      code: 'SUP-0001',
      name: 'Global Tech Traders',
      email: 'orders@globaltech.com',
      phone: '+91 9810099887',
      companyId: company._id,
      createdBy: admin._id,
    });

    // 9. Initial Financial Chart of Accounts
    await Account.create([
      { code: '1001', name: 'Cash in Hand', type: 'Asset', balance: 50000, branch: headBranch._id, isSystem: true },
      { code: '1002', name: 'Bank Account - HDFC', type: 'Asset', balance: 250000, branch: headBranch._id, isSystem: true },
      { code: '4001', name: 'Sales Revenue', type: 'Revenue', balance: 0, branch: headBranch._id, isSystem: true },
      { code: '5001', name: 'Office Expense', type: 'Expense', balance: 0, branch: headBranch._id, isSystem: true },
    ]);

    logger.info('Database reset & freshly seeded with clean ERP defaults!');
  } catch (err) {
    logger.error('Error resetting database:', err);
  }
};

connectDB().then(async () => {
  await resetAndSeedDatabase();
  process.exit(0);
});

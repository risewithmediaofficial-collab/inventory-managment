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
import logger from './config/logger.js';

export const seedDatabase = async () => {
  try {
    // Check if demo user exists
    const existingAdmin = await User.findOne({ email: 'admin@demo.com' });
    if (existingAdmin) {
      logger.info('Database already seeded. Skipping.');
      return;
    }

    logger.info('Seeding database with demo data...');

    // 1. Role
    let role = await Role.findOne({ name: 'super_admin' });
    if (!role) {
      role = await Role.create({
        name: 'super_admin',
        displayName: 'Super Admin',
        description: 'Full administrative access',
        permissions: ['*'],
      });
    }

    // 2. Company
    const company = await Company.create({
      name: 'Acme Enterprises',
      email: 'admin@demo.com',
      phone: '+91 9876543210',
      currencySymbol: '₹',
      currencyCode: 'INR',
      gstin: '22AAAAA0000A1Z5',
      address: { street: '123 Business Park', city: 'Mumbai', state: 'Maharashtra', zipCode: '400001', country: 'India' },
    });

    // 3. Admin User
    const admin = await User.create({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@demo.com',
      password: 'Admin@123',
      role: role._id,
      companyId: company._id,
      isActive: true,
    });

    company.createdBy = admin._id;
    await company.save();

    // 4. Units
    const kg = await Unit.create({ name: 'Kilogram', symbol: 'kg', type: 'weight', companyId: company._id, createdBy: admin._id });
    const pc = await Unit.create({ name: 'Piece', symbol: 'pcs', type: 'piece', companyId: company._id, createdBy: admin._id });

    // 5. Category & Brand
    const electronics = await Category.create({ name: 'Electronics', slug: 'electronics', companyId: company._id, createdBy: admin._id });
    const samsung = await Brand.create({ name: 'Samsung', slug: 'samsung', companyId: company._id, createdBy: admin._id });

    // 6. Tax
    const gst18 = await Tax.create({ name: 'GST 18%', rate: 18, type: 'GST', companyId: company._id, createdBy: admin._id });

    // 7. Warehouse
    const wh = await Warehouse.create({ name: 'Main Warehouse', code: 'WH-001', isDefault: true, companyId: company._id, createdBy: admin._id });

    // 8. Demo Products
    await Product.create([
      {
        name: 'Samsung Galaxy S24 Ultra',
        sku: 'SAM-S24U-256',
        barcode: '880609500001',
        category: electronics._id,
        brand: samsung._id,
        unit: pc._id,
        tax: gst18._id,
        sellingPrice: 129999,
        purchasePrice: 110000,
        mrp: 134999,
        currentStock: 25,
        minStockLevel: 5,
        warehouse: wh._id,
        companyId: company._id,
        createdBy: admin._id,
      },
      {
        name: 'Wireless Bluetooth Earbuds',
        sku: 'EAR-BT-001',
        category: electronics._id,
        unit: pc._id,
        tax: gst18._id,
        sellingPrice: 2499,
        purchasePrice: 1500,
        mrp: 3999,
        currentStock: 4,
        minStockLevel: 10, // low stock trigger!
        warehouse: wh._id,
        companyId: company._id,
        createdBy: admin._id,
      },
    ]);

    // 9. Demo Customer & Supplier
    await Customer.create({
      code: 'CUST-00001',
      name: 'John Doe Enterprise',
      email: 'john@example.com',
      phone: '+91 9988776655',
      companyId: company._id,
      createdBy: admin._id,
    });

    await Supplier.create({
      code: 'SUP-00001',
      name: 'Tech Distributors Ltd',
      email: 'sales@techdistributors.com',
      phone: '+91 9123456789',
      companyId: company._id,
      createdBy: admin._id,
    });

    logger.info('Demo database successfully seeded!');
  } catch (err) {
    logger.error('Error seeding database:', err);
  }
};

if (process.argv[2] === '--run') {
  connectDB().then(async () => {
    await seedDatabase();
    process.exit(0);
  });
}

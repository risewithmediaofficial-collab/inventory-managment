import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Suspense, lazy } from 'react';
import DashboardLayout from '@layouts/DashboardLayout/index.jsx';
import AuthLayout from '@layouts/AuthLayout/index.jsx';
import PageLoader from '@components/ui/PageLoader.jsx';

// Auth pages
const LoginPage = lazy(() => import('@modules/auth/pages/LoginPage.jsx'));
const RegisterPage = lazy(() => import('@modules/auth/pages/RegisterPage.jsx'));

// Dashboard
const DashboardPage = lazy(() => import('@modules/dashboard/pages/DashboardPage.jsx'));

// Products
const ProductListPage  = lazy(() => import('@modules/products/pages/ProductListPage.jsx'));
const ProductCreatePage= lazy(() => import('@modules/products/pages/ProductCreatePage.jsx'));
const ProductEditPage  = lazy(() => import('@modules/products/pages/ProductEditPage.jsx'));
const ProductViewPage  = lazy(() => import('@modules/products/pages/ProductViewPage.jsx'));

// Masters
const CategoriesPage = lazy(() => import('@modules/categories/pages/CategoriesPage.jsx'));
const BrandsPage     = lazy(() => import('@modules/brands/pages/BrandsPage.jsx'));
const UnitsPage      = lazy(() => import('@modules/units/pages/UnitsPage.jsx'));
const WarehousesPage = lazy(() => import('@modules/warehouses/pages/WarehousesPage.jsx'));
const TaxesPage      = lazy(() => import('@modules/taxes/pages/TaxesPage.jsx'));

// Parties
const SuppliersPage    = lazy(() => import('@modules/suppliers/pages/SuppliersPage.jsx'));
const SupplierViewPage = lazy(() => import('@modules/suppliers/pages/SupplierViewPage.jsx'));
const CustomersPage    = lazy(() => import('@modules/customers/pages/CustomersPage.jsx'));
const CustomerViewPage = lazy(() => import('@modules/customers/pages/CustomerViewPage.jsx'));

// Transactions
const PurchasesPage    = lazy(() => import('@modules/purchases/pages/PurchasesPage.jsx'));
const PurchaseFormPage = lazy(() => import('@modules/purchases/pages/PurchaseFormPage.jsx'));
const PurchaseViewPage = lazy(() => import('@modules/purchases/pages/PurchaseViewPage.jsx'));
const SalesPage        = lazy(() => import('@modules/sales/pages/SalesPage.jsx'));
const SaleFormPage     = lazy(() => import('@modules/sales/pages/SaleFormPage.jsx'));
const SaleViewPage     = lazy(() => import('@modules/sales/pages/SaleViewPage.jsx'));

// Inventory
const InventoryPage     = lazy(() => import('@modules/inventory/pages/InventoryPage.jsx'));
const StockMovementsPage= lazy(() => import('@modules/inventory/pages/StockMovementsPage.jsx'));

// Finance
const PaymentsPage = lazy(() => import('@modules/payments/pages/PaymentsPage.jsx'));

// Reports
const ReportsPage = lazy(() => import('@modules/reports/pages/ReportsPage.jsx'));

// Admin
const UsersPage         = lazy(() => import('@modules/users/pages/UsersPage.jsx'));
const NotificationsPage = lazy(() => import('@modules/notifications/pages/NotificationsPage.jsx'));
const SettingsPage      = lazy(() => import('@modules/settings/pages/SettingsPage.jsx'));
const AuditPage         = lazy(() => import('@modules/audit/pages/AuditPage.jsx'));

// Enterprise ERP Modules
const BranchesPage             = lazy(() => import('@modules/branches/pages/BranchesPage.jsx'));
const FinanceOverviewPage      = lazy(() => import('@modules/finance/pages/FinanceOverviewPage.jsx'));
const PendingApprovalsPage     = lazy(() => import('@modules/approvals/pages/PendingApprovalsPage.jsx'));
const POSBillingPage           = lazy(() => import('@modules/sales/pages/POSBillingPage.jsx'));
const WarehouseTransfersPage   = lazy(() => import('@modules/warehouses/pages/WarehouseTransfersPage.jsx'));
const IntelligentAnalyticsPage = lazy(() => import('@modules/reports/pages/IntelligentAnalyticsPage.jsx'));

// Route guard
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  return !isAuthenticated ? children : <Navigate to="/" replace />;
};

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public Routes */}
          <Route element={<AuthLayout />}>
            <Route path="/login"    element={<PublicRoute><LoginPage /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
          </Route>

          {/* Protected Routes */}
          <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />

            {/* Products */}
            <Route path="/products"           element={<ProductListPage />} />
            <Route path="/products/new"        element={<ProductCreatePage />} />
            <Route path="/products/:id"        element={<ProductViewPage />} />
            <Route path="/products/:id/edit"   element={<ProductEditPage />} />

            {/* Masters */}
            <Route path="/categories"  element={<CategoriesPage />} />
            <Route path="/brands"      element={<BrandsPage />} />
            <Route path="/units"       element={<UnitsPage />} />
            <Route path="/warehouses"  element={<WarehousesPage />} />
            <Route path="/taxes"       element={<TaxesPage />} />

            {/* Parties */}
            <Route path="/suppliers"       element={<SuppliersPage />} />
            <Route path="/suppliers/:id"   element={<SupplierViewPage />} />
            <Route path="/customers"       element={<CustomersPage />} />
            <Route path="/customers/:id"   element={<CustomerViewPage />} />

            {/* Purchases */}
            <Route path="/purchases"         element={<PurchasesPage />} />
            <Route path="/purchases/new"     element={<PurchaseFormPage />} />
            <Route path="/purchases/:id"     element={<PurchaseViewPage />} />
            <Route path="/purchases/:id/edit"element={<PurchaseFormPage />} />

            {/* Sales */}
            <Route path="/sales"         element={<SalesPage />} />
            <Route path="/sales/new"     element={<SaleFormPage />} />
            <Route path="/sales/:id"     element={<SaleViewPage />} />
            <Route path="/sales/:id/edit"element={<SaleFormPage />} />

            {/* Inventory */}
            <Route path="/inventory"       element={<InventoryPage />} />
            <Route path="/stock-movements" element={<StockMovementsPage />} />

            {/* Finance */}
            <Route path="/payments" element={<PaymentsPage />} />

            {/* Reports */}
            <Route path="/reports" element={<ReportsPage />} />

            {/* Admin */}
            <Route path="/users"         element={<UsersPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/settings"      element={<SettingsPage />} />
            <Route path="/audit"         element={<AuditPage />} />

            {/* Enterprise Multi-Branch ERP Routes */}
            <Route path="/branches" element={<BranchesPage />} />
            <Route path="/finance-ledger" element={<FinanceOverviewPage />} />
            <Route path="/approvals" element={<PendingApprovalsPage />} />
            <Route path="/pos" element={<POSBillingPage />} />
            <Route path="/warehouse-transfers" element={<WarehouseTransfersPage />} />
            <Route path="/intelligent-analytics" element={<IntelligentAnalyticsPage />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

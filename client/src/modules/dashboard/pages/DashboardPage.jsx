import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import api from '@services/axios.js';
import { useSelector } from 'react-redux';
import { useEffect, useState } from 'react';
import { subscribeToEvent } from '@services/socket.js';
import { queryClient } from '@services/queryClient.js';
import {
  TrendingUp, TrendingDown, DollarSign, ShoppingCart, Package,
  AlertTriangle, Clock, Users, ArrowUpRight, ArrowDownRight, RefreshCw,
  Warehouse, ArrowRightLeft, CreditCard, Shield, CheckCircle2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const fmt = (n) => new Intl.NumberFormat('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n || 0);
const fmtCurrency = (n) => `₹${fmt(n)}`;

function KPICard({ label, value, sub, icon: Icon, color, trend, loading }) {
  const colorMap = {
    brand:   { bg: 'bg-brand-50',   icon: 'text-brand-600' },
    success: { bg: 'bg-green-50',   icon: 'text-success' },
    warning: { bg: 'bg-amber-50',   icon: 'text-warning' },
    danger:  { bg: 'bg-red-50',     icon: 'text-danger' },
    info:    { bg: 'bg-blue-50',    icon: 'text-info' },
    purple:  { bg: 'bg-purple-50',  icon: 'text-purple-600' },
  };
  const c = colorMap[color] || colorMap.brand;

  return (
    <motion.div className="card p-5 hover:shadow-md transition-all cursor-default" whileHover={{ y: -1 }}>
      {loading ? (
        <div className="space-y-3">
          <div className="h-4 w-24 bg-gray-100 rounded animate-pulse" />
          <div className="h-7 w-32 bg-gray-100 rounded animate-pulse" />
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1.5 tracking-tight">{value}</p>
            </div>
            <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center`}>
              <Icon size={18} className={c.icon} />
            </div>
          </div>
          {sub && (
            <div className="mt-3 flex items-center gap-1.5 text-xs text-gray-500">
              {trend === 'up' && <ArrowUpRight size={14} className="text-success" />}
              {trend === 'down' && <ArrowDownRight size={14} className="text-danger" />}
              <span>{sub}</span>
            </div>
          )}
        </>
      )}
    </motion.div>
  );
}

export default function DashboardPage() {
  const { user } = useSelector((s) => s.auth);
  const navigate = useNavigate();
  
  const userRole = user?.role?.name || user?.role || 'super_admin';
  const [activeRoleView, setActiveRoleView] = useState(
    userRole === 'warehouse_manager' || userRole === 'inventory_manager' ? 'warehouse' :
    userRole === 'accountant' ? 'finance' :
    userRole === 'sales_executive' ? 'sales' : 'executive'
  );

  const { data: statsData, isLoading: statsLoading, refetch } = useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: () => api.get('/dashboard/stats'),
    refetchInterval: 60000,
  });

  const kpis = statsData?.data?.kpis;
  const recentSales = statsData?.data?.recentSales || [];
  const lowStock = statsData?.data?.lowStockProducts || [];

  return (
    <div className="space-y-6">
      {/* Header with Role View Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-gray-900">
              {activeRoleView === 'warehouse' ? '📦 Godown & Warehouse Operations Dashboard' :
               activeRoleView === 'finance' ? '💰 Financial Accountant Dashboard' :
               activeRoleView === 'sales' ? '🛒 POS Sales Executive Dashboard' :
               '🌐 Executive ERP Dashboard'}
            </h1>
            <span className="text-xs bg-brand-50 text-brand-700 px-2.5 py-0.5 rounded-full font-semibold capitalize">
              Role: {user?.role?.displayName || userRole}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-0.5">Welcome back, {user?.fullName || user?.firstName}</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Role switcher for admins */}
          {(userRole === 'super_admin' || userRole === 'admin') && (
            <div className="bg-gray-100 p-1 rounded-xl flex text-xs font-semibold">
              <button
                onClick={() => setActiveRoleView('executive')}
                className={`px-3 py-1.5 rounded-lg transition ${activeRoleView === 'executive' ? 'bg-white shadow text-brand-600' : 'text-gray-600'}`}
              >
                Executive
              </button>
              <button
                onClick={() => setActiveRoleView('warehouse')}
                className={`px-3 py-1.5 rounded-lg transition ${activeRoleView === 'warehouse' ? 'bg-white shadow text-brand-600' : 'text-gray-600'}`}
              >
                Warehouse
              </button>
              <button
                onClick={() => setActiveRoleView('finance')}
                className={`px-3 py-1.5 rounded-lg transition ${activeRoleView === 'finance' ? 'bg-white shadow text-brand-600' : 'text-gray-600'}`}
              >
                Finance
              </button>
              <button
                onClick={() => setActiveRoleView('sales')}
                className={`px-3 py-1.5 rounded-lg transition ${activeRoleView === 'sales' ? 'bg-white shadow text-brand-600' : 'text-gray-600'}`}
              >
                Sales
              </button>
            </div>
          )}

          <button onClick={() => refetch()} className="btn-secondary btn-sm gap-2">
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* ── WAREHOUSE ROLE DASHBOARD VIEW ─────────────────────── */}
      {activeRoleView === 'warehouse' && (
        <div className="space-y-6">
          {/* Quick Actions Bar for Warehouse Staff */}
          <div className="bg-gradient-to-r from-slate-900 to-indigo-900 text-white rounded-2xl p-6 shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Warehouse className="w-5 h-5 text-indigo-400" /> Central Godown Operations Panel
              </h2>
              <p className="text-xs text-slate-300 mt-1">Manage stock in/out, godown transfers, and physical inventory reconciliation</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => navigate('/warehouse-transfers')}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow"
              >
                <ArrowRightLeft className="w-4 h-4" /> Godown Transfer Request
              </button>
              <button
                onClick={() => navigate('/inventory')}
                className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-white/20"
              >
                <Package className="w-4 h-4" /> Physical Stock Check
              </button>
              <button
                onClick={() => navigate('/stock-movements')}
                className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-white/20"
              >
                <Clock className="w-4 h-4" /> Stock Log
              </button>
            </div>
          </div>

          {/* Warehouse KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KPICard label="Godown Stock Value" value={fmtCurrency(kpis?.inventoryValue)} icon={Package} color="info" sub="Total physical stock" loading={statsLoading} />
            <KPICard label="Low Stock Items" value={kpis?.lowStock || 0} icon={AlertTriangle} color="warning" sub="Needs reorder" loading={statsLoading} />
            <KPICard label="Out of Stock" value={kpis?.outOfStock || 0} icon={AlertTriangle} color="danger" sub="Zero inventory" loading={statsLoading} />
            <KPICard label="Active Warehouses" value="1 Godown" icon={Warehouse} color="brand" sub="Central Godown" loading={statsLoading} />
          </div>

          {/* Low Stock Alerts & Godown Tasks */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card p-5">
              <h3 className="font-bold text-gray-900 text-sm mb-4 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" /> Stock Replenishment Alerts
              </h3>
              <div className="divide-y divide-gray-100">
                {lowStock.map((product) => (
                  <div key={product._id} className="py-3 flex justify-between items-center text-sm">
                    <div>
                      <p className="font-bold text-gray-800">{product.name}</p>
                      <p className="text-xs text-gray-400">SKU: {product.sku}</p>
                    </div>
                    <span className="bg-amber-100 text-amber-800 font-bold px-2.5 py-1 rounded-full text-xs">
                      {product.currentStock} left (Min: {product.minStockLevel})
                    </span>
                  </div>
                ))}
                {lowStock.length === 0 && <p className="text-xs text-gray-400 py-4 text-center">All warehouse stock levels optimal!</p>}
              </div>
            </div>

            <div className="card p-5 space-y-4">
              <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Godown Operations & Approvals
              </h3>
              <div className="space-y-3">
                <div onClick={() => navigate('/warehouse-transfers')} className="p-3 bg-gray-50 hover:bg-indigo-50 border border-gray-100 rounded-xl cursor-pointer flex justify-between items-center transition">
                  <div>
                    <p className="font-bold text-sm text-gray-800">Inter-Godown Stock Transfers</p>
                    <p className="text-xs text-gray-500">Dispatch stock between Central Godown and regional branches</p>
                  </div>
                  <ArrowRightLeft className="w-4 h-4 text-brand-600" />
                </div>
                <div onClick={() => navigate('/inventory')} className="p-3 bg-gray-50 hover:bg-indigo-50 border border-gray-100 rounded-xl cursor-pointer flex justify-between items-center transition">
                  <div>
                    <p className="font-bold text-sm text-gray-800">Batch & Serial Number Audit</p>
                    <p className="text-xs text-gray-500">Track manufacturing dates, expiry dates, and serial codes</p>
                  </div>
                  <Package className="w-4 h-4 text-brand-600" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── GENERAL EXECUTIVE MULTI-BRANCH ERP DASHBOARD VIEW ─── */}
      {activeRoleView === 'executive' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
            <KPICard label="Revenue Today" value={fmtCurrency(kpis?.revenueToday)} icon={DollarSign} color="brand" trend="up" sub="Today's total sales" loading={statsLoading} />
            <KPICard label="Sales Today" value={kpis?.salesToday || 0} icon={ShoppingCart} color="success" trend="up" sub={`${kpis?.purchasesToday || 0} purchases`} loading={statsLoading} />
            <KPICard label="Inventory Value" value={fmtCurrency(kpis?.inventoryValue)} icon={Package} color="info" sub="Current stock value" loading={statsLoading} />
            <KPICard label="Low Stock Items" value={kpis?.lowStock || 0} icon={AlertTriangle} color="warning" sub={`${kpis?.outOfStock || 0} out of stock`} loading={statsLoading} />
            <KPICard label="Pending Receivables" value={fmtCurrency(kpis?.pendingReceivables)} icon={Clock} color="danger" sub="Outstanding invoices" loading={statsLoading} />
            <KPICard label="Month Revenue" value={fmtCurrency(kpis?.revenueMonth)} icon={TrendingUp} color="brand" trend="up" sub="This month" loading={statsLoading} />
            <KPICard label="Month Purchases" value={fmtCurrency(kpis?.purchasesMonth)} icon={TrendingDown} color="purple" sub="This month" loading={statsLoading} />
            <KPICard label="Customers" value={fmt(kpis?.totalCustomers)} icon={Users} color="success" sub="Active customers" loading={statsLoading} />
            <KPICard label="Payables" value={fmtCurrency(kpis?.pendingPayables)} icon={Clock} color="warning" sub="Supplier dues" loading={statsLoading} />
            <KPICard label="Profit Today" value={fmtCurrency(kpis?.profitToday)} icon={DollarSign} color="success" trend={kpis?.profitToday >= 0 ? 'up' : 'down'} sub="Estimated gross profit" loading={statsLoading} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Recent Sales Invoices</h3>
              <div className="divide-y divide-gray-100">
                {recentSales.map((s) => (
                  <div key={s._id} className="py-2.5 flex justify-between items-center text-sm">
                    <div>
                      <p className="font-bold text-gray-800">{s.customer?.name || 'Walk-in Customer'}</p>
                      <p className="text-xs text-gray-400">{s.invoiceNumber}</p>
                    </div>
                    <span className="font-extrabold text-gray-900">{fmtCurrency(s.totalAmount)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Low Stock Alerts</h3>
              <div className="divide-y divide-gray-100">
                {lowStock.map((p) => (
                  <div key={p._id} className="py-2.5 flex justify-between items-center text-sm">
                    <span className="font-medium text-gray-800">{p.name}</span>
                    <span className="text-xs text-amber-700 bg-amber-50 font-bold px-2 py-1 rounded">
                      {p.currentStock} left
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── FINANCE ROLE VIEW ─────────────────────────────────── */}
      {activeRoleView === 'finance' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <KPICard label="Total Revenue" value={fmtCurrency(kpis?.revenueMonth)} icon={DollarSign} color="brand" loading={statsLoading} />
            <KPICard label="Pending Receivables" value={fmtCurrency(kpis?.pendingReceivables)} icon={Clock} color="danger" loading={statsLoading} />
            <KPICard label="Supplier Payables" value={fmtCurrency(kpis?.pendingPayables)} icon={Clock} color="warning" loading={statsLoading} />
          </div>
          <div className="card p-5 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-gray-900">General Ledger & Profit & Loss</h3>
              <p className="text-xs text-gray-500">View Cash Book, Bank Book, Journal Entries & Balance Sheets</p>
            </div>
            <button onClick={() => navigate('/finance-ledger')} className="btn-primary btn-sm">
              Open Finance Module
            </button>
          </div>
        </div>
      )}

      {/* ── SALES ROLE VIEW ──────────────────────────────────── */}
      {activeRoleView === 'sales' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <KPICard label="Sales Revenue Today" value={fmtCurrency(kpis?.revenueToday)} icon={DollarSign} color="brand" loading={statsLoading} />
            <KPICard label="Invoices Today" value={kpis?.salesToday || 0} icon={ShoppingCart} color="success" loading={statsLoading} />
            <KPICard label="Total Customers" value={fmt(kpis?.totalCustomers)} icon={Users} color="info" loading={statsLoading} />
          </div>
          <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-2xl p-6 flex justify-between items-center shadow-md">
            <div>
              <h2 className="text-lg font-bold">High-Speed POS Barcode Billing</h2>
              <p className="text-xs opacity-90">Instant billing, receipt printing, and barcode scanner interface</p>
            </div>
            <button onClick={() => navigate('/pos')} className="bg-white text-emerald-800 font-bold px-4 py-2 rounded-xl text-sm shadow">
              Launch POS Terminal
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

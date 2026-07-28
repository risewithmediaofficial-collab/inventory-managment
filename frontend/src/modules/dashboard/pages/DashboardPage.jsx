import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import api from '@services/axios.js';
import { useSelector } from 'react-redux';
import { useEffect, useState } from 'react';
import { subscribeToEvent } from '@services/socket.js';
import { queryClient } from '@services/queryClient.js';
import { useNavigate } from 'react-router-dom';

// MUI Icons
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import InventoryIcon from '@mui/icons-material/Inventory';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import RefreshIcon from '@mui/icons-material/Refresh';
import AddIcon from '@mui/icons-material/Add';
import WarehouseIcon from '@mui/icons-material/Warehouse';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import StorefrontIcon from '@mui/icons-material/Storefront';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';

const fmt = (n) => new Intl.NumberFormat('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n || 0);
const fmtCurrency = (n) => `₹${fmt(n)}`;

// ─── Colorful KPI Card (Vyapaar-style) ───────────────────────────────────────
function KPICard({ label, value, sub, icon: Icon, gradient, trend, loading, onClick }) {
  return (
    <motion.div
      whileHover={{ y: -3, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`relative rounded-2xl p-5 cursor-pointer overflow-hidden shadow-md ${onClick ? 'cursor-pointer' : ''}`}
      style={{ background: gradient }}
    >
      {/* Background decorative circle */}
      <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-white/10" />
      <div className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full bg-white/5" />

      {loading ? (
        <div className="space-y-2">
          <div className="h-3 w-20 bg-white/20 rounded animate-pulse" />
          <div className="h-7 w-28 bg-white/20 rounded animate-pulse" />
        </div>
      ) : (
        <div className="relative z-10">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold text-white/70 uppercase tracking-wider mb-1">{label}</p>
              <p className="text-2xl font-black text-white tracking-tight">{value}</p>
              {sub && (
                <div className="mt-2 flex items-center gap-1 text-xs text-white/70">
                  {trend === 'up' && <ArrowUpwardIcon sx={{ fontSize: 14, color: '#86efac' }} />}
                  {trend === 'down' && <ArrowDownwardIcon sx={{ fontSize: 14, color: '#fca5a5' }} />}
                  <span>{sub}</span>
                </div>
              )}
            </div>
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <Icon sx={{ fontSize: 24, color: '#fff' }} />
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ─── Quick Action Button ──────────────────────────────────────────────────────
function QuickAction({ icon: Icon, label, bg, onClick }) {
  return (
    <motion.button
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      className="flex flex-col items-center gap-2 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all"
    >
      <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: bg }}>
        <Icon sx={{ fontSize: 24, color: '#fff' }} />
      </div>
      <span className="text-xs font-bold text-slate-700 text-center leading-tight">{label}</span>
    </motion.button>
  );
}

// ─── Main Dashboard ──────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user } = useSelector((s) => s.auth);
  const navigate = useNavigate();
  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const { data: statsData, isLoading, refetch } = useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: () => api.get('/dashboard/stats'),
    refetchInterval: 60000,
    retry: 2,
  });

  useEffect(() => {
    const unsubs = [
      subscribeToEvent('sale:created', () => {
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      }),
    ];
    return () => unsubs.forEach((u) => u && u());
  }, []);

  const kpis = statsData?.data?.kpis || statsData?.kpis || {};
  const recentSales = statsData?.data?.recentSales || statsData?.recentSales || [];
  const lowStock = statsData?.data?.lowStockProducts || statsData?.lowStockProducts || [];
  const salesChart = statsData?.data?.salesChart || statsData?.salesChart || [];

  const kpiCards = [
    {
      label: "Today's Sales",
      value: fmtCurrency(kpis.todaySales || 0),
      sub: `${kpis.todayInvoices || 0} invoices today`,
      icon: ReceiptLongIcon,
      gradient: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
      trend: 'up',
      route: '/sales',
    },
    {
      label: 'Total Revenue',
      value: fmtCurrency(kpis.totalRevenue || kpis.totalSales || 0),
      sub: 'All-time sales',
      icon: TrendingUpIcon,
      gradient: 'linear-gradient(135deg, #059669, #0d9488)',
      trend: 'up',
      route: '/sales',
    },
    {
      label: 'Total Products',
      value: fmt(kpis.totalProducts || 0),
      sub: `${kpis.lowStockCount || 0} low stock alerts`,
      icon: InventoryIcon,
      gradient: 'linear-gradient(135deg, #0284c7, #0891b2)',
      trend: kpis.lowStockCount > 0 ? 'down' : 'up',
      route: '/products',
    },
    {
      label: 'Low Stock Items',
      value: fmt(kpis.lowStockCount || 0),
      sub: 'Needs reorder',
      icon: WarningAmberIcon,
      gradient: 'linear-gradient(135deg, #d97706, #ea580c)',
      trend: 'down',
      route: '/inventory',
    },
    {
      label: 'Total Customers',
      value: fmt(kpis.totalCustomers || 0),
      sub: 'Active customer base',
      icon: PeopleAltIcon,
      gradient: 'linear-gradient(135deg, #db2777, #9333ea)',
      trend: 'up',
      route: '/customers',
    },
    {
      label: 'Total Purchases',
      value: fmtCurrency(kpis.totalPurchases || 0),
      sub: `${kpis.totalPurchaseOrders || 0} purchase orders`,
      icon: ShoppingCartIcon,
      gradient: 'linear-gradient(135deg, #0f766e, #0369a1)',
      trend: 'up',
      route: '/purchases',
    },
    {
      label: 'Suppliers',
      value: fmt(kpis.totalSuppliers || 0),
      sub: 'Active suppliers',
      icon: LocalShippingIcon,
      gradient: 'linear-gradient(135deg, #be185d, #9f1239)',
      trend: 'up',
      route: '/suppliers',
    },
    {
      label: 'Pending Dues',
      value: fmtCurrency(kpis.totalOutstanding || kpis.pendingDues || 0),
      sub: 'Uncollected payments',
      icon: AccountBalanceWalletIcon,
      gradient: 'linear-gradient(135deg, #b45309, #92400e)',
      trend: 'down',
      route: '/payments',
    },
  ];

  const quickActions = [
    { icon: PointOfSaleIcon,    label: 'POS Billing',       bg: '#4f46e5', route: '/pos' },
    { icon: AddIcon,            label: 'New Sale',           bg: '#059669', route: '/sales/new' },
    { icon: ShoppingCartIcon,   label: 'New Purchase',       bg: '#0284c7', route: '/purchases/new' },
    { icon: InventoryIcon,      label: 'Add Product',        bg: '#d97706', route: '/products/new' },
    { icon: WarehouseIcon,      label: 'Godowns',            bg: '#0f766e', route: '/warehouses' },
    { icon: SwapHorizIcon,      label: 'Stock Transfer',     bg: '#9333ea', route: '/warehouse-transfers' },
    { icon: PeopleAltIcon,      label: 'Customers',          bg: '#db2777', route: '/customers' },
    { icon: StorefrontIcon,     label: 'Suppliers',          bg: '#be185d', route: '/suppliers' },
  ];

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
            {greeting()}, {user?.firstName || 'Admin'} 👋
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Inventory Management — {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <motion.button
            whileTap={{ rotate: 180 }}
            onClick={() => refetch()}
            className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 shadow-sm"
          >
            <RefreshIcon sx={{ fontSize: 16 }} /> Refresh
          </motion.button>
          <button
            onClick={() => navigate('/pos')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-sm"
            style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}
          >
            <PointOfSaleIcon sx={{ fontSize: 16 }} /> Open POS
          </button>
        </div>
      </div>

      {/* ── Quick Actions ─────────────────────────────────────── */}
      <div>
        <h2 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-3">Quick Actions</h2>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
          {quickActions.map((a) => (
            <QuickAction key={a.label} icon={a.icon} label={a.label} bg={a.bg} onClick={() => navigate(a.route)} />
          ))}
        </div>
      </div>

      {/* ── KPI Cards ─────────────────────────────────────────── */}
      <div>
        <h2 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-3">Key Metrics</h2>
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiCards.map((k, i) => (
            <KPICard
              key={k.label}
              {...k}
              loading={isLoading}
              onClick={() => navigate(k.route)}
            />
          ))}
        </div>
      </div>

      {/* ── Charts Row ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Trend */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
              <TrendingUpIcon sx={{ fontSize: 18, color: '#4f46e5' }} />
              Sales Trend
            </h3>
            <span className="text-2xs text-slate-400 font-semibold">Last 7 days</span>
          </div>
          {salesChart.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-slate-300 text-sm">
              No sales data yet. Create your first invoice!
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={salesChart}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="_id" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `₹${v/1000}k`} />
                <Tooltip formatter={(v) => [`₹${fmt(v)}`, 'Sales']} />
                <Area type="monotone" dataKey="total" stroke="#4f46e5" strokeWidth={2} fill="url(#salesGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Low Stock Alert */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
              <WarningAmberIcon sx={{ fontSize: 18, color: '#f59e0b' }} />
              Low Stock Alerts
            </h3>
            <button
              onClick={() => navigate('/inventory')}
              className="text-2xs text-indigo-600 hover:underline font-bold"
            >
              View All →
            </button>
          </div>
          {lowStock.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-slate-300 gap-2">
              <EmojiEventsIcon sx={{ fontSize: 36, color: '#86efac' }} />
              <p className="text-sm font-bold text-slate-500">All stock levels are healthy!</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {lowStock.map((p) => (
                <div
                  key={p._id}
                  onClick={() => navigate(`/products/${p._id}`)}
                  className="flex items-center justify-between p-2.5 bg-amber-50/50 border border-amber-100 rounded-xl cursor-pointer hover:bg-amber-50 transition"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">{p.name}</p>
                    <p className="text-2xs text-slate-500 font-mono">{p.sku}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black text-rose-600">{p.currentStock} left</span>
                    <p className="text-2xs text-slate-400">min: {p.minStockLevel}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Recent Transactions ───────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
            <ReceiptLongIcon sx={{ fontSize: 18, color: '#059669' }} />
            Recent Sales Transactions
          </h3>
          <button onClick={() => navigate('/sales')} className="text-2xs text-indigo-600 hover:underline font-bold">
            View All →
          </button>
        </div>
        {recentSales.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-sm">
            No sales yet. <button className="text-indigo-600 font-bold hover:underline" onClick={() => navigate('/pos')}>Create your first POS sale →</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-2 px-3 font-bold text-slate-400 uppercase tracking-wider">Invoice</th>
                  <th className="text-left py-2 px-3 font-bold text-slate-400 uppercase tracking-wider">Customer</th>
                  <th className="text-left py-2 px-3 font-bold text-slate-400 uppercase tracking-wider">Date</th>
                  <th className="text-right py-2 px-3 font-bold text-slate-400 uppercase tracking-wider">Amount</th>
                  <th className="text-center py-2 px-3 font-bold text-slate-400 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {recentSales.slice(0, 8).map((s) => (
                  <tr
                    key={s._id}
                    className="hover:bg-slate-50 cursor-pointer transition"
                    onClick={() => navigate(`/sales/${s._id}`)}
                  >
                    <td className="py-2.5 px-3 font-mono font-bold text-indigo-700">{s.invoiceNumber}</td>
                    <td className="py-2.5 px-3 text-slate-700">{s.customer?.name || 'Walk-in'}</td>
                    <td className="py-2.5 px-3 text-slate-500">{new Date(s.saleDate || s.createdAt).toLocaleDateString('en-IN')}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-black text-slate-900">₹{fmt(s.totalAmount)}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-2xs font-bold border ${
                        s.paymentStatus === 'paid'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : s.paymentStatus === 'partial'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                        {s.paymentStatus?.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

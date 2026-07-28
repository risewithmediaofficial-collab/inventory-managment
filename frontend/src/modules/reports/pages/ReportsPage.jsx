import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, TrendingUp, DollarSign, Package, AlertTriangle, ShoppingCart, BarChart3 } from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from 'recharts';
import api from '@services/axios.js';

const fmt = (n) => `₹${(n || 0).toLocaleString('en-IN')}`;
const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const StatCard = ({ label, value, sub, color = 'text-gray-900', icon: Icon, iconBg }) => (
  <div className="card p-5 flex items-start gap-4">
    {Icon && (
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg || 'bg-brand-50'}`}>
        <Icon size={18} className={color} />
      </div>
    )}
    <div>
      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</div>
      <div className={`text-2xl font-bold mt-1 ${color}`}>{value}</div>
      {sub && <div className="text-xs text-gray-500 mt-0.5">{sub}</div>}
    </div>
  </div>
);

export default function ReportsPage() {
  const [reportType, setReportType] = useState('sales');

  const { data: salesData, isLoading: salesLoading } = useQuery({
    queryKey: ['reports', 'sales'],
    queryFn: () => api.get('/reports/sales'),
  });
  const { data: inventoryData, isLoading: invLoading } = useQuery({
    queryKey: ['reports', 'inventory'],
    queryFn: () => api.get('/reports/inventory'),
  });
  const { data: plData, isLoading: plLoading } = useQuery({
    queryKey: ['reports', 'profit-loss'],
    queryFn: () => api.get('/reports/profit-loss'),
    enabled: reportType === 'profit',
  });

  // Sales
  const summary = salesData?.data?.summary || salesData?.summary || {};
  const topProducts = salesData?.data?.topProducts || salesData?.topProducts || [];
  const monthlyTrend = salesData?.data?.monthlyTrend || salesData?.monthlyTrend || [];
  const topCustomers = salesData?.data?.topCustomers || salesData?.topCustomers || [];

  // Inventory
  const invSummary = inventoryData?.data?.summary || inventoryData?.summary || {};
  const inventoryList = inventoryData?.data?.inventoryList || inventoryData?.inventoryList || [];
  const categoryBreakdown = inventoryData?.data?.categoryBreakdown || inventoryData?.categoryBreakdown || [];

  // Profit & Loss
  const revenue = plData?.data?.revenue || plData?.revenue || {};
  const expenses = plData?.data?.expenses || plData?.expenses || {};
  const profit = plData?.data?.profit || plData?.profit || {};

  const tabs = [
    { key: 'sales', label: 'Sales Summary' },
    { key: 'inventory', label: 'Inventory Valuation' },
    { key: 'profit', label: 'Profit & Loss' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Business Analytics & Reports</h1>
          <p className="page-subtitle">Rich insights into sales performance and stock movement</p>
        </div>
        <button onClick={() => window.print()} className="btn-secondary btn-sm gap-2">
          <Download size={14} /> Export Report
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setReportType(key)}
            className={`px-4 py-2 text-sm rounded-lg font-medium transition-all ${
              reportType === key
                ? 'bg-brand-600 text-white shadow-sm'
                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── SALES TAB ── */}
      {reportType === 'sales' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard label="Total Sales Volume" value={fmt(summary.totalRevenue)} sub={`${summary.totalInvoices || 0} invoices issued`} icon={TrendingUp} iconBg="bg-brand-50" color="text-brand-600" />
            <StatCard label="Collected Revenue" value={fmt(summary.totalPaid)} sub="Received in account" icon={DollarSign} iconBg="bg-green-50" color="text-success" />
            <StatCard label="Outstanding Receivables" value={fmt(summary.totalDue)} sub="Pending payments" icon={AlertTriangle} iconBg="bg-red-50" color="text-danger" />
          </div>

          {/* Monthly trend */}
          <div className="card p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Monthly Revenue Trend</h3>
            {monthlyTrend.length === 0 ? (
              <div className="flex items-center justify-center h-40 text-gray-400 text-sm">No monthly data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v) => [`₹${v.toLocaleString('en-IN')}`, 'Revenue']} />
                  <Line type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Top Products & Top Customers side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="card p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Top Performing Products</h3>
              {topProducts.length === 0 ? (
                <div className="flex items-center justify-center h-40 text-gray-400 text-sm">No sales data yet</div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={topProducts.slice(0, 8)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#6b7280' }} width={100} />
                    <Tooltip formatter={(v) => [v, 'Qty Sold']} />
                    <Bar dataKey="totalQty" name="Units Sold" fill="#6366f1" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="card p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Top Customers by Revenue</h3>
              {topCustomers.length === 0 ? (
                <div className="flex items-center justify-center h-40 text-gray-400 text-sm">No customer data yet</div>
              ) : (
                <div className="space-y-3">
                  {topCustomers.map((c, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center">
                          <span className="text-brand-700 text-xs font-bold">{i + 1}</span>
                        </div>
                        <span className="text-sm font-medium text-gray-800">{c.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-gray-900">{fmt(c.totalSpent)}</div>
                        <div className="text-xs text-gray-400">{c.totalOrders} orders</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ── INVENTORY TAB ── */}
      {reportType === 'inventory' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard label="Total Products" value={invSummary.totalProducts || 0} sub="Active products" icon={Package} iconBg="bg-brand-50" color="text-brand-600" />
            <StatCard label="Stock Value (Cost)" value={fmt(invSummary.totalStockValue)} sub="At purchase price" icon={DollarSign} iconBg="bg-green-50" color="text-success" />
            <StatCard label="Retail Value" value={fmt(invSummary.totalRetailValue)} sub="At selling price" icon={TrendingUp} iconBg="bg-purple-50" color="text-purple-600" />
            <StatCard label="Potential Profit" value={fmt(invSummary.potentialProfit)} sub="If sold at MRP" icon={BarChart3} iconBg="bg-yellow-50" color="text-yellow-600" />
            <StatCard label="Low Stock Items" value={invSummary.lowStockCount || 0} sub="Below minimum level" icon={AlertTriangle} iconBg="bg-orange-50" color="text-orange-500" />
            <StatCard label="Out of Stock" value={invSummary.outOfStockCount || 0} sub="Zero stock" icon={AlertTriangle} iconBg="bg-red-50" color="text-danger" />
          </div>

          {/* Category breakdown pie */}
          {categoryBreakdown.length > 0 && (
            <div className="card p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Stock Value by Category</h3>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={categoryBreakdown} dataKey="stockValue" nameKey="category" cx="50%" cy="50%" outerRadius={90} label={({ category, percent }) => `${category} (${(percent * 100).toFixed(0)}%)`} labelLine>
                    {categoryBreakdown.map((_, idx) => (
                      <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => [fmt(v), 'Stock Value']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Inventory table */}
          <div className="card overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">Inventory Valuation List</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Product</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Category</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Stock</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Cost Price</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Stock Value</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {inventoryList.length === 0 ? (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No inventory data</td></tr>
                  ) : inventoryList.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{p.name}</div>
                        <div className="text-xs text-gray-400">{p.sku}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{p.category}</td>
                      <td className="px-4 py-3 text-right font-medium">{p.currentStock} {p.unit}</td>
                      <td className="px-4 py-3 text-right text-gray-600">{fmt(p.purchasePrice)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900">{fmt(p.stockValue)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`badge text-xs ${p.status === 'in_stock' ? 'badge-success' : p.status === 'low_stock' ? 'bg-orange-100 text-orange-700' : 'badge-danger'}`}>
                          {p.status === 'in_stock' ? 'In Stock' : p.status === 'low_stock' ? 'Low Stock' : 'Out of Stock'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ── PROFIT & LOSS TAB ── */}
      {reportType === 'profit' && (
        <>
          {plLoading ? (
            <div className="card p-8 text-center text-gray-400">Loading P&L data...</div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <StatCard label="Gross Revenue" value={fmt(revenue.gross)} sub="Total invoiced" icon={TrendingUp} iconBg="bg-brand-50" color="text-brand-600" />
                <StatCard label="Net Revenue" value={fmt(revenue.net)} sub="After tax deduction" icon={DollarSign} iconBg="bg-green-50" color="text-success" />
                <StatCard label="Cost of Goods Sold" value={fmt(expenses.cogs)} sub="Total purchases" icon={ShoppingCart} iconBg="bg-red-50" color="text-danger" />
              </div>

              <div className="card p-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-6">Profit & Loss Summary</h3>
                <div className="space-y-4">
                  {[
                    { label: 'Gross Revenue', value: revenue.gross, color: 'text-gray-900', bold: false },
                    { label: 'Tax Collected', value: revenue.tax, color: 'text-gray-500', bold: false, indent: true },
                    { label: 'Discount Given', value: revenue.discount, color: 'text-gray-500', bold: false, indent: true },
                    { label: 'Net Revenue', value: revenue.net, color: 'text-brand-600', bold: true, border: true },
                    { label: 'Cost of Goods Sold (COGS)', value: expenses.cogs, color: 'text-danger', bold: false },
                    { label: 'Gross Profit', value: profit.gross, color: profit.gross >= 0 ? 'text-success' : 'text-danger', bold: true, border: true },
                  ].map((row, i) => (
                    <div key={i} className={`flex items-center justify-between py-2 ${row.border ? 'border-t border-gray-200 mt-2 pt-3' : ''}`}>
                      <span className={`text-sm ${row.indent ? 'ml-4 text-gray-500' : 'text-gray-700'} ${row.bold ? 'font-semibold' : ''}`}>{row.label}</span>
                      <span className={`text-sm font-semibold ${row.color}`}>{fmt(row.value)}</span>
                    </div>
                  ))}
                  {profit.gross !== undefined && (
                    <div className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3 mt-2">
                      <span className="text-sm font-semibold text-gray-700">Gross Margin</span>
                      <span className={`text-lg font-bold ${profit.grossMarginPercent >= 0 ? 'text-success' : 'text-danger'}`}>{profit.grossMarginPercent}%</span>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

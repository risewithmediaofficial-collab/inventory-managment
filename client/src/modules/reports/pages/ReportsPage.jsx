import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, TrendingUp, DollarSign, Package, Download } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import api from '@services/axios.js';

export default function ReportsPage() {
  const [reportType, setReportType] = useState('sales');

  const { data: salesData } = useQuery({ queryKey: ['reports', 'sales'], queryFn: () => api.get('/reports/sales') });
  const { data: inventoryData } = useQuery({ queryKey: ['reports', 'inventory'], queryFn: () => api.get('/reports/inventory') });

  const summary = salesData?.data?.summary;
  const topProducts = salesData?.data?.topProducts || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Business Analytics & Reports</h1>
          <p className="page-subtitle">Rich insights into sales performance and stock movement</p>
        </div>
        <button onClick={() => window.print()} className="btn-secondary btn-sm gap-2">
          <Download size={14} /> Export Report
        </button>
      </div>

      <div className="flex gap-2">
        {[
          ['sales', 'Sales Summary'],
          ['inventory', 'Inventory Valuation'],
          ['profit', 'Profit & Loss'],
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setReportType(key)}
            className={`px-4 py-2 text-sm rounded-lg font-medium transition-all ${reportType === key ? 'bg-brand-600 text-white shadow-xs' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-5">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Sales Volume</div>
          <div className="text-2xl font-bold text-gray-900 mt-2">₹{(summary?.totalRevenue || 0).toLocaleString('en-IN')}</div>
          <div className="text-xs text-gray-500 mt-1">{summary?.totalInvoices || 0} invoices issued</div>
        </div>

        <div className="card p-5">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Collected Revenue</div>
          <div className="text-2xl font-bold text-success mt-2">₹{(summary?.totalPaid || 0).toLocaleString('en-IN')}</div>
          <div className="text-xs text-gray-500 mt-1">Received in account</div>
        </div>

        <div className="card p-5">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Outstanding Receivables</div>
          <div className="text-2xl font-bold text-danger mt-2">₹{(summary?.totalDue || 0).toLocaleString('en-IN')}</div>
          <div className="text-xs text-gray-500 mt-1">Pending payments</div>
        </div>
      </div>

      <div className="card p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Top Performing Products by Quantity</h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={topProducts.slice(0, 10)}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} />
            <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} />
            <Tooltip />
            <Bar dataKey="totalQty" name="Units Sold" fill="#6366f1" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Package, AlertTriangle, ArrowUpDown, Layers } from 'lucide-react';
import api from '@services/axios.js';
import DataTable from '@components/ui/DataTable.jsx';

const columns = [
  { key: 'name', label: 'Product', render: (v, row) => (
    <div>
      <div className="font-medium text-gray-900">{v}</div>
      <div className="text-xs text-gray-400 font-mono">{row.sku}</div>
    </div>
  )},
  { key: 'category', label: 'Category', render: (v) => <span className="badge-gray">{v?.name || '—'}</span> },
  { key: 'currentStock', label: 'Current Stock', render: (v, row) => (
    <div className="font-semibold text-gray-900">{v} <span className="text-xs text-gray-400 font-normal">{row.unit?.symbol}</span></div>
  )},
  { key: 'minStockLevel', label: 'Min Level', render: (v) => <span className="text-gray-500">{v || 0}</span> },
  { key: 'stockStatus', label: 'Stock Status', render: (_, row) => {
    const isOut = row.currentStock <= 0;
    const isLow = row.currentStock <= row.minStockLevel;
    return (
      <span className={isOut ? 'badge-danger' : isLow ? 'badge-warning' : 'badge-success'}>
        {isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'In Stock'}
      </span>
    );
  }},
  { key: 'purchasePrice', label: 'Unit Cost', render: (v) => `₹${(v || 0).toLocaleString('en-IN')}` },
  { key: 'stockValue', label: 'Stock Value', render: (_, row) => (
    <span className="font-semibold text-gray-900">
      ₹{((row.currentStock || 0) * (row.purchasePrice || 0)).toLocaleString('en-IN')}
    </span>
  )},
];

export default function InventoryPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const { data, isLoading } = useQuery({
    queryKey: ['inventory', page, search, filter],
    queryFn: () => api.get(`/products?page=${page}&limit=20&search=${search}&stockStatus=${filter === 'all' ? '' : filter}`),
  });

  const { data: statsData } = useQuery({
    queryKey: ['inventory-stats'],
    queryFn: () => api.get('/products/stats'),
  });

  const stats = statsData?.data;

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Inventory Overview</h1>
          <p className="page-subtitle">Real-time stock levels, valuations, and status tracking</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Items In Stock', value: stats?.totalProducts || 0, icon: Package, color: 'text-brand-600', bg: 'bg-brand-50' },
          { label: 'Total Valuation', value: `₹${(stats?.totalInventoryValue || 0).toLocaleString('en-IN')}`, icon: Layers, color: 'text-success', bg: 'bg-green-50' },
          { label: 'Low Stock Alerts', value: stats?.lowStock || 0, icon: AlertTriangle, color: 'text-warning', bg: 'bg-amber-50' },
          { label: 'Out of Stock', value: stats?.outOfStock || 0, icon: AlertTriangle, color: 'text-danger', bg: 'bg-red-50' },
        ].map((item) => (
          <div key={item.label} className="card p-4 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center flex-shrink-0`}>
              <item.icon size={18} className={item.color} />
            </div>
            <div>
              <div className="text-xl font-bold text-gray-900">{item.value}</div>
              <div className="text-xs text-gray-400">{item.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 mb-1">
        {[
          ['all', 'All Items'],
          ['in_stock', 'In Stock'],
          ['low_stock', 'Low Stock'],
          ['out_of_stock', 'Out of Stock'],
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => { setFilter(key); setPage(1); }}
            className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-all ${filter === key ? 'bg-brand-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
          >
            {label}
          </button>
        ))}
      </div>

      <DataTable
        data={data?.data || []}
        columns={columns}
        loading={isLoading}
        pagination={data?.pagination}
        onPageChange={setPage}
        onSearch={(q) => { setSearch(q); setPage(1); }}
        searchPlaceholder="Search inventory by item or SKU..."
        emptyTitle="No inventory records"
        emptyDescription="Product stock movements will appear here"
      />
    </div>
  );
}

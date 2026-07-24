import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Edit, Trash2, Eye, Package, AlertTriangle, BarChart2 } from 'lucide-react';
import api from '@services/axios.js';
import DataTable from '@components/ui/DataTable.jsx';
import toast from 'react-hot-toast';

const statusBadge = (status) => {
  const map = { in_stock: ['badge-success', 'In Stock'], low_stock: ['badge-warning', 'Low Stock'], out_of_stock: ['badge-danger', 'Out of Stock'] };
  const [cls, label] = map[status] || ['badge-gray', status];
  return <span className={cls}>{label}</span>;
};

export default function ProductListPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['products', page, search],
    queryFn: () => api.get(`/products?page=${page}&limit=20&search=${search}`),
  });

  const { data: statsData } = useQuery({
    queryKey: ['products', 'stats'],
    queryFn: () => api.get('/products/stats'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/products/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['products'] }); toast.success('Product deleted'); },
  });

  const columns = [
    { key: 'thumbnail', label: '', width: 48, render: (val, row) => (
      <div className="w-9 h-9 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
        {val ? <img src={val} alt={row.name} className="w-full h-full object-cover" /> : <Package size={16} className="m-auto mt-1.5 text-gray-400" />}
      </div>
    )},
    { key: 'name', label: 'Product', render: (val, row) => (
      <div>
        <div className="font-medium text-gray-900">{val}</div>
        <div className="text-xs text-gray-400 font-mono">{row.sku}</div>
      </div>
    )},
    { key: 'category', label: 'Category', render: (val) => <span className="badge-gray">{val?.name || '—'}</span> },
    { key: 'currentStock', label: 'Stock', render: (val, row) => (
      <div className="font-semibold text-gray-900">{val} <span className="text-xs text-gray-400 font-normal">{row.unit?.symbol}</span></div>
    )},
    { key: 'stockStatus', label: 'Status', render: (_, row) => {
      const status = row.currentStock <= 0 ? 'out_of_stock' : row.currentStock <= row.minStockLevel ? 'low_stock' : 'in_stock';
      return statusBadge(status);
    }},
    { key: 'sellingPrice', label: 'Price', render: (val) => <span className="font-medium">₹{val?.toLocaleString('en-IN')}</span> },
    { key: 'purchasePrice', label: 'Cost', render: (val) => <span className="text-gray-500">₹{val?.toLocaleString('en-IN')}</span> },
    { key: 'brand', label: 'Brand', render: (val) => val?.name || '—' },
  ];

  const stats = statsData?.data;

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Products</h1>
          <p className="page-subtitle">Manage your product catalog</p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Products', value: stats?.totalProducts || 0, icon: Package, color: 'brand' },
          { label: 'Inventory Value', value: `₹${(stats?.totalInventoryValue || 0).toLocaleString('en-IN')}`, icon: BarChart2, color: 'info' },
          { label: 'Low Stock', value: stats?.lowStock || 0, icon: AlertTriangle, color: 'warning' },
          { label: 'Out of Stock', value: stats?.outOfStock || 0, icon: AlertTriangle, color: 'danger' },
        ].map((s) => (
          <motion.div key={s.label} className="card p-4 flex items-center gap-4" whileHover={{ y: -1 }}>
            <div className={`w-10 h-10 rounded-xl bg-${s.color === 'brand' ? 'brand' : s.color}-50 flex items-center justify-center`}>
              <s.icon size={18} className={`text-${s.color === 'brand' ? 'brand-600' : s.color}`} />
            </div>
            <div>
              <div className="text-xl font-bold text-gray-900">{s.value}</div>
              <div className="text-xs text-gray-400">{s.label}</div>
            </div>
          </motion.div>
        ))}
      </div>

      <DataTable
        data={data?.data || []}
        columns={columns}
        loading={isLoading}
        pagination={data?.pagination}
        onPageChange={setPage}
        onSearch={(q) => { setSearch(q); setPage(1); }}
        searchPlaceholder="Search products, SKU..."
        onAdd={() => navigate('/products/new')}
        addLabel="Add Product"
        selectable
        emptyTitle="No products yet"
        emptyDescription="Start by creating your first product"
        rowActions={(row) => (
          <>
            <button onClick={() => navigate(`/products/${row._id}`)} className="btn-icon btn-ghost" title="View"><Eye size={15} /></button>
            <button onClick={() => navigate(`/products/${row._id}/edit`)} className="btn-icon btn-ghost" title="Edit"><Edit size={15} /></button>
            <button onClick={() => { if (confirm('Delete this product?')) deleteMutation.mutate(row._id); }} className="btn-icon btn-ghost text-danger hover:bg-red-50" title="Delete"><Trash2 size={15} /></button>
          </>
        )}
      />
    </div>
  );
}

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import api from '@services/axios.js';
import DataTable from '@components/ui/DataTable.jsx';
import toast from 'react-hot-toast';

// MUI Icons
import InventoryIcon from '@mui/icons-material/Inventory';
import AddBoxIcon from '@mui/icons-material/AddBox';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import RemoveShoppingCartIcon from '@mui/icons-material/RemoveShoppingCart';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CategoryIcon from '@mui/icons-material/Category';

const stockBadge = (row) => {
  const s = row.currentStock ?? 0;
  const min = row.minStockLevel ?? 0;
  if (s <= 0) return <span className="bg-rose-50 text-rose-700 border border-rose-200 text-2xs font-bold px-2 py-0.5 rounded-full">Out of Stock</span>;
  if (s <= min) return <span className="bg-amber-50 text-amber-700 border border-amber-200 text-2xs font-bold px-2 py-0.5 rounded-full">⚠ Low Stock</span>;
  return <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-2xs font-bold px-2 py-0.5 rounded-full">✓ In Stock</span>;
};

function ProductMobileCard({ product, onView, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const s = product.currentStock ?? 0;
  const min = product.minStockLevel ?? 0;
  const isOut = s <= 0;
  const isLow = s <= min && s > 0;

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-xs overflow-hidden">
      <div className="flex items-center justify-between gap-2 px-3 py-3" onClick={() => setExpanded(p => !p)}>
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {product.thumbnail
            ? <img src={product.thumbnail} alt={product.name} className="w-9 h-9 rounded-lg object-cover flex-shrink-0 border border-gray-100" />
            : <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0"><InventoryIcon sx={{ fontSize: 16, color: '#94a3b8' }} /></div>
          }
          <div className="min-w-0">
            <div className="font-bold text-gray-900 text-sm truncate">{product.name}</div>
            <div className="text-2xs font-mono text-indigo-600 font-bold mt-0.5">{product.sku || '—'}</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {stockBadge(product)}
          <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {expanded && (
        <div className="border-t border-gray-100 bg-gray-50/60 px-3 pb-3 pt-2">
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Category', value: <span className="flex items-center gap-1 text-2xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-lg"><CategoryIcon sx={{ fontSize: 11 }} />{product.category?.name || '—'}</span> },
              { label: 'Brand', value: <span className="text-xs text-slate-700 font-semibold">{product.brand?.name || '—'}</span> },
              { label: 'Selling Price', value: <span className="font-black text-sm font-mono text-slate-900">₹{product.sellingPrice?.toLocaleString('en-IN')}</span> },
              { label: 'Cost Price', value: <span className="text-xs font-mono text-slate-500">₹{product.purchasePrice?.toLocaleString('en-IN') || '—'}</span> },
              { label: 'Current Stock', value: <span className={`font-black text-sm font-mono ${isOut ? 'text-rose-600' : isLow ? 'text-amber-600' : 'text-slate-900'}`}>{s} <span className="text-2xs text-gray-400 font-normal">{product.unit?.symbol}</span></span> },
              { label: 'HSN', value: <span className="text-2xs font-mono text-gray-500">{product.hsn || '—'}</span> },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white border border-gray-100 rounded-lg px-3 py-2">
                <span className="text-2xs font-semibold text-gray-400 uppercase tracking-wider block mb-0.5">{label}</span>
                <div className="mt-0.5">{value}</div>
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-2.5">
            <button onClick={(e) => { e.stopPropagation(); onView(); }} className="flex-1 text-xs font-bold py-1.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100 hover:bg-indigo-100 transition flex items-center justify-center gap-1">
              <VisibilityIcon sx={{ fontSize: 13 }} /> View
            </button>
            <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="flex-1 text-xs font-bold py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-100 transition flex items-center justify-center gap-1">
              <EditIcon sx={{ fontSize: 13 }} /> Edit
            </button>
            <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="flex-1 text-xs font-bold py-1.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-100 hover:bg-rose-100 transition flex items-center justify-center gap-1">
              <DeleteIcon sx={{ fontSize: 13 }} /> Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

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
    onError: (err) => toast.error(err.response?.data?.message || 'Cannot delete product'),
  });

  const columns = [
    {
      key: 'thumbnail', label: '', width: 48,
      render: (val, row) => (
        <div className="w-10 h-10 rounded-xl bg-slate-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
          {val
            ? <img src={val} alt={row.name} className="w-full h-full object-cover" />
            : <InventoryIcon sx={{ fontSize: 18, color: '#94a3b8' }} />
          }
        </div>
      )
    },
    {
      key: 'name', label: 'Product / SKU',
      render: (val, row) => (
        <div>
          <div className="font-extrabold text-slate-900 text-sm">{val}</div>
          <div className="text-xs text-indigo-600 font-mono font-bold">{row.sku || '—'}</div>
          {row.hsn && <div className="text-2xs text-slate-400">HSN: {row.hsn}</div>}
        </div>
      )
    },
    {
      key: 'category', label: 'Category',
      render: (val) => (
        <span className="flex items-center gap-1 bg-slate-100 text-slate-600 text-xs font-bold px-2 py-0.5 rounded-lg">
          <CategoryIcon sx={{ fontSize: 12 }} />
          {val?.name || '—'}
        </span>
      )
    },
    {
      key: 'currentStock', label: 'Stock',
      render: (val, row) => (
        <div className="text-right">
          <span className={`font-black text-sm font-mono ${val <= 0 ? 'text-rose-600' : val <= (row.minStockLevel || 0) ? 'text-amber-600' : 'text-slate-900'}`}>
            {val ?? 0}
          </span>
          <span className="text-xs text-slate-400 ml-1">{row.unit?.symbol}</span>
        </div>
      )
    },
    { key: '_status', label: 'Status', render: (_, row) => stockBadge(row) },
    {
      key: 'sellingPrice', label: 'Price',
      render: (val, row) => (
        <div>
          <div className="font-black text-slate-900 font-mono text-sm">₹{val?.toLocaleString('en-IN')}</div>
          {row.purchasePrice > 0 && (
            <div className="text-2xs text-slate-400 font-mono">Cost: ₹{row.purchasePrice?.toLocaleString('en-IN')}</div>
          )}
        </div>
      )
    },
    {
      key: 'brand', label: 'Brand',
      render: (val) => val?.name ? (
        <span className="text-xs text-slate-600 font-semibold">{val.name}</span>
      ) : <span className="text-slate-300">—</span>
    },
  ];

  const stats = statsData?.data;
  const lowStockCount = stats?.lowStock || 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <InventoryIcon sx={{ fontSize: 26, color: '#059669' }} />
            Products
          </h1>
          <p className="text-slate-500 text-xs mt-0.5">Manage your product catalog and inventory</p>
        </div>
        <button
          onClick={() => navigate('/products/new')}
          className="flex items-center gap-2 px-4 py-2 text-white text-sm font-bold rounded-xl shadow-sm"
          style={{ background: 'linear-gradient(135deg, #059669, #0d9488)' }}
        >
          <AddBoxIcon sx={{ fontSize: 18 }} /> Add New Product
        </button>
      </div>

      {/* Low Stock Banner */}
      {lowStockCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-4 rounded-xl border border-amber-200 bg-amber-50"
        >
          <WarningAmberIcon sx={{ fontSize: 22, color: '#d97706' }} />
          <div className="flex-1">
            <p className="font-extrabold text-amber-900 text-sm">
              {lowStockCount} product{lowStockCount > 1 ? 's' : ''} with low stock levels
            </p>
            <p className="text-amber-700 text-xs">Reorder soon to avoid stockouts</p>
          </div>
          <button
            onClick={() => navigate('/inventory')}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg"
          >
            View Stock →
          </button>
        </motion.div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Products', value: stats?.totalProducts || 0,
            Icon: InventoryIcon, gradient: 'linear-gradient(135deg, #059669, #0d9488)'
          },
          {
            label: 'Inventory Value', value: `₹${(stats?.totalInventoryValue || 0).toLocaleString('en-IN')}`,
            Icon: AttachMoneyIcon, gradient: 'linear-gradient(135deg, #4f46e5, #7c3aed)'
          },
          {
            label: 'Low Stock', value: stats?.lowStock || 0,
            Icon: WarningAmberIcon, gradient: 'linear-gradient(135deg, #d97706, #ea580c)'
          },
          {
            label: 'Out of Stock', value: stats?.outOfStock || 0,
            Icon: RemoveShoppingCartIcon, gradient: 'linear-gradient(135deg, #be185d, #9f1239)'
          },
        ].map((s) => (
          <motion.div
            key={s.label}
            whileHover={{ y: -2 }}
            className="rounded-2xl p-4 shadow-sm text-white"
            style={{ background: s.gradient }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-white/70 uppercase tracking-wider">{s.label}</p>
                <p className="text-xl font-black mt-1">{s.value}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <s.Icon sx={{ fontSize: 20, color: '#fff' }} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Data Table */}
      <DataTable
        data={data?.data?.data || data?.data || []}
        columns={columns}
        loading={isLoading}
        pagination={data?.data?.pagination || data?.pagination}
        onPageChange={setPage}
        onSearch={(q) => { setSearch(q); setPage(1); }}
        searchPlaceholder="Search by product name, SKU, barcode..."
        onAdd={() => navigate('/products/new')}
        addLabel="Add Product"
        selectable
        emptyTitle="No products yet"
        emptyDescription="Create your first product to start selling"
        renderMobileCard={(row) => (
          <ProductMobileCard
            product={row}
            onView={() => navigate(`/products/${row._id}`)}
            onEdit={() => navigate(`/products/${row._id}/edit`)}
            onDelete={() => { if (confirm(`Delete "${row.name}"?`)) deleteMutation.mutate(row._id); }}
          />
        )}
        rowActions={(row) => (
          <>
            <button
              onClick={() => navigate(`/products/${row._id}`)}
              className="p-1.5 hover:bg-indigo-50 hover:text-indigo-600 text-slate-400 rounded-lg transition"
              title="View"
            >
              <VisibilityIcon sx={{ fontSize: 16 }} />
            </button>
            <button
              onClick={() => navigate(`/products/${row._id}/edit`)}
              className="p-1.5 hover:bg-emerald-50 hover:text-emerald-600 text-slate-400 rounded-lg transition"
              title="Edit"
            >
              <EditIcon sx={{ fontSize: 16 }} />
            </button>
            <button
              onClick={() => { if (confirm(`Delete "${row.name}"?`)) deleteMutation.mutate(row._id); }}
              className="p-1.5 hover:bg-rose-50 hover:text-rose-600 text-slate-400 rounded-lg transition"
              title="Delete"
            >
              <DeleteIcon sx={{ fontSize: 16 }} />
            </button>
          </>
        )}
      />
    </div>
  );
}

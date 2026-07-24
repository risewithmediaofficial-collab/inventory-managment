import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Package } from 'lucide-react';
import api from '@services/axios.js';
import { motion } from 'framer-motion';

export default function ProductViewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({ queryKey: ['product', id], queryFn: () => api.get(`/products/${id}`) });
  const product = data?.data;

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full" /></div>;
  if (!product) return null;

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="btn-ghost btn-icon"><ArrowLeft size={18} /></button>
          <div>
            <h1 className="page-title">{product.name}</h1>
            <p className="page-subtitle font-mono text-xs">{product.sku}</p>
          </div>
        </div>
        <button onClick={() => navigate(`/products/${id}/edit`)} className="btn-secondary gap-2"><Edit size={15} /> Edit</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.div className="card p-5" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Overview</h3>
          <dl className="space-y-3">
            {[
              ['Category', product.category?.name],
              ['Brand', product.brand?.name || '—'],
              ['Unit', product.unit?.name],
              ['Type', product.type],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between text-sm">
                <dt className="text-gray-500">{k}</dt>
                <dd className="font-medium text-gray-900">{v || '—'}</dd>
              </div>
            ))}
          </dl>
        </motion.div>

        <motion.div className="card p-5" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Pricing</h3>
          <dl className="space-y-3">
            {[
              ['Selling Price', `₹${product.sellingPrice?.toLocaleString('en-IN')}`],
              ['Purchase Price', `₹${product.purchasePrice?.toLocaleString('en-IN')}`],
              ['MRP', product.mrp ? `₹${product.mrp?.toLocaleString('en-IN')}` : '—'],
              ['Profit Margin', `${product.profitMargin || 0}%`],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between text-sm">
                <dt className="text-gray-500">{k}</dt>
                <dd className="font-semibold text-gray-900">{v || '—'}</dd>
              </div>
            ))}
          </dl>
        </motion.div>

        <motion.div className="card p-5" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Stock</h3>
          <div className="flex items-center justify-between mb-4">
            <div className="text-3xl font-bold text-gray-900">{product.currentStock}</div>
            <span className={`badge ${product.currentStock <= 0 ? 'badge-danger' : product.currentStock <= product.minStockLevel ? 'badge-warning' : 'badge-success'}`}>
              {product.currentStock <= 0 ? 'Out of Stock' : product.currentStock <= product.minStockLevel ? 'Low Stock' : 'In Stock'}
            </span>
          </div>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-gray-500">Min Level</dt><dd>{product.minStockLevel}</dd></div>
            <div className="flex justify-between"><dt className="text-gray-500">Opening Stock</dt><dd>{product.openingStock}</dd></div>
          </dl>
        </motion.div>
      </div>
    </div>
  );
}

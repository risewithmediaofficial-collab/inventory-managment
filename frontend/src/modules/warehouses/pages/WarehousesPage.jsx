import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Warehouse, Package, Plus, Edit2, Trash2, Search, ChevronRight,
  MapPin, Phone, X, BarChart3, ArrowLeftRight, AlertTriangle, CheckCircle
} from 'lucide-react';
import api from '@services/axios.js';
import toast from 'react-hot-toast';
import CustomSelect from '@components/ui/CustomSelect.jsx';

// ── Warehouse Create/Edit Modal ─────────────────────────────────────────
function WarehouseFormModal({ warehouse, onClose }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: warehouse?.name || '',
    code: warehouse?.code || '',
    type: warehouse?.type || 'main',
    phone: warehouse?.phone || '',
    description: warehouse?.description || '',
    address: {
      street: warehouse?.address?.street || '',
      city: warehouse?.address?.city || '',
      state: warehouse?.address?.state || '',
      pincode: warehouse?.address?.pincode || '',
    },
    isDefault: warehouse?.isDefault || false,
  });

  const mutation = useMutation({
    mutationFn: (data) =>
      warehouse
        ? api.put(`/warehouses/${warehouse._id}`, data)
        : api.post('/warehouses', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['warehouses'] });
      toast.success(warehouse ? 'Warehouse updated!' : 'Warehouse created!');
      onClose();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to save warehouse'),
  });

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));
  const setAddr = (key, val) => setForm((f) => ({ ...f, address: { ...f.address, [key]: val } }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="font-extrabold text-slate-900 text-base">
            {warehouse ? 'Edit Godown / Warehouse' : 'Add New Godown / Warehouse'}
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg"><X size={18} /></button>
        </div>

        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Godown / Warehouse Name *</label>
              <input
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder="e.g. Main Godown – Krishnagiri"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Godown Code</label>
              <input
                value={form.code}
                onChange={(e) => set('code', e.target.value)}
                placeholder="e.g. GDN-01"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Type</label>
              <CustomSelect
                value={form.type}
                onChange={(v) => set('type', v)}
                options={[
                  { value: 'main', label: 'Main Godown' },
                  { value: 'secondary', label: 'Secondary Godown' },
                  { value: 'transit', label: 'Transit / In-Transit' },
                  { value: 'damaged', label: 'Damaged / Return Stock' },
                ]}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Phone</label>
              <input
                value={form.phone}
                onChange={(e) => set('phone', e.target.value)}
                placeholder="Contact Number"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Street Address</label>
            <input
              value={form.address.street}
              onChange={(e) => setAddr('street', e.target.value)}
              placeholder="Street / Area"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">City</label>
              <input value={form.address.city} onChange={(e) => setAddr('city', e.target.value)} placeholder="City" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">State</label>
              <input value={form.address.state} onChange={(e) => setAddr('state', e.target.value)} placeholder="State" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">PIN Code</label>
              <input value={form.address.pincode} onChange={(e) => setAddr('pincode', e.target.value)} placeholder="635001" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 font-mono" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Description / Notes</label>
            <textarea
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              rows={2}
              placeholder="Optional details about this godown..."
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={(e) => set('isDefault', e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-indigo-600"
            />
            <span className="text-sm font-bold text-slate-700">Set as Default Godown</span>
          </label>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50">
          <button onClick={onClose} className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
          <button
            onClick={() => mutation.mutate(form)}
            disabled={!form.name.trim() || mutation.isPending}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-sm rounded-lg flex items-center gap-2"
          >
            {mutation.isPending && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            {warehouse ? 'Update Godown' : 'Create Godown'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Warehouse Products Panel ──────────────────────────────────────────────
function WarehouseProductsPanel({ warehouse }) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const qc = useQueryClient();

  // Fetch all products and filter by warehouseStock containing this warehouse
  const { data: productsRes, isLoading } = useQuery({
    queryKey: ['products', 'warehouse', warehouse._id],
    queryFn: () => api.get(`/products?limit=1000`),
    staleTime: 0,
  });

  const allProducts = productsRes?.data?.data || [];

  // Products with stock in this specific warehouse + products assigned to this warehouse
  const warehouseProducts = useMemo(() => {
    return allProducts.filter((p) => {
      // Check if product has stock entry for this warehouse
      const hasWarehouseStock = p.warehouseStock?.some(
        (ws) => ws.warehouse === warehouse._id || ws.warehouse?._id === warehouse._id
      );
      // Also include products where default warehouse is this one
      const isDefaultWarehouse = p.warehouse === warehouse._id || p.warehouse?._id === warehouse._id;
      return hasWarehouseStock || isDefaultWarehouse;
    });
  }, [allProducts, warehouse._id]);

  const filtered = useMemo(() => {
    if (!search.trim()) return warehouseProducts;
    const q = search.toLowerCase();
    return warehouseProducts.filter((p) =>
      p.name?.toLowerCase().includes(q) ||
      p.sku?.toLowerCase().includes(q) ||
      p.category?.name?.toLowerCase().includes(q)
    );
  }, [warehouseProducts, search]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products in this godown..."
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <button
          onClick={() => navigate('/products/new')}
          className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg"
        >
          <Plus size={13} /> Add Product to Godown
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-slate-400 text-sm">Loading stock...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-10 border border-dashed border-slate-200 rounded-xl bg-slate-50">
          <Package className="w-10 h-10 mx-auto text-slate-300 mb-2" />
          <p className="text-sm font-bold text-slate-500">No products in this godown yet</p>
          <p className="text-xs text-slate-400 mt-1">Create a product and assign it to <strong>{warehouse.name}</strong></p>
          <button
            onClick={() => navigate('/products/new')}
            className="mt-3 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg"
          >
            <Plus size={13} className="inline mr-1" />Add Product
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-3 py-2.5 text-left font-bold text-slate-500 uppercase tracking-wider">Product / SKU</th>
                <th className="px-3 py-2.5 text-left font-bold text-slate-500 uppercase tracking-wider">Category</th>
                <th className="px-3 py-2.5 text-right font-bold text-slate-500 uppercase tracking-wider">Stock</th>
                <th className="px-3 py-2.5 text-right font-bold text-slate-500 uppercase tracking-wider">Selling Price</th>
                <th className="px-3 py-2.5 text-center font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-3 py-2.5 text-center font-bold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((p) => {
                const wsEntry = p.warehouseStock?.find(
                  (ws) => ws.warehouse === warehouse._id || ws.warehouse?._id === warehouse._id
                );
                const stock = wsEntry?.quantity ?? p.currentStock ?? 0;
                const isLow = stock <= (p.minStockLevel || 0) && stock > 0;
                const isOut = stock <= 0;
                return (
                  <tr key={p._id} className="hover:bg-slate-50 transition">
                    <td className="px-3 py-3">
                      <div className="font-bold text-slate-900">{p.name}</div>
                      <div className="text-slate-400 font-mono">{p.sku || '—'}</div>
                    </td>
                    <td className="px-3 py-3">
                      <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-semibold">{p.category?.name || '—'}</span>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <span className={`font-black font-mono ${isOut ? 'text-rose-600' : isLow ? 'text-amber-600' : 'text-slate-900'}`}>
                        {stock}
                      </span>
                      {p.unit?.symbol && <span className="text-slate-400 ml-1">{p.unit.symbol}</span>}
                    </td>
                    <td className="px-3 py-3 text-right font-mono font-bold text-slate-900">₹{p.sellingPrice?.toLocaleString('en-IN')}</td>
                    <td className="px-3 py-3 text-center">
                      {isOut ? (
                        <span className="bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-full font-bold text-2xs">Out of Stock</span>
                      ) : isLow ? (
                        <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-bold text-2xs">Low Stock</span>
                      ) : (
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-bold text-2xs">In Stock</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <button
                        onClick={() => navigate(`/products/${p._id}/edit`)}
                        className="p-1.5 hover:bg-indigo-50 hover:text-indigo-700 text-slate-400 rounded-lg transition"
                        title="Edit Product"
                      >
                        <Edit2 size={13} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────
export default function WarehousesPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editWarehouse, setEditWarehouse] = useState(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);
  const [searchW, setSearchW] = useState('');

  const { data: warehousesRes, isLoading } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => api.get('/warehouses?limit=100'),
    staleTime: 0,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/warehouses/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['warehouses'] });
      toast.success('Warehouse deleted');
      if (selectedWarehouse?._id === deleteMutation.variables) setSelectedWarehouse(null);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Cannot delete warehouse with stock'),
  });

  const warehouses = warehousesRes?.data?.data || warehousesRes?.data || [];

  const filteredWarehouses = useMemo(() => {
    if (!searchW.trim()) return warehouses;
    const q = searchW.toLowerCase();
    return warehouses.filter((w) =>
      w.name?.toLowerCase().includes(q) ||
      w.code?.toLowerCase().includes(q) ||
      w.address?.city?.toLowerCase().includes(q)
    );
  }, [warehouses, searchW]);

  const typeColors = {
    main: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    secondary: 'bg-violet-50 text-violet-700 border-violet-200',
    transit: 'bg-amber-50 text-amber-700 border-amber-200',
    damaged: 'bg-rose-50 text-rose-700 border-rose-200',
    virtual: 'bg-slate-50 text-slate-600 border-slate-200',
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <Warehouse className="w-6 h-6 text-indigo-600" /> Godowns & Warehouses
          </h1>
          <p className="text-slate-500 text-xs mt-0.5">View stock per godown, manage storage locations like Vyapaar</p>
        </div>
        <button
          onClick={() => { setEditWarehouse(null); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-sm"
        >
          <Plus size={16} /> Add New Godown
        </button>
      </div>

      {/* Layout: Warehouse list (left) + Products panel (right) */}
      <div className="flex flex-col lg:flex-row gap-5">
        {/* Warehouse Cards List */}
        <div className="w-full lg:w-80 flex-shrink-0 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              value={searchW}
              onChange={(e) => setSearchW(e.target.value)}
              placeholder="Search godowns..."
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
            />
          </div>

          {isLoading ? (
            <div className="text-center py-10 text-slate-400 text-sm">Loading...</div>
          ) : filteredWarehouses.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-slate-200 rounded-xl bg-slate-50">
              <Warehouse className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-bold text-slate-500">No godowns found</p>
              <button
                onClick={() => setShowForm(true)}
                className="mt-2 text-xs text-indigo-600 font-bold hover:underline"
              >
                + Create your first godown
              </button>
            </div>
          ) : (
            filteredWarehouses.map((w) => (
              <motion.div
                key={w._id}
                whileHover={{ y: -1 }}
                onClick={() => setSelectedWarehouse(selectedWarehouse?._id === w._id ? null : w)}
                className={`cursor-pointer bg-white border rounded-xl p-4 shadow-sm transition-all ${selectedWarehouse?._id === w._id ? 'border-indigo-500 ring-2 ring-indigo-100' : 'border-slate-200 hover:border-indigo-300'}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-900 text-sm truncate">{w.name}</span>
                      {w.isDefault && (
                        <span className="text-2xs bg-indigo-600 text-white px-1.5 py-0.5 rounded font-bold flex-shrink-0">Default</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      {w.code && <code className="text-2xs font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">{w.code}</code>}
                      <span className={`text-2xs px-2 py-0.5 rounded-full border font-bold capitalize ${typeColors[w.type] || typeColors.main}`}>
                        {w.type}
                      </span>
                    </div>
                    {(w.address?.city || w.phone) && (
                      <div className="mt-1.5 space-y-0.5">
                        {w.address?.city && (
                          <div className="flex items-center gap-1 text-2xs text-slate-500">
                            <MapPin size={10} /> {w.address.city}{w.address.state ? `, ${w.address.state}` : ''}
                          </div>
                        )}
                        {w.phone && (
                          <div className="flex items-center gap-1 text-2xs text-slate-500">
                            <Phone size={10} /> {w.phone}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditWarehouse(w); setShowForm(true); }}
                      className="p-1 hover:bg-indigo-50 hover:text-indigo-600 text-slate-400 rounded"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Delete "${w.name}"?`)) deleteMutation.mutate(w._id);
                      }}
                      className="p-1 hover:bg-rose-50 hover:text-rose-600 text-slate-400 rounded"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t border-slate-100">
                  <span className="text-2xs text-indigo-600 font-bold flex items-center gap-1">
                    <Package size={11} /> View Products
                  </span>
                  <ChevronRight size={14} className={`text-slate-400 transition-transform ${selectedWarehouse?._id === w._id ? 'rotate-90' : ''}`} />
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Products Panel for selected warehouse */}
        <div className="flex-1">
          <AnimatePresence mode="wait">
            {selectedWarehouse ? (
              <motion.div
                key={selectedWarehouse._id}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm"
              >
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                  <div>
                    <h2 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                      <Warehouse size={18} className="text-indigo-600" />
                      {selectedWarehouse.name}
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Godown product stock · {selectedWarehouse.address?.city || 'No location set'}
                    </p>
                  </div>
                  <button onClick={() => setSelectedWarehouse(null)} className="p-2 hover:bg-slate-100 rounded-lg">
                    <X size={16} className="text-slate-400" />
                  </button>
                </div>
                <WarehouseProductsPanel warehouse={selectedWarehouse} />
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center p-16 text-center"
              >
                <Warehouse className="w-14 h-14 text-slate-300 mb-3" />
                <h3 className="font-extrabold text-slate-600 text-base">Select a Godown</h3>
                <p className="text-sm text-slate-400 mt-1 max-w-xs">
                  Click on any godown from the left panel to view its product stock, inventory levels, and details.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showForm && (
          <WarehouseFormModal
            warehouse={editWarehouse}
            onClose={() => { setShowForm(false); setEditWarehouse(null); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

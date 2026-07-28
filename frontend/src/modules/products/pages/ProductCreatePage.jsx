import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '@services/axios.js';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import QrCodeIcon from '@mui/icons-material/QrCode';
import LabelIcon from '@mui/icons-material/Label';
import InventoryIcon from '@mui/icons-material/Inventory';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import WarehouseIcon from '@mui/icons-material/Warehouse';
import GavelIcon from '@mui/icons-material/Gavel';
import CustomSelect from '@components/ui/CustomSelect.jsx';

const schema = z.object({
  name: z.string().min(2, 'Product Name is required'),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  hsn: z.string().optional(),
  category: z.string().optional(),
  brand: z.string().optional(),
  unit: z.string().optional(),
  tax: z.string().optional(),
  warehouse: z.string().optional(),
  sellingPrice: z.coerce.number().min(0, 'Selling price is required'),
  purchasePrice: z.coerce.number().min(0).optional(),
  mrp: z.coerce.number().min(0).optional(),
  openingStock: z.coerce.number().min(0).optional(),
  minStockLevel: z.coerce.number().min(0).optional(),
  description: z.string().optional(),
  type: z.string().optional(),
});

function FormField({ label, error, hint, children }) {
  return (
    <div className="form-group">
      <label className="input-label font-bold text-gray-800 text-xs sm:text-sm">{label}</label>
      {children}
      {hint && !error && <p className="input-hint">{hint}</p>}
      {error && <p className="input-error-msg">{error}</p>}
    </div>
  );
}

export default function ProductCreatePage() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: catsData } = useQuery({ queryKey: ['categories'], queryFn: () => api.get('/categories?limit=500') });
  const { data: brandsData } = useQuery({ queryKey: ['brands'], queryFn: () => api.get('/brands?limit=500') });
  const { data: unitsData } = useQuery({ queryKey: ['units'], queryFn: () => api.get('/units?limit=500') });
  const { data: taxesData } = useQuery({ queryKey: ['taxes'], queryFn: () => api.get('/taxes?limit=500') });
  const { data: warehousesData } = useQuery({ queryKey: ['warehouses'], queryFn: () => api.get('/warehouses?limit=500') });

  const categories = catsData?.data?.data || catsData?.data || [];
  const brands = brandsData?.data?.data || brandsData?.data || [];
  const units = unitsData?.data?.data || unitsData?.data || [];
  const taxes = taxesData?.data?.data || taxesData?.data || [];
  const warehouses = warehousesData?.data?.data || warehousesData?.data || [];

  const { register, handleSubmit, control, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { type: 'product', openingStock: 0, minStockLevel: 0, purchasePrice: 0, sellingPrice: 0 },
  });

  const mutation = useMutation({
    mutationFn: async (formData) => {
      let categoryId = formData.category;
      let unitId = formData.unit;

      if (!categoryId) {
        if (categories.length > 0) {
          categoryId = categories[0]._id;
        } else {
          const newCat = await api.post('/categories', { name: 'General' });
          categoryId = newCat.data.data._id;
        }
      }

      if (!unitId) {
        if (units.length > 0) {
          unitId = units[0]._id;
        } else {
          const newUnit = await api.post('/units', { name: 'Piece', symbol: 'pcs', type: 'piece' });
          unitId = newUnit.data.data._id;
        }
      }

      const payload = {
        ...formData,
        category: categoryId,
        unit: unitId,
        sku: formData.sku?.trim() || undefined,
        barcode: formData.barcode?.trim() || undefined,
        brand: formData.brand || undefined,
        tax: formData.tax || undefined,
        warehouse: formData.warehouse || undefined,
      };

      return api.post('/products', payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product created successfully!');
      navigate('/products');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || err.message || 'Failed to create product');
    },
  });

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-slate-100 transition">
          <ArrowBackIcon sx={{ fontSize: 20, color: '#64748b' }} />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">Create New Product</h1>
          <p className="text-xs text-slate-500">Add product with SKU, HSN code, pricing, GST, and stock details</p>
        </div>
      </div>

      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-6">
        <motion.div className="card p-5 space-y-5" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <h3 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <InventoryIcon sx={{ fontSize: 18, color: '#059669' }} /> Basic Information
          </h3>

          <FormField label="Product Name *" error={errors.name?.message}>
            <input {...register('name')} placeholder="e.g. Kajaria 600x600 Glazed Vitrified Tiles" className={`input ${errors.name ? 'input-error' : ''}`} />
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Product Code / SKU *" hint="Unique code (e.g. KAJ-6060-GVT). Auto-generated if blank." error={errors.sku?.message}>
              <div className="relative">
                <LabelIcon sx={{ fontSize: 16, color: '#94a3b8' }} className="absolute left-3 top-3" />
                <input {...register('sku')} placeholder="e.g. KAJ-6060-GVT" className="input pl-9 font-mono text-xs sm:text-sm" />
              </div>
            </FormField>

            <FormField label="HSN Code (for GST)" hint="Harmonized System of Nomenclature code for GST filing">
              <div className="relative">
                <GavelIcon sx={{ fontSize: 16, color: '#94a3b8' }} className="absolute left-3 top-3" />
                <input {...register('hsn')} placeholder="e.g. 6908 (Tiles), 3922 (Sanitaryware)" className="input pl-9 font-mono text-xs sm:text-sm" />
              </div>
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Barcode / EAN Number" hint="Barcode scanner code">
              <div className="relative">
                <QrCodeIcon sx={{ fontSize: 16, color: '#94a3b8' }} className="absolute left-3 top-3" />
                <input {...register('barcode')} placeholder="e.g. 890100100101" className="input pl-9 font-mono text-xs sm:text-sm" />
              </div>
            </FormField>

            <FormField label="Product Type">
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <CustomSelect
                    value={field.value}
                    onChange={field.onChange}
                    options={[
                      { value: 'product', label: 'Product / Goods' },
                      { value: 'service', label: 'Service' },
                      { value: 'combo', label: 'Combo Pack' },
                      { value: 'raw_material', label: 'Raw Material' },
                    ]}
                  />
                )}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Category">
              <Controller
                name="category"
                control={control}
                render={({ field }) => (
                  <CustomSelect
                    value={field.value || ''}
                    onChange={field.onChange}
                    placeholder="Select category..."
                    searchable
                    options={categories.map((c) => ({ value: c._id, label: c.name }))}
                  />
                )}
              />
            </FormField>

            <FormField label="Brand">
              <Controller
                name="brand"
                control={control}
                render={({ field }) => (
                  <CustomSelect
                    value={field.value || ''}
                    onChange={field.onChange}
                    placeholder="Select brand..."
                    searchable
                    options={brands.map((b) => ({ value: b._id, label: b.name }))}
                  />
                )}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Measurement Unit">
              <Controller
                name="unit"
                control={control}
                render={({ field }) => (
                  <CustomSelect
                    value={field.value || ''}
                    onChange={field.onChange}
                    placeholder="Select unit..."
                    searchable
                    options={units.map((u) => ({ value: u._id, label: `${u.name} (${u.symbol})` }))}
                  />
                )}
              />
            </FormField>

            <FormField label="Tax Rate (GST)">
              <Controller
                name="tax"
                control={control}
                render={({ field }) => (
                  <CustomSelect
                    value={field.value || ''}
                    onChange={field.onChange}
                    placeholder="Select tax rate..."
                    options={taxes.map((t) => ({ value: t._id, label: `${t.name} (${t.rate}%)` }))}
                  />
                )}
              />
            </FormField>
          </div>

          <FormField label="Description">
            <textarea {...register('description')} rows={3} placeholder="Optional product description and details..." className="input resize-none" />
          </FormField>
        </motion.div>

        <motion.div className="card p-5 space-y-5" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <h3 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <AttachMoneyIcon sx={{ fontSize: 18, color: '#4f46e5' }} /> Pricing & MRP
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FormField label="Selling Price (₹) *" error={errors.sellingPrice?.message}>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">₹</span>
                <input {...register('sellingPrice')} type="number" step="0.01" placeholder="0.00" className={`input pl-8 font-mono ${errors.sellingPrice ? 'input-error' : ''}`} />
              </div>
            </FormField>

            <FormField label="Purchase Price (Cost ₹)" error={errors.purchasePrice?.message}>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">₹</span>
                <input {...register('purchasePrice')} type="number" step="0.01" placeholder="0.00" className="input pl-8 font-mono" />
              </div>
            </FormField>

            <FormField label="MRP (Max Retail Price ₹)">
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">₹</span>
                <input {...register('mrp')} type="number" step="0.01" placeholder="0.00" className="input pl-8 font-mono" />
              </div>
            </FormField>
          </div>
        </motion.div>

        <motion.div className="card p-5 space-y-5" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <h3 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <WarehouseIcon sx={{ fontSize: 18, color: '#0f766e' }} /> Opening Stock & Godown
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FormField label="Opening Stock Quantity" hint="Initial stock on hand">
              <input {...register('openingStock')} type="number" step="0.001" min="0" placeholder="0" className="input font-mono" />
            </FormField>

            <FormField label="Min Stock Alert Level" hint="Low stock notification alert threshold">
              <input {...register('minStockLevel')} type="number" step="0.001" min="0" placeholder="0" className="input font-mono" />
            </FormField>

            <FormField label="Default Godown / Warehouse">
              <Controller
                name="warehouse"
                control={control}
                render={({ field }) => (
                  <CustomSelect
                    value={field.value || ''}
                    onChange={field.onChange}
                    placeholder="Select primary godown..."
                    searchable
                    options={warehouses.map((w) => ({ value: w._id, label: w.name, emoji: '📦' }))}
                  />
                )}
              />
            </FormField>
          </div>
        </motion.div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={mutation.isPending}
            className="flex items-center gap-2 px-6 py-2.5 text-white font-bold rounded-xl shadow-sm disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #059669, #0d9488)' }}
          >
            {mutation.isPending
              ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <SaveIcon sx={{ fontSize: 18 }} />}
            Save Product
          </button>
        </div>
      </form>
    </div>
  );
}

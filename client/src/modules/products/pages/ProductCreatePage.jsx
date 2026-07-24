import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import api from '@services/axios.js';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { ArrowLeft, Save } from 'lucide-react';
import Select from 'react-select';

const schema = z.object({
  name: z.string().min(2, 'Name is required'),
  sellingPrice: z.coerce.number().min(0, 'Required'),
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
      <label className="input-label">{label}</label>
      {children}
      {hint && !error && <p className="input-hint">{hint}</p>}
      {error && <p className="input-error-msg">{error}</p>}
    </div>
  );
}

export default function ProductCreatePage() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: cats } = useQuery({ queryKey: ['categories'], queryFn: () => api.get('/categories?limit=100') });
  const { data: brands } = useQuery({ queryKey: ['brands'], queryFn: () => api.get('/brands?limit=100') });
  const { data: units } = useQuery({ queryKey: ['units'], queryFn: () => api.get('/units?limit=100') });
  const { data: taxes } = useQuery({ queryKey: ['taxes'], queryFn: () => api.get('/taxes?limit=100') });
  const { data: warehouses } = useQuery({ queryKey: ['warehouses'], queryFn: () => api.get('/warehouses?limit=100') });

  const { register, handleSubmit, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { type: 'product', openingStock: 0, minStockLevel: 0, purchasePrice: 0, sellingPrice: 0 },
  });

  const mutation = useMutation({
    mutationFn: (data) => api.post('/products', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product created successfully!');
      navigate('/products');
    },
  });

  const toOption = (items) => (items || []).map((i) => ({ value: i._id, label: i.name }));

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="btn-ghost btn-icon"><ArrowLeft size={18} /></button>
        <div>
          <h1 className="page-title">Create Product</h1>
          <p className="page-subtitle">Add a new product to your catalog</p>
        </div>
      </div>

      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-6">
        <motion.div className="card p-5 space-y-5" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-3">Basic Information</h3>
          <FormField label="Product Name *" error={errors.name?.message}>
            <input {...register('name')} placeholder="Enter product name" className={`input ${errors.name ? 'input-error' : ''}`} />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Category *" error={errors.category?.message}>
              <Select options={toOption(cats?.data)} onChange={(o) => setValue('category', o?.value)} placeholder="Select category" classNamePrefix="react-select" />
            </FormField>
            <FormField label="Brand">
              <Select options={toOption(brands?.data)} onChange={(o) => setValue('brand', o?.value)} placeholder="Select brand" classNamePrefix="react-select" isClearable />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Unit *">
              <Select options={toOption(units?.data)} onChange={(o) => setValue('unit', o?.value)} placeholder="Select unit" classNamePrefix="react-select" />
            </FormField>
            <FormField label="Tax Rate">
              <Select options={toOption(taxes?.data)} onChange={(o) => setValue('tax', o?.value)} placeholder="Select tax" classNamePrefix="react-select" isClearable />
            </FormField>
          </div>
          <FormField label="Description">
            <textarea {...register('description')} rows={3} placeholder="Product description..." className="input resize-none" />
          </FormField>
        </motion.div>

        <motion.div className="card p-5 space-y-5" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-3">Pricing</h3>
          <div className="grid grid-cols-3 gap-4">
            <FormField label="Selling Price *" error={errors.sellingPrice?.message}>
              <div className="relative"><span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
              <input {...register('sellingPrice')} type="number" step="0.01" placeholder="0.00" className={`input pl-7 ${errors.sellingPrice ? 'input-error' : ''}`} /></div>
            </FormField>
            <FormField label="Purchase Price" error={errors.purchasePrice?.message}>
              <div className="relative"><span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
              <input {...register('purchasePrice')} type="number" step="0.01" placeholder="0.00" className="input pl-7" /></div>
            </FormField>
            <FormField label="MRP">
              <div className="relative"><span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
              <input {...register('mrp')} type="number" step="0.01" placeholder="0.00" className="input pl-7" /></div>
            </FormField>
          </div>
        </motion.div>

        <motion.div className="card p-5 space-y-5" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-3">Stock Setup</h3>
          <div className="grid grid-cols-3 gap-4">
            <FormField label="Opening Stock" hint="Initial quantity on hand">
              <input {...register('openingStock')} type="number" step="0.001" min="0" placeholder="0" className="input" />
            </FormField>
            <FormField label="Min Stock Level" hint="Alert threshold">
              <input {...register('minStockLevel')} type="number" step="0.001" min="0" placeholder="0" className="input" />
            </FormField>
            <FormField label="Default Warehouse">
              <Select options={(warehouses?.data || []).map((w) => ({ value: w._id, label: w.name }))}
                onChange={(o) => setValue('warehouse', o?.value)} placeholder="Select warehouse" classNamePrefix="react-select" isClearable />
            </FormField>
          </div>
        </motion.div>

        <div className="flex items-center justify-end gap-3">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={mutation.isPending} className="btn-primary gap-2">
            {mutation.isPending ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={16} />}
            Create Product
          </button>
        </div>
      </form>
    </div>
  );
}

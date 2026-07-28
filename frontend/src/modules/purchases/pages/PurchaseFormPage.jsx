// Mirrors SaleFormPage for purchases
import { useForm, useFieldArray } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Plus, Trash2, ArrowLeft, Save } from 'lucide-react';
import CustomSelect from '@components/ui/CustomSelect.jsx';
import api from '@services/axios.js';
import toast from 'react-hot-toast';

const TYPES = ['purchase_order', 'purchase_invoice', 'goods_received'];
const TYPE_LABELS = { purchase_order: 'PO', purchase_invoice: 'Invoice', goods_received: 'GRN' };

export default function PurchaseFormPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [purchaseType, setPurchaseType] = useState('purchase_invoice');

  const { data: suppliers } = useQuery({ queryKey: ['suppliers-all'], queryFn: () => api.get('/suppliers?limit=200') });
  const { data: products } = useQuery({ queryKey: ['products-all'], queryFn: () => api.get('/products?limit=500') });
  const { data: taxes } = useQuery({ queryKey: ['taxes'], queryFn: () => api.get('/taxes?limit=50') });

  const { register, handleSubmit, control, watch, setValue } = useForm({
    defaultValues: {
      status: 'draft',
      supplier: '',
      purchaseDate: new Date().toISOString().split('T')[0],
      items: [{ product: '', quantity: 1, unitPrice: 0, discount: 0, discountType: 'percent', taxRate: 0 }],
      paidAmount: 0,
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const items = watch('items');

  const calcTotals = () => items.reduce((acc, item) => {
    const qty = +item.quantity || 0, price = +item.unitPrice || 0;
    const disc = item.discountType === 'fixed' ? +item.discount || 0 : (price * qty * (+item.discount || 0)) / 100;
    const sub = price * qty - disc;
    const tax = (sub * (+item.taxRate || 0)) / 100;
    return { subtotal: acc.subtotal + sub, taxAmount: acc.taxAmount + tax, total: acc.total + sub + tax };
  }, { subtotal: 0, taxAmount: 0, total: 0 });

  const totals = calcTotals();

  const mutation = useMutation({
    mutationFn: (data) => api.post('/purchases', { ...data, type: purchaseType, totalAmount: totals.total }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['purchases'] });
      toast.success('Purchase created!');
      // axios interceptor returns response.data → { success, message, data: <purchase> }
      navigate(`/purchases/${res?.data?._id}`);
    },
    onError: (err) => toast.error(err?.message || 'Failed to create purchase'),
  });

  const supplierOptions = ((suppliers?.data) || []).map((s) => ({ value: s._id, label: s.name }));
  const productOptions = ((products?.data) || []).map((p) => ({ value: p._id, label: p.name, price: p.purchasePrice || 0 }));
  const taxOptions = ((taxes?.data) || []).map((t) => ({ value: t.rate, label: `${t.name} (${t.rate}%)` }));

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="btn-ghost btn-icon"><ArrowLeft size={18} /></button>
        <div><h1 className="page-title">New Purchase</h1><p className="page-subtitle">Create purchase order, invoice, or GRN</p></div>
      </div>

      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-5">
        <div className="card p-4 flex items-center gap-3">
          <span className="text-sm text-gray-500 font-medium">Document Type:</span>
          {TYPES.map((t) => (
            <button key={t} type="button" onClick={() => setPurchaseType(t)}
              className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-all ${purchaseType === t ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {TYPE_LABELS[t]}
            </button>
          ))}
        </div>

        <div className="card p-5 grid grid-cols-3 gap-5">
          <div className="col-span-2 form-group">
            <label className="input-label">Supplier *</label>
            <CustomSelect
              value={watch('supplier') || ''}
              onChange={(v) => setValue('supplier', v)}
              placeholder="Select supplier"
              searchable
              options={supplierOptions}
            />
          </div>
          <div className="form-group">
            <label className="input-label">Purchase Date</label>
            <input {...register('purchaseDate')} type="date" className="input" />
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Items</h3>
            <button type="button" onClick={() => append({ product: '', quantity: 1, unitPrice: 0, discount: 0, discountType: 'percent', taxRate: 0 })} className="btn-secondary btn-sm gap-1.5">
              <Plus size={13} /> Add Item
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="table min-w-[700px]">
              <thead><tr><th className="w-48">Product</th><th className="w-20">Qty</th><th className="w-28">Unit Price</th><th className="w-20">Disc %</th><th className="w-24">Tax</th><th className="text-right">Total</th><th className="w-8" /></tr></thead>
              <tbody>
                {fields.map((field, idx) => {
                  const item = items[idx] || {};
                  const sub = (+item.unitPrice || 0) * (+item.quantity || 0);
                  const tax = (sub * (+item.taxRate || 0)) / 100;
                  return (
                    <tr key={field.id}>
                      <td>
                        <CustomSelect
                          menuPortal
                          size="sm"
                          value={item.product || ''}
                          onChange={(v) => {
                            const o = productOptions.find((p) => p.value === v);
                            setValue(`items.${idx}.product`, v);
                            setValue(`items.${idx}.unitPrice`, o?.price || 0);
                          }}
                          placeholder="Select"
                          searchable
                          options={productOptions}
                        />
                      </td>
                      <td><input {...register(`items.${idx}.quantity`)} type="number" min="0.001" step="0.001" className="input py-2 px-2 text-center" /></td>
                      <td><div className="relative"><span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">₹</span><input {...register(`items.${idx}.unitPrice`)} type="number" step="0.01" className="input pl-5 py-2" /></div></td>
                      <td><input {...register(`items.${idx}.discount`)} type="number" min="0" step="0.01" className="input py-2 px-2 text-center" /></td>
                      <td>
                        <CustomSelect
                          menuPortal
                          size="sm"
                          value={item.taxRate ?? ''}
                          onChange={(v) => setValue(`items.${idx}.taxRate`, v === '' ? 0 : +v)}
                          placeholder="Tax"
                          options={taxOptions}
                        />
                      </td>
                      <td className="text-right font-semibold text-sm">₹{(sub + tax).toFixed(2)}</td>
                      <td><button type="button" onClick={() => remove(idx)} className="text-gray-300 hover:text-danger p-1"><Trash2 size={14} /></button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-5">
          <div className="card p-5 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900">Payment</h3>
            <div className="form-group">
              <label className="input-label">Paid Amount</label>
              <div className="relative"><span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span><input {...register('paidAmount')} type="number" step="0.01" className="input pl-7" /></div>
            </div>
            <div className="form-group">
              <label className="input-label">Notes</label>
              <textarea {...register('notes')} rows={2} className="input resize-none" placeholder="Optional notes..." />
            </div>
          </div>
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>₹{totals.subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Tax</span><span>₹{totals.taxAmount.toFixed(2)}</span></div>
              <div className="flex justify-between border-t border-gray-100 pt-2 font-bold text-base"><span>Total</span><span>₹{totals.total.toFixed(2)}</span></div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={mutation.isPending} className="btn-primary gap-2">
            {mutation.isPending ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={16} />}
            Save {TYPE_LABELS[purchaseType]}
          </button>
        </div>
      </form>
    </div>
  );
}

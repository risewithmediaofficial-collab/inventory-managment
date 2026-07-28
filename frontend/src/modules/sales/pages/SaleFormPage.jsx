// Sale/Purchase Form — shared invoice creation UI
import { useForm, useFieldArray } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { Plus, Trash2, ArrowLeft, Save } from 'lucide-react';
import CustomSelect from '@components/ui/CustomSelect.jsx';
import api from '@services/axios.js';
import toast from 'react-hot-toast';

const TYPES = ['quotation', 'sales_order', 'invoice'];

export default function SaleFormPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [saleType, setSaleType] = useState('invoice');

  const { data: customers } = useQuery({ queryKey: ['customers-all'], queryFn: () => api.get('/customers?limit=200') });
  const { data: products } = useQuery({ queryKey: ['products-all'], queryFn: () => api.get('/products?limit=500') });
  const { data: taxes } = useQuery({ queryKey: ['taxes'], queryFn: () => api.get('/taxes?limit=50') });

  const { register, handleSubmit, control, watch, setValue, getValues } = useForm({
    defaultValues: {
      type: 'invoice',
      status: 'draft',
      customer: '',
      saleDate: new Date().toISOString().split('T')[0],
      items: [{ product: '', quantity: 1, unitPrice: 0, discount: 0, discountType: 'percent', taxRate: 0 }],
      paidAmount: 0,
      shippingAmount: 0,
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const items = watch('items');

  const calcTotals = () => {
    return items.reduce((acc, item) => {
      const qty = +item.quantity || 0, price = +item.unitPrice || 0;
      const disc = item.discountType === 'fixed' ? +item.discount || 0 : (price * qty * (+item.discount || 0)) / 100;
      const sub = price * qty - disc;
      const tax = (sub * (+item.taxRate || 0)) / 100;
      return { subtotal: acc.subtotal + sub, taxAmount: acc.taxAmount + tax, total: acc.total + sub + tax };
    }, { subtotal: 0, taxAmount: 0, total: 0 });
  };

  const totals = calcTotals();
  const grandTotal = totals.total + (+watch('shippingAmount') || 0);

  const mutation = useMutation({
    mutationFn: (data) => api.post('/sales', { ...data, type: saleType, totalAmount: grandTotal }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['sales'] });
      toast.success('Invoice created!');
      // axios interceptor returns response.data → { success, message, data: <sale> }
      navigate(`/sales/${res?.data?._id}`);
    },
    onError: (err) => toast.error(err?.message || 'Failed to create sale'),
  });

  const customerOptions = ((customers?.data) || []).map((c) => ({ value: c._id, label: c.name }));
  const productOptions = ((products?.data) || []).map((p) => ({ value: p._id, label: p.name, price: p.sellingPrice, taxRate: p.tax?.rate || 0 }));
  const taxOptions = ((taxes?.data) || []).map((t) => ({ value: t.rate, label: `${t.name} (${t.rate}%)` }));

  const handleProductSelect = (idx, opt) => {
    if (!opt) return;
    setValue(`items.${idx}.product`, opt.value);
    setValue(`items.${idx}.unitPrice`, opt.price || 0);
    setValue(`items.${idx}.taxRate`, opt.taxRate || 0);
  };

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="btn-ghost btn-icon"><ArrowLeft size={18} /></button>
        <div><h1 className="page-title">New Sale</h1><p className="page-subtitle">Create invoice, order, or quotation</p></div>
      </div>

      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-5">
        {/* Type selector */}
        <div className="card p-4 flex items-center gap-3">
          <span className="text-sm text-gray-500 font-medium">Document Type:</span>
          {TYPES.map((t) => (
            <button key={t} type="button" onClick={() => setSaleType(t)}
              className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-all capitalize ${saleType === t ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {t.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Header */}
        <div className="card p-5 grid grid-cols-3 gap-5">
          <div className="col-span-2 form-group">
            <label className="input-label">Customer *</label>
            <CustomSelect
              value={watch('customer') || ''}
              onChange={(v) => setValue('customer', v)}
              placeholder="Select customer"
              searchable
              options={customerOptions}
            />
          </div>
          <div className="form-group">
            <label className="input-label">Date</label>
            <input {...register('saleDate')} type="date" className="input" />
          </div>
        </div>

        {/* Items */}
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Line Items</h3>
            <button type="button" onClick={() => append({ product: '', quantity: 1, unitPrice: 0, discount: 0, discountType: 'percent', taxRate: 0 })} className="btn-secondary btn-sm gap-1.5">
              <Plus size={13} /> Add Item
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="table min-w-[800px]">
              <thead><tr>
                <th className="w-48">Product</th><th className="w-20">Qty</th><th className="w-28">Unit Price</th>
                <th className="w-20">Disc %</th><th className="w-24">Tax</th><th className="text-right">Total</th><th className="w-8" />
              </tr></thead>
              <tbody>
                {fields.map((field, idx) => {
                  const item = items[idx] || {};
                  const disc = item.discountType === 'fixed' ? +item.discount || 0 : (+item.unitPrice * +item.quantity * (+item.discount || 0)) / 100;
                  const sub = (+item.unitPrice || 0) * (+item.quantity || 0) - disc;
                  const total = sub + (sub * (+item.taxRate || 0)) / 100;
                  return (
                    <tr key={field.id}>
                      <td>
                        <CustomSelect
                          menuPortal
                          size="sm"
                          value={item.product || ''}
                          onChange={(v) => handleProductSelect(idx, productOptions.find((o) => o.value === v))}
                          placeholder="Select product"
                          searchable
                          options={productOptions}
                        />
                      </td>
                      <td><input {...register(`items.${idx}.quantity`)} type="number" min="0.001" step="0.001" className="input text-center py-2 px-2" /></td>
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
                      <td className="text-right font-semibold text-sm">₹{total.toFixed(2)}</td>
                      <td><button type="button" onClick={() => remove(idx)} className="text-gray-300 hover:text-danger p-1"><Trash2 size={14} /></button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals & Payment */}
        <div className="grid grid-cols-2 gap-5">
          <div className="card p-5 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900">Payment</h3>
            <div className="form-group">
              <label className="input-label">Paid Amount</label>
              <div className="relative"><span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
              <input {...register('paidAmount')} type="number" step="0.01" className="input pl-7" /></div>
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
              <div className="flex justify-between border-t border-gray-100 pt-2 font-bold text-base">
                <span>Grand Total</span><span>₹{grandTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-success font-medium">
                <span>Paid</span><span>₹{(+watch('paidAmount') || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-danger font-semibold">
                <span>Due</span><span>₹{Math.max(0, grandTotal - (+watch('paidAmount') || 0)).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={mutation.isPending} className="btn-primary gap-2">
            {mutation.isPending ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={16} />}
            Save {saleType.replace('_', ' ')}
          </button>
        </div>
      </form>
    </div>
  );
}

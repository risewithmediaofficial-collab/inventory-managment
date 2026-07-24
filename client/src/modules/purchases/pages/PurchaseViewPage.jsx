import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Printer } from 'lucide-react';
import api from '@services/axios.js';

export default function PurchaseViewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({ queryKey: ['purchase', id], queryFn: () => api.get(`/purchases/${id}`) });
  const purchase = data?.data;

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full" /></div>;
  if (!purchase) return null;

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="btn-ghost btn-icon"><ArrowLeft size={18} /></button>
          <div>
            <h1 className="page-title">{purchase.purchaseNumber}</h1>
            <p className="page-subtitle capitalize">{purchase.type?.replace('_', ' ')} · {new Date(purchase.purchaseDate).toLocaleDateString('en-IN')}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => window.print()} className="btn-secondary gap-2"><Printer size={15} /> Print</button>
        </div>
      </div>

      <div className="card overflow-hidden">
        {/* Purchase header */}
        <div className="p-6 border-b border-gray-100 bg-gray-50">
          <div className="flex justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">{purchase.purchaseNumber}</h2>
              <span className={`badge ${purchase.paymentStatus === 'paid' ? 'badge-success' : purchase.paymentStatus === 'partial' ? 'badge-warning' : 'badge-danger'} mt-2`}>
                {purchase.paymentStatus?.toUpperCase()}
              </span>
            </div>
            <div className="text-right text-sm">
              <div className="text-gray-500">Supplier</div>
              <div className="font-semibold text-gray-900">{purchase.supplier?.name}</div>
              <div className="text-gray-400 text-xs mt-1">{purchase.supplier?.email}</div>
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="overflow-x-auto">
          <table className="table">
            <thead><tr>
              <th>#</th><th>Product</th><th>Qty</th><th>Unit Price</th><th>Discount</th><th>Tax</th><th className="text-right">Total</th>
            </tr></thead>
            <tbody>
              {(purchase.items || []).map((item, i) => (
                <tr key={i}>
                  <td className="text-gray-400">{i + 1}</td>
                  <td><div className="font-medium">{item.productName || item.product?.name}</div><div className="text-xs text-gray-400 font-mono">{item.sku}</div></td>
                  <td>{item.quantity} {item.unit?.symbol}</td>
                  <td>₹{item.unitPrice?.toLocaleString('en-IN')}</td>
                  <td>{item.discount || 0}{item.discountType === 'percent' ? '%' : ''}</td>
                  <td>{item.taxRate || 0}%</td>
                  <td className="text-right font-semibold">₹{item.total?.toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="p-6 border-t border-gray-100">
          <div className="ml-auto max-w-xs space-y-2 text-sm">
            {[
              ['Subtotal', `₹${purchase.subtotal?.toLocaleString('en-IN')}`],
              ['Tax', `₹${purchase.taxAmount?.toLocaleString('en-IN')}`],
              ['Shipping', `₹${(purchase.shippingAmount || 0).toLocaleString('en-IN')}`],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between"><span className="text-gray-500">{k}</span><span>{v}</span></div>
            ))}
            <div className="flex justify-between font-bold text-base border-t border-gray-100 pt-2">
              <span>Total</span><span>₹{purchase.totalAmount?.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-success font-medium">
              <span>Paid</span><span>₹{purchase.paidAmount?.toLocaleString('en-IN')}</span>
            </div>
            {purchase.dueAmount > 0 && (
              <div className="flex justify-between text-danger font-bold">
                <span>Due</span><span>₹{purchase.dueAmount?.toLocaleString('en-IN')}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

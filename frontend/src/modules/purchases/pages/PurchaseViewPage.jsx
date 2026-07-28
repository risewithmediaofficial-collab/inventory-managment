import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Printer, Download } from 'lucide-react';
import api from '@services/axios.js';
import { printDocument, downloadAsPDF } from '@/utils/printDocument.js';
import { buildPurchaseHTML } from '@/components/print/PurchaseTemplate.js';

export default function PurchaseViewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [downloading, setDownloading] = useState(false);

  const { data, isLoading } = useQuery({ queryKey: ['purchase', id], queryFn: () => api.get(`/purchases/${id}`) });
  const { data: settingsData } = useQuery({ queryKey: ['settings'], queryFn: () => api.get('/settings') });

  const purchase = data?.data || data;
  const company = settingsData?.data || settingsData || {};

  const handlePrint = () => {
    if (!purchase) return;
    const html = buildPurchaseHTML({ purchase, company });
    const title = `${purchase.purchaseNumber} — ${company.name || 'Purchase Order'}`;
    printDocument(html, title);
  };

  const handleDownloadPDF = async () => {
    if (!purchase) return;
    setDownloading(true);
    try {
      await downloadAsPDF('purchase-printable', `${purchase.purchaseNumber}`);
    } finally {
      setDownloading(false);
    }
  };

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full" /></div>;
  if (!purchase) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="btn-ghost btn-icon"><ArrowLeft size={18} /></button>
          <div>
            <h1 className="page-title">{purchase.purchaseNumber}</h1>
            <p className="page-subtitle capitalize">{purchase.type?.replace(/_/g, ' ')} · {new Date(purchase.purchaseDate).toLocaleDateString('en-IN')}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleDownloadPDF}
            disabled={downloading}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 disabled:opacity-60"
          >
            {downloading ? <div className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin" /> : <Download size={14} />}
            {downloading ? 'Generating...' : 'Download PDF'}
          </button>
          <button onClick={handlePrint} className="px-3 py-1.5 bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold rounded-lg flex items-center gap-1.5">
            <Printer size={14} /> Print Order
          </button>
        </div>
      </div>

      <div id="purchase-printable" className="card overflow-hidden bg-white border border-gray-200 shadow-sm">
        {/* Purchase header */}
        <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex justify-between items-start rounded-t-xl">
          <div>
            <h2 className="text-xl font-black">{company.name || company.businessName || 'Company'}</h2>
            <div className="text-xs opacity-75 mt-1">{purchase.purchaseNumber}</div>
            <div className="text-xs opacity-70 capitalize mt-0.5">{purchase.type?.replace(/_/g, ' ')}</div>
          </div>
          <div className="text-right text-xs">
            <div className="opacity-70 font-bold uppercase tracking-wider">Supplier</div>
            <div className="font-bold text-sm mt-0.5">{purchase.supplier?.name}</div>
            <div className="opacity-75">{purchase.supplier?.phone}</div>
            {purchase.supplier?.gstin && <div className="font-mono opacity-60 mt-1">GSTIN: {purchase.supplier.gstin}</div>}
            <span className={`inline-block mt-2 text-2xs font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
              purchase.paymentStatus === 'paid' ? 'bg-white/20 text-white' : purchase.paymentStatus === 'partial' ? 'bg-amber-100 text-amber-900' : 'bg-red-100 text-red-900'
            }`}>
              {purchase.paymentStatus?.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Items */}
        <div className="overflow-x-auto">
          <table className="table w-full text-xs">
            <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 uppercase tracking-wider text-2xs">
              <tr>
                <th className="p-3">#</th>
                <th className="p-3">Product</th>
                <th className="p-3 text-center">Qty</th>
                <th className="p-3 text-right">Unit Price</th>
                <th className="p-3 text-right">Discount</th>
                <th className="p-3 text-right">Tax</th>
                <th className="p-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(purchase.items || []).map((item, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="p-3 text-gray-400 font-mono">{i + 1}</td>
                  <td className="p-3">
                    <div className="font-bold text-gray-900">{item.productName || item.product?.name}</div>
                    {item.sku && <div className="text-2xs text-gray-400 font-mono">SKU: {item.sku}</div>}
                  </td>
                  <td className="p-3 text-center font-bold">{item.quantity} {item.unit?.symbol}</td>
                  <td className="p-3 text-right font-mono">₹{item.unitPrice?.toLocaleString('en-IN')}</td>
                  <td className="p-3 text-right text-gray-500">{item.discount || 0}{item.discountType === 'percent' ? '%' : ''}</td>
                  <td className="p-3 text-right text-gray-500">{item.taxRate || 0}%</td>
                  <td className="p-3 text-right font-bold text-gray-900 font-mono">₹{item.total?.toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="p-6 border-t border-gray-100 bg-gray-50/50">
          <div className="ml-auto max-w-xs space-y-1.5 text-xs">
            <div className="flex justify-between text-gray-600"><span>Subtotal</span><span className="font-mono">₹{purchase.subtotal?.toLocaleString('en-IN')}</span></div>
            <div className="flex justify-between text-gray-600"><span>GST Tax</span><span className="font-mono">₹{purchase.taxAmount?.toLocaleString('en-IN')}</span></div>
            {purchase.shippingAmount > 0 && <div className="flex justify-between text-gray-600"><span>Shipping</span><span className="font-mono">₹{purchase.shippingAmount?.toLocaleString('en-IN')}</span></div>}
            <div className="flex justify-between font-black text-sm text-emerald-700 pt-2 border-t border-gray-200">
              <span>Grand Total</span>
              <span className="font-mono">₹{purchase.totalAmount?.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-emerald-700 font-bold"><span>Amount Paid</span><span className="font-mono">₹{purchase.paidAmount?.toLocaleString('en-IN')}</span></div>
            {purchase.dueAmount > 0 && (
              <div className="flex justify-between text-rose-700 font-black"><span>Balance Due</span><span className="font-mono">₹{purchase.dueAmount?.toLocaleString('en-IN')}</span></div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-gray-100 border-t border-gray-200 flex justify-between items-center text-2xs text-gray-400">
          <span>{company.name || 'Company'} • Purchase Order</span>
          <span className="font-mono">{purchase.purchaseNumber}</span>
        </div>
      </div>
    </div>
  );
}

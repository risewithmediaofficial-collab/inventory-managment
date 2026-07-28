import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Printer, Share2, Download, CheckCircle2, ArrowRight, FileText } from 'lucide-react';
import api from '@services/axios.js';
import CustomSelect from '@components/ui/CustomSelect.jsx';
import { printDocument, downloadAsPDF } from '@/utils/printDocument.js';
import { buildSaleInvoiceHTML, buildThermalReceiptHTML } from '@/components/print/InvoiceTemplate.js';

export default function SaleViewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [printMode, setPrintMode] = useState('a4');
  const [downloading, setDownloading] = useState(false);

  const { data, isLoading } = useQuery({ queryKey: ['sale', id], queryFn: () => api.get(`/sales/${id}`) });
  const { data: settingsData } = useQuery({ queryKey: ['settings'], queryFn: () => api.get('/settings') });

  const sale = data?.data || data;
  const company = settingsData?.data || settingsData || {};

  const convertMutation = useMutation({
    mutationFn: (targetType) => api.post(`/sales/${id}/convert`, { targetType }),
    onSuccess: (res) => {
      queryClient.invalidateQueries(['sales']);
      const newSale = res?.data?.data || res?.data;
      alert(`Successfully converted to ${newSale?.invoiceNumber}`);
      navigate(`/sales/${newSale?._id}`);
    },
    onError: (err) => {
      alert(err.response?.data?.message || 'Conversion failed');
    },
  });

  const handleWhatsAppShare = () => {
    if (!sale) return;
    const text = `*Invoice: ${sale.invoiceNumber}*\nCustomer: ${sale.customer?.name || 'Customer'}\nDate: ${new Date(sale.saleDate).toLocaleDateString('en-IN')}\nTotal: ₹${sale.totalAmount?.toLocaleString('en-IN')}\nStatus: ${sale.paymentStatus?.toUpperCase()}\nThank you for doing business with us!`;
    const phone = sale.customer?.phone ? sale.customer.phone.replace(/[^0-9]/g, '') : '';
    const url = phone
      ? `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(text)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handlePrint = () => {
    if (!sale) return;
    const html = printMode === 'thermal'
      ? buildThermalReceiptHTML({ sale, company })
      : buildSaleInvoiceHTML({ sale, company });
    const title = `${sale.invoiceNumber} — ${company.name || 'Invoice'}`;
    printDocument(html, title);
  };

  const handleDownloadPDF = async () => {
    if (!sale) return;
    setDownloading(true);
    try {
      await downloadAsPDF('sale-invoice-printable', `${sale.invoiceNumber}`);
    } finally {
      setDownloading(false);
    }
  };

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full" />
    </div>
  );
  if (!sale) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-gray-100">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
              {sale.invoiceNumber}
              <span className="text-xs uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-200">
                {sale.type?.replace(/_/g, ' ')}
              </span>
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">Created on {new Date(sale.saleDate).toLocaleDateString('en-IN')}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {sale.type === 'quotation' && (
            <>
              <button
                onClick={() => convertMutation.mutate('delivery_challan')}
                disabled={convertMutation.isPending}
                className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold rounded-lg border border-amber-300 flex items-center gap-1.5"
              >
                <ArrowRight size={14} /> To Challan
              </button>
              <button
                onClick={() => convertMutation.mutate('invoice')}
                disabled={convertMutation.isPending}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5"
              >
                <CheckCircle2 size={14} /> Convert to Invoice
              </button>
            </>
          )}

          <button
            onClick={handleWhatsAppShare}
            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-lg border border-emerald-300 flex items-center gap-1.5"
          >
            <Share2 size={14} /> WhatsApp
          </button>

          <button
            onClick={handleDownloadPDF}
            disabled={downloading}
            className="px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 disabled:opacity-60"
          >
            {downloading ? (
              <div className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <Download size={14} />
            )}
            {downloading ? 'Generating...' : 'Download PDF'}
          </button>

          <button
            onClick={handlePrint}
            className="px-3 py-1.5 bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold rounded-lg flex items-center gap-1.5"
          >
            <Printer size={14} /> Print ({printMode.toUpperCase()})
          </button>

          <CustomSelect
            size="sm"
            value={printMode}
            onChange={setPrintMode}
            className="w-[140px]"
            options={[
              { value: 'a4', label: 'A4 Full' },
              { value: 'thermal', label: 'Thermal 80mm' },
            ]}
          />
        </div>
      </div>

      {/* Invoice Card — also the capture target for PDF */}
      <div
        id="sale-invoice-printable"
        className={`card overflow-hidden bg-white shadow-sm border border-gray-200 ${printMode === 'thermal' ? 'max-w-sm mx-auto font-mono text-xs' : ''}`}
      >
        {/* Invoice Header */}
        <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-brand-600 to-violet-600 text-white flex justify-between items-start rounded-t-xl">
          <div>
            <div className="text-xl font-black">{company.name || company.businessName || 'Company'}</div>
            <div className="text-xs opacity-75 mt-1">{sale.invoiceNumber}</div>
            <div className="text-xs opacity-70 capitalize mt-0.5">{sale.type?.replace(/_/g, ' ')}</div>
          </div>
          <div className="text-right">
            <div className="text-xs opacity-70 font-bold uppercase tracking-wider">Customer</div>
            <div className="font-bold text-sm mt-0.5">{sale.customer?.name}</div>
            <div className="text-xs opacity-70">{sale.customer?.phone}</div>
            {sale.customer?.gstin && <div className="text-2xs font-mono opacity-60 mt-1">GSTIN: {sale.customer.gstin}</div>}
            <span className={`inline-block mt-2 text-2xs font-extrabold uppercase px-2 py-0.5 rounded-full ${
              sale.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-800'
              : sale.paymentStatus === 'partial' ? 'bg-amber-100 text-amber-800'
              : 'bg-rose-100 text-rose-800'
            }`}>
              {sale.paymentStatus}
            </span>
          </div>
        </div>

        {/* Meta info row */}
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-100 flex flex-wrap gap-x-6 gap-y-1 text-xs text-gray-500">
          <span><span className="font-semibold text-gray-700">Date:</span> {new Date(sale.saleDate).toLocaleDateString('en-IN')}</span>
          {sale.dueDate && <span><span className="font-semibold text-gray-700">Due:</span> {new Date(sale.dueDate).toLocaleDateString('en-IN')}</span>}
          {sale.warehouse?.name && <span><span className="font-semibold text-gray-700">Warehouse:</span> {sale.warehouse.name}</span>}
          {sale.paymentMethod && <span><span className="font-semibold text-gray-700">Payment:</span> {sale.paymentMethod.toUpperCase()}</span>}
        </div>

        {/* Table items */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-100/70 text-2xs uppercase tracking-wider text-gray-500">
                <th className="p-3">#</th>
                <th className="p-3">Item Description</th>
                <th className="p-3 text-center">Qty</th>
                <th className="p-3 text-right">Rate</th>
                <th className="p-3 text-right">Tax</th>
                <th className="p-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {(sale.items || []).map((item, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="p-3 text-gray-400 font-mono">{i + 1}</td>
                  <td className="p-3">
                    <div className="font-bold text-gray-900">{item.productName || item.product?.name}</div>
                    {item.sku && <div className="text-2xs text-gray-400 font-mono">SKU: {item.sku}</div>}
                    {item.batchNumber && <div className="text-2xs text-brand-600 font-semibold">Batch: {item.batchNumber}</div>}
                  </td>
                  <td className="p-3 text-center font-bold">{item.quantity}</td>
                  <td className="p-3 text-right font-mono">₹{item.unitPrice?.toLocaleString('en-IN')}</td>
                  <td className="p-3 text-right text-gray-500 font-mono">{item.taxRate || 0}%</td>
                  <td className="p-3 text-right font-bold text-gray-900 font-mono">₹{item.total?.toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary Footer */}
        <div className="p-6 border-t border-gray-100 bg-gray-50/50">
          <div className="ml-auto max-w-xs space-y-1.5 text-xs">
            <div className="flex justify-between text-gray-600"><span>Subtotal</span><span className="font-mono">₹{sale.subtotal?.toLocaleString('en-IN')}</span></div>
            <div className="flex justify-between text-gray-600"><span>GST Tax</span><span className="font-mono">₹{sale.taxAmount?.toLocaleString('en-IN')}</span></div>
            {sale.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-600"><span>Discount</span><span className="font-mono">-₹{sale.discountAmount?.toLocaleString('en-IN')}</span></div>
            )}
            {sale.shippingAmount > 0 && (
              <div className="flex justify-between text-gray-600"><span>Shipping</span><span className="font-mono">₹{sale.shippingAmount?.toLocaleString('en-IN')}</span></div>
            )}
            <div className="flex justify-between font-black text-sm text-brand-700 pt-2 border-t border-gray-200">
              <span>Grand Total</span>
              <span className="font-mono">₹{sale.totalAmount?.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-emerald-700 font-bold"><span>Amount Paid</span><span className="font-mono">₹{sale.paidAmount?.toLocaleString('en-IN')}</span></div>
            {sale.dueAmount > 0 && (
              <div className="flex justify-between text-rose-700 font-black"><span>Balance Due</span><span className="font-mono">₹{sale.dueAmount?.toLocaleString('en-IN')}</span></div>
            )}
          </div>
        </div>

        {/* Notes */}
        {(sale.notes || sale.terms) && (
          <div className="px-6 py-4 border-t border-gray-100 grid grid-cols-2 gap-4 text-xs bg-white">
            {sale.notes && <div><div className="font-semibold text-gray-500 uppercase tracking-wider text-2xs mb-1">Notes</div><p className="text-gray-600">{sale.notes}</p></div>}
            {sale.terms && <div><div className="font-semibold text-gray-500 uppercase tracking-wider text-2xs mb-1">Terms</div><p className="text-gray-600">{sale.terms}</p></div>}
          </div>
        )}

        {/* Footer strip */}
        <div className="px-6 py-3 bg-gray-100 border-t border-gray-200 flex justify-between items-center text-2xs text-gray-400">
          <span>Thank you for your business!</span>
          <span className="font-mono">{sale.invoiceNumber}</span>
        </div>
      </div>
    </div>
  );
}

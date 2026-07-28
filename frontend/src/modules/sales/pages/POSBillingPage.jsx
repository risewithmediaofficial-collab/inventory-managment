import { useState, useRef, useMemo, useCallback } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import api from '@services/axios.js';
import toast from 'react-hot-toast';
import CustomSelect from '@components/ui/CustomSelect.jsx';
import { printDocument } from '@/utils/printDocument.js';
import { buildThermalReceiptHTML, buildSaleInvoiceHTML } from '@/components/print/InvoiceTemplate.js';
import { X, UserPlus, Phone, User } from 'lucide-react';

// MUI Icons
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import SearchIcon from '@mui/icons-material/Search';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import PrintIcon from '@mui/icons-material/Print';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import WarehouseIcon from '@mui/icons-material/Warehouse';
import PersonIcon from '@mui/icons-material/Person';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import PaymentsIcon from '@mui/icons-material/Payments';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import PhoneAndroidIcon from '@mui/icons-material/PhoneAndroid';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ClearAllIcon from '@mui/icons-material/ClearAll';
import PersonAddAltIcon from '@mui/icons-material/PersonAddAlt';

const fmt = (n) => Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Payment mode config
const PAYMENT_MODES = [
  { value: 'cash',       label: 'Cash',        Icon: PaymentsIcon,     color: '#059669' },
  { value: 'upi',        label: 'UPI / QR',    Icon: PhoneAndroidIcon, color: '#7c3aed' },
  { value: 'card',       label: 'Card',        Icon: CreditCardIcon,   color: '#0284c7' },
  { value: 'netbanking', label: 'Net Banking',  Icon: AccountBalanceIcon, color: '#0f766e' },
];

// ── Product Card ──────────────────────────────────────────────────────────────
function ProductCard({ product, onAdd }) {
  const stock = product.currentStock ?? product.stockQuantity ?? 0;
  const isOut = stock <= 0;
  return (
    <button
      onClick={() => !isOut && onAdd(product)}
      disabled={isOut}
      className={`text-left border rounded-xl p-3 transition-all flex flex-col justify-between min-h-[110px] group relative overflow-hidden ${
        isOut
          ? 'opacity-50 cursor-not-allowed bg-slate-50 border-slate-200'
          : 'bg-white hover:border-indigo-500 hover:shadow-md cursor-pointer border-slate-200'
      }`}
    >
      <div>
        <div className="flex items-start justify-between gap-1 mb-1.5">
          <span className="text-2xs font-black font-mono text-indigo-700 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded">
            {product.sku || 'ITEM'}
          </span>
          <span className="text-2xs text-slate-400">{product.category?.name || ''}</span>
        </div>
        <h4 className="font-extrabold text-slate-900 text-xs leading-tight line-clamp-2 group-hover:text-indigo-700 transition">
          {product.name}
        </h4>
      </div>
      <div className="flex justify-between items-end mt-2 pt-2 border-t border-slate-100">
        <span className="font-black text-slate-900 text-sm font-mono">₹{product.sellingPrice || 0}</span>
        <span className={`text-2xs font-bold px-1.5 py-0.5 rounded ${
          isOut ? 'bg-rose-50 text-rose-600' :
          stock <= (product.minStockLevel || 5) ? 'bg-amber-50 text-amber-600' :
          'bg-emerald-50 text-emerald-600'
        }`}>
          {isOut ? 'OUT' : `${stock} left`}
        </span>
      </div>
      {!isOut && (
        <div className="absolute inset-0 bg-indigo-600/0 group-hover:bg-indigo-600/5 transition flex items-center justify-center opacity-0 group-hover:opacity-100">
          <AddShoppingCartIcon sx={{ fontSize: 28, color: '#4f46e5' }} />
        </div>
      )}
    </button>
  );
}

// ── Cart Item Row ─────────────────────────────────────────────────────────────
function CartItemRow({ item, onQty, onDiscount, onRemove }) {
  const [editDisc, setEditDisc] = useState(false);
  const lineTotal = (item.sellingPrice * item.quantity) - (item.discountAmt || 0);
  const taxAmt = lineTotal * ((item.taxRate || 18) / 100);

  return (
    <div className="py-2.5 border-b border-slate-100 last:border-0">
      <div className="flex items-center gap-2">
        {/* Name */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-2xs font-mono font-bold text-indigo-600 bg-indigo-50 px-1.5 rounded">{item.sku}</span>
          </div>
          <p className="font-bold text-slate-900 text-xs truncate mt-0.5">{item.name}</p>
          <p className="text-2xs text-slate-400 font-mono mt-0.5">
            ₹{item.sellingPrice} × {item.quantity} {item.discountAmt > 0 && `- ₹${item.discountAmt}`}
          </p>
        </div>

        {/* Qty control */}
        <div className="flex items-center bg-slate-100 rounded-lg overflow-hidden flex-shrink-0">
          <button onClick={() => onQty(item._id, -1)} className="p-1 hover:bg-slate-200 text-slate-600 transition">
            <RemoveIcon sx={{ fontSize: 14 }} />
          </button>
          <span className="font-extrabold text-xs w-7 text-center">{item.quantity}</span>
          <button onClick={() => onQty(item._id, 1)} className="p-1 hover:bg-slate-200 text-slate-600 transition">
            <AddIcon sx={{ fontSize: 14 }} />
          </button>
        </div>

        {/* Total + delete */}
        <div className="text-right flex-shrink-0">
          <p className="font-black text-slate-900 font-mono text-xs">₹{fmt(lineTotal)}</p>
          <button onClick={() => onRemove(item._id)} className="text-rose-400 hover:text-rose-600 mt-0.5 transition">
            <DeleteOutlineIcon sx={{ fontSize: 14 }} />
          </button>
        </div>
      </div>

      {/* Inline discount */}
      {editDisc ? (
        <div className="mt-1.5 flex items-center gap-1.5">
          <LocalOfferIcon sx={{ fontSize: 12, color: '#f59e0b' }} />
          <input
            type="number"
            placeholder="Discount ₹"
            defaultValue={item.discountAmt || ''}
            onBlur={(e) => { onDiscount(item._id, Number(e.target.value)); setEditDisc(false); }}
            className="text-xs border border-amber-300 rounded px-2 py-0.5 w-24 outline-none"
            autoFocus
          />
          <span className="text-2xs text-slate-400">GST {item.taxRate || 18}% = ₹{fmt(taxAmt)}</span>
        </div>
      ) : (
        <button
          onClick={() => setEditDisc(true)}
          className="mt-0.5 text-2xs text-amber-600 hover:text-amber-800 font-bold flex items-center gap-0.5"
        >
          <LocalOfferIcon sx={{ fontSize: 11 }} /> Add Discount · GST {item.taxRate || 18}%
        </button>
      )}
    </div>
  );
}

// ── Success Receipt Modal ─────────────────────────────────────────────────────
function ReceiptModal({ invoice, onClose, onWhatsApp, company }) {
  const handlePrintReceipt = () => {
    const html = buildThermalReceiptHTML({ sale: invoice, company });
    printDocument(html, `Receipt-${invoice.invoiceNumber}`);
  };

  const handlePrintA4 = () => {
    const html = buildSaleInvoiceHTML({ sale: invoice, company });
    printDocument(html, `Invoice-${invoice.invoiceNumber}`);
  };

  const billTime = new Date(invoice.createdAt || Date.now());
  const timeStr = billTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  const dateStr = billTime.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        {/* Success header */}
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-5 text-white text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)', backgroundSize: '10px 10px' }} />
          <CheckCircleIcon sx={{ fontSize: 44, color: '#fff' }} />
          <h2 className="font-black text-lg mt-1.5">Sale Complete!</h2>
          <div className="mt-2 bg-white/20 rounded-xl px-4 py-2 inline-block">
            <p className="font-black text-base font-mono tracking-widest">{invoice.invoiceNumber}</p>
            <p className="text-emerald-100 text-2xs mt-0.5">{dateStr} · {timeStr}</p>
          </div>
        </div>

        {/* Bill summary */}
        <div className="px-5 py-4 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-400 font-semibold">Customer</span>
            <span className="font-bold text-gray-900">{invoice.customer?.name || 'Walk-in Customer'}</span>
          </div>
          {invoice.customer?.phone && (
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-400 font-semibold">Phone</span>
              <span className="font-mono text-gray-700">{invoice.customer.phone}</span>
            </div>
          )}
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-400 font-semibold">Items</span>
            <span className="font-bold text-gray-900">{invoice.items?.length || 0} item{invoice.items?.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-400 font-semibold">Payment</span>
            <span className="font-bold text-gray-900 capitalize bg-gray-100 px-2 py-0.5 rounded-md">{invoice.paymentMethod || 'cash'}</span>
          </div>
          <div className="border-t border-gray-100 pt-2 flex justify-between items-center">
            <span className="font-extrabold text-gray-900 text-sm">Total Paid</span>
            <span className="font-black text-emerald-600 text-xl font-mono">₹{(invoice.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="px-4 pb-4 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handlePrintReceipt}
              className="flex items-center justify-center gap-1.5 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition"
            >
              <PrintIcon sx={{ fontSize: 15 }} /> Thermal 80mm
            </button>
            <button
              onClick={handlePrintA4}
              className="flex items-center justify-center gap-1.5 py-2.5 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition"
            >
              <PrintIcon sx={{ fontSize: 15 }} /> Full A4 Invoice
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onWhatsApp}
              className="flex items-center justify-center gap-1.5 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-xl hover:bg-emerald-100 transition"
            >
              <WhatsAppIcon sx={{ fontSize: 15 }} /> Share WhatsApp
            </button>
            <button
              onClick={onClose}
              className="py-2 bg-gray-100 text-gray-700 text-xs font-bold rounded-xl hover:bg-gray-200 transition"
            >
              New Sale →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Quick Add Customer Modal ──────────────────────────────────────────────────
function QuickAddCustomerModal({ onClose, onCreated }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: '', phone: '', email: '', gstin: '' });
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/customers', data),
    onSuccess: (apiRes) => {
      // axios interceptor returns response.data, so apiRes = { success, message, data: <customer> }
      const newCustomer = apiRes?.data;
      qc.invalidateQueries({ queryKey: ['customers'] });
      qc.invalidateQueries({ queryKey: ['customers', 'pos'] });
      const displayName = newCustomer?.name || 'Customer';
      toast.success(`"${displayName}" added!`);
      if (newCustomer?._id) onCreated(newCustomer);
      else {
        toast.error('Customer saved but could not auto-select. Please choose from the list.');
        onClose();
      }
    },
    onError: (err) => {
      const msg = err?.message || 'Failed to add customer';
      toast.error(msg);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Name is required');
    if (!form.phone.trim()) return toast.error('Phone number is required');

    const payload = {
      name: form.name.trim(),
      phone: form.phone.trim(),
    };
    if (form.email.trim()) payload.email = form.email.trim();
    if (form.gstin.trim()) payload.gstin = form.gstin.trim().toUpperCase();

    createMutation.mutate(payload);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center">
              <PersonAddAltIcon sx={{ fontSize: 17, color: '#4f46e5' }} />
            </div>
            <div>
              <h3 className="font-extrabold text-gray-900 text-sm">Quick Add Customer</h3>
              <p className="text-2xs text-gray-400">Create and select instantly</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition">
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <div>
            <label className="text-xs font-bold text-gray-600 block mb-1">Full Name *</label>
            <div className="relative">
              <User size={14} className="absolute left-3 top-2.5 text-gray-400" />
              <input
                type="text"
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                className="input pl-9 text-sm"
                placeholder="Customer name"
                required
                autoFocus
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-600 block mb-1">Phone Number *</label>
            <div className="relative">
              <Phone size={14} className="absolute left-3 top-2.5 text-gray-400" />
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => set('phone', e.target.value)}
                className="input pl-9 text-sm font-mono"
                placeholder="9876543210"
                required
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-600 block mb-1">Email <span className="text-gray-400 font-normal">(optional)</span></label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
              className="input text-sm"
              placeholder="email@example.com"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-600 block mb-1">GSTIN <span className="text-gray-400 font-normal">(optional)</span></label>
            <input
              type="text"
              value={form.gstin}
              onChange={(e) => set('gstin', e.target.value.toUpperCase())}
              className="input text-sm font-mono uppercase"
              placeholder="22AAAAA0000A1Z5"
              maxLength={15}
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-xs font-bold hover:bg-gray-50 transition">
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="flex-1 py-2.5 rounded-xl text-white text-xs font-extrabold flex items-center justify-center gap-1.5 transition"
              style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}
            >
              {createMutation.isPending
                ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <><PersonAddAltIcon sx={{ fontSize: 15 }} /> Add & Select</>
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main POS Page ─────────────────────────────────────────────────────────────
export default function POSBillingPage() {
  const qc = useQueryClient();
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [cart, setCart] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentMode, setPaymentMode] = useState('cash');
  const [discountAll, setDiscountAll] = useState(0);
  const [lastInvoice, setLastInvoice] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const searchRef = useRef(null);

  const { data: settingsData } = useQuery({ queryKey: ['settings'], queryFn: () => api.get('/settings') });

  // Data fetching
  const { data: productsRes, isLoading: productsLoading } = useQuery({
    queryKey: ['products', 'pos'],
    queryFn: () => api.get('/products?limit=1000&sortBy=createdAt&sortOrder=desc'),
    staleTime: 30000,
  });

  const { data: customersRes } = useQuery({
    queryKey: ['customers', 'pos'],
    queryFn: () => api.get('/customers?limit=500'),
  });

  const { data: warehousesRes } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => api.get('/warehouses?limit=100'),
  });

  const allProducts = useMemo(() => {
    if (Array.isArray(productsRes?.data)) return productsRes.data;
    if (Array.isArray(productsRes?.data?.data)) return productsRes.data.data;
    if (Array.isArray(productsRes)) return productsRes;
    return [];
  }, [productsRes]);

  const customers = useMemo(() => {
    if (Array.isArray(customersRes?.data)) return customersRes.data;
    if (Array.isArray(customersRes?.data?.data)) return customersRes.data.data;
    if (Array.isArray(customersRes)) return customersRes;
    return [];
  }, [customersRes]);

  const warehouses = useMemo(() => {
    if (Array.isArray(warehousesRes?.data)) return warehousesRes.data;
    if (Array.isArray(warehousesRes?.data?.data)) return warehousesRes.data.data;
    if (Array.isArray(warehousesRes)) return warehousesRes;
    return [];
  }, [warehousesRes]);

  // Filter by warehouse + search
  const products = useMemo(() => {
    let base = allProducts;
    if (selectedWarehouse) {
      base = base.filter((p) => {
        const hasWS = p.warehouseStock?.some(
          (ws) => ws.warehouse === selectedWarehouse || ws.warehouse?._id === selectedWarehouse
        );
        const isDef = p.warehouse === selectedWarehouse || p.warehouse?._id === selectedWarehouse;
        return hasWS || isDef;
      });
    }
    if (!searchQuery.trim()) return base;
    const q = searchQuery.toLowerCase().trim();
    return base.filter((p) =>
      p.sku?.toLowerCase().includes(q) ||
      p.name?.toLowerCase().includes(q) ||
      p.barcode?.toLowerCase().includes(q) ||
      p.category?.name?.toLowerCase().includes(q)
    );
  }, [allProducts, selectedWarehouse, searchQuery]);

  const addToCart = useCallback((product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i._id === product._id);
      if (existing) {
        return prev.map((i) => i._id === product._id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, {
        _id: product._id,
        name: product.name,
        sku: product.sku || '',
        sellingPrice: product.sellingPrice || 0,
        taxRate: product.tax?.rate || 18,
        currentStock: product.currentStock ?? 0,
        quantity: 1,
        discountAmt: 0,
      }];
    });
  }, []);

  const updateQty = (id, delta) => {
    setCart((prev) =>
      prev.map((i) => i._id === id ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i)
        .filter((i) => i.quantity > 0)
    );
  };

  const setDiscount = (id, amt) => {
    setCart((prev) => prev.map((i) => i._id === id ? { ...i, discountAmt: Math.max(0, amt) } : i));
  };

  const removeItem = (id) => setCart((prev) => prev.filter((i) => i._id !== id));

  const handleBarcodeSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const match = allProducts.find((p) =>
      p.sku?.toLowerCase() === searchQuery.toLowerCase() ||
      p.barcode === searchQuery ||
      p.name?.toLowerCase() === searchQuery.toLowerCase()
    ) || products[0];
    if (match) { addToCart(match); setSearchQuery(''); }
    else toast.error('Product not found');
  };

  // Totals
  const { subtotal, totalDiscount, totalTax, grandTotal } = useMemo(() => {
    const subtotal = cart.reduce((s, i) => s + i.sellingPrice * i.quantity, 0);
    const itemDisc = cart.reduce((s, i) => s + (i.discountAmt || 0), 0);
    const totalDiscount = itemDisc + Number(discountAll);
    const taxableAmt = subtotal - totalDiscount;
    const totalTax = cart.reduce((s, i) => {
      const lineAmt = i.sellingPrice * i.quantity - (i.discountAmt || 0);
      return s + lineAmt * ((i.taxRate || 18) / 100);
    }, 0);
    return {
      subtotal,
      totalDiscount,
      totalTax,
      grandTotal: taxableAmt + totalTax,
    };
  }, [cart, discountAll]);

  const handleCheckout = async () => {
    if (cart.length === 0) return toast.error('Cart is empty — add products first');

    // Warn if no customer selected (but allow walk-in)
    if (!selectedCustomer) {
      toast(
        (t) => (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <PersonAddAltIcon sx={{ fontSize: 18, color: '#f59e0b' }} />
              <span className="font-bold text-sm text-gray-900">No customer selected</span>
            </div>
            <p className="text-xs text-gray-500">This will be billed as a Walk-in Customer. Add a customer for GST invoicing.</p>
            <div className="flex gap-2 mt-1">
              <button
                onClick={() => { toast.dismiss(t.id); setShowAddCustomer(true); }}
                className="flex-1 text-xs font-bold py-1.5 px-3 rounded-lg bg-indigo-600 text-white"
              >
                + Add Customer
              </button>
              <button
                onClick={() => { toast.dismiss(t.id); proceedCheckout(); }}
                className="flex-1 text-xs font-bold py-1.5 px-3 rounded-lg bg-gray-100 text-gray-700"
              >
                Continue Walk-in
              </button>
            </div>
          </div>
        ),
        { duration: 8000, style: { padding: '12px', maxWidth: '320px' } }
      );
      return;
    }

    proceedCheckout();
  };

  const proceedCheckout = async () => {
    setIsSubmitting(true);
    try {
      const payload = {
        type: 'invoice',
        status: 'confirmed',
        customer: selectedCustomer || undefined,
        warehouse: selectedWarehouse || undefined,
        items: cart.map((i) => ({
          product: i._id,
          productName: i.name,
          sku: i.sku,
          quantity: i.quantity,
          unitPrice: i.sellingPrice,
          discount: i.discountAmt || 0,
          discountType: 'fixed',
          taxRate: i.taxRate || 18,
        })),
        paymentMethod: paymentMode,
        paymentStatus: 'paid',
        paidAmount: grandTotal,
        discountAmount: discountAll,
      };
      const res = await api.post('/sales', payload);
      // axios interceptor returns response.data, so res = { success, message, data: <sale> }
      const invoice = res?.data || res;
      setLastInvoice(invoice);
      setCart([]);
      setDiscountAll(0);
      setSelectedCustomer('');
      qc.invalidateQueries({ queryKey: ['products', 'pos'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    } catch (err) {
      // After interceptor, err may be the parsed error object directly
      const msg = err?.message || err?.error || 'Checkout failed. Please try again.';
      toast.error(msg, { duration: 5000 });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWhatsApp = () => {
    if (!lastInvoice) return;
    const text = `*Inventory Management*\nInvoice: ${lastInvoice.invoiceNumber}\nCustomer: ${lastInvoice.customer?.name || 'Walk-in'}\nTotal: ₹${lastInvoice.totalAmount?.toFixed(2)}\n✅ PAID\n\nThank you for shopping!`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <>
      <div className="flex flex-col lg:flex-row gap-4 min-h-[calc(100vh-7rem)]">
        {/* ── Left: Product Catalog ──────────────────────────────── */}
        <div className="flex-1 flex flex-col gap-3 min-w-0">
          {/* Selectors row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {/* Godown selector */}
            <CustomSelect
              value={selectedWarehouse}
              onChange={setSelectedWarehouse}
              icon={WarehouseIcon}
              iconColor="#6366f1"
              placeholder="🏭 All Godowns / Warehouses"
              clearable
              options={warehouses.map((w) => ({
                value: w._id,
                label: w.name,
                sub: w.address?.city || w.code || '',
                emoji: '📦',
              }))}
            />
            {/* Customer selector + quick-add */}
            <div className="flex gap-2">
              <div className="flex-1 min-w-0">
                <CustomSelect
                  value={selectedCustomer}
                  onChange={setSelectedCustomer}
                  icon={PersonIcon}
                  iconColor="#f59e0b"
                  placeholder="👤 Walk-in / Cash Customer"
                  clearable
                  options={customers.map((c) => ({
                    value: c._id,
                    label: c.name,
                    sub: c.phone || '',
                    emoji: '👤',
                  }))}
                />
              </div>
              <button
                type="button"
                onClick={() => setShowAddCustomer(true)}
                title="Quick Add New Customer"
                className="flex-shrink-0 flex items-center justify-center gap-1 px-3 py-2 rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition text-xs font-bold"
              >
                <PersonAddAltIcon sx={{ fontSize: 16 }} />
                <span className="hidden sm:inline">New</span>
              </button>
            </div>
          </div>

          {/* Search bar */}
          <form onSubmit={handleBarcodeSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <SearchIcon sx={{ fontSize: 18, color: '#94a3b8' }} className="absolute left-3 top-2.5" />
              <input
                ref={searchRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={selectedWarehouse
                  ? `Search in ${warehouses.find(w => w._id === selectedWarehouse)?.name || 'godown'}...`
                  : 'Search SKU, Name, Barcode or Category...'}
                className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono outline-none focus:ring-2 focus:ring-indigo-400 shadow-sm"
                autoFocus
              />
              {searchQuery && (
                <button type="button" onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 font-bold text-sm">✕</button>
              )}
            </div>
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl text-white text-xs font-bold flex items-center gap-1.5 shadow-sm flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}
            >
              <QrCodeScannerIcon sx={{ fontSize: 16 }} /> Scan
            </button>
          </form>

          {/* Filter indicator */}
          {(searchQuery || selectedWarehouse) && (
            <div className="flex items-center justify-between text-2xs text-slate-500 font-semibold px-1">
              <span>
                Showing <strong className="text-indigo-600">{products.length}</strong> products
                {searchQuery && <> for "<strong className="text-indigo-600">{searchQuery}</strong>"</>}
              </span>
              <button onClick={() => { setSearchQuery(''); setSelectedWarehouse(''); }} className="text-indigo-600 hover:underline">
                Clear Filters
              </button>
            </div>
          )}

          {/* Product grid */}
          <div className="flex-1 bg-white rounded-2xl border border-slate-200 p-3 overflow-y-auto max-h-[55vh] grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 content-start">
            {productsLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-28 bg-slate-100 rounded-xl animate-pulse" />
              ))
            ) : products.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center py-16 text-slate-400">
                <SearchIcon sx={{ fontSize: 40, color: '#cbd5e1' }} />
                <p className="mt-2 text-sm font-semibold">No products found</p>
                <p className="text-xs text-slate-400 mt-1">Try a different search or godown</p>
              </div>
            ) : (
              products.map((p) => (
                <ProductCard key={p._id} product={p} onAdd={addToCart} />
              ))
            )}
          </div>
        </div>

        {/* ── Right: Cart & Checkout ─────────────────────────────── */}
        <div className="w-full lg:w-80 xl:w-96 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm flex-shrink-0">
          {/* Cart header */}
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PointOfSaleIcon sx={{ fontSize: 20, color: '#4f46e5' }} />
              <span className="font-extrabold text-slate-900 text-sm">POS Cart</span>
              <span className="text-2xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold">{cart.length} items</span>
            </div>
            {cart.length > 0 && (
              <button onClick={() => setCart([])} className="text-rose-400 hover:text-rose-600 text-2xs font-bold flex items-center gap-0.5">
                <ClearAllIcon sx={{ fontSize: 14 }} /> Clear
              </button>
            )}
          </div>

          {/* Cart items */}
          <div className="flex-1 overflow-y-auto px-4 min-h-[200px] max-h-[40vh]">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center py-10 text-slate-400">
                <AddShoppingCartIcon sx={{ fontSize: 40, color: '#cbd5e1' }} />
                <p className="text-sm font-bold mt-2">Cart is empty</p>
                <p className="text-xs mt-1">Click products or scan barcode</p>
              </div>
            ) : (
              cart.map((item) => (
                <CartItemRow
                  key={item._id}
                  item={item}
                  onQty={updateQty}
                  onDiscount={setDiscount}
                  onRemove={removeItem}
                />
              ))
            )}
          </div>

          {/* Totals & Checkout */}
          <div className="border-t border-slate-100 p-4 space-y-3">
            {/* Totals */}
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal</span>
                <span className="font-mono font-semibold">₹{fmt(subtotal)}</span>
              </div>
              {totalDiscount > 0 && (
                <div className="flex justify-between text-amber-600">
                  <span className="flex items-center gap-1"><LocalOfferIcon sx={{ fontSize: 12 }} /> Discount</span>
                  <span className="font-mono font-semibold">- ₹{fmt(totalDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-500">
                <span>GST / Tax</span>
                <span className="font-mono font-semibold">+ ₹{fmt(totalTax)}</span>
              </div>

              {/* Overall discount */}
              <div className="flex items-center gap-2 py-1">
                <label className="text-slate-500 flex-shrink-0 flex items-center gap-1">
                  <LocalOfferIcon sx={{ fontSize: 12, color: '#f59e0b' }} /> Overall Disc (₹)
                </label>
                <input
                  type="number"
                  min={0}
                  value={discountAll}
                  onChange={(e) => setDiscountAll(Number(e.target.value))}
                  className="flex-1 border border-slate-200 rounded-lg px-2 py-1 text-xs font-mono outline-none focus:ring-1 focus:ring-indigo-400"
                  placeholder="0"
                />
              </div>

              <div className="flex justify-between font-black text-slate-900 text-base border-t border-slate-200 pt-2">
                <span>Grand Total</span>
                <span className="text-indigo-700 font-mono">₹{fmt(grandTotal)}</span>
              </div>
            </div>

            {/* Payment mode */}
            <div className="grid grid-cols-4 gap-1.5">
              {PAYMENT_MODES.map(({ value, label, Icon, color }) => (
                <button
                  key={value}
                  onClick={() => setPaymentMode(value)}
                  className={`flex flex-col items-center gap-1 py-2 rounded-xl border text-2xs font-bold transition ${
                    paymentMode === value
                      ? 'border-transparent text-white shadow-md'
                      : 'border-slate-200 text-slate-600 bg-slate-50 hover:bg-slate-100'
                  }`}
                  style={paymentMode === value ? { background: color } : {}}
                  title={label}
                >
                  <Icon sx={{ fontSize: 18, color: paymentMode === value ? '#fff' : color }} />
                  <span className="hidden sm:block">{label}</span>
                </button>
              ))}
            </div>

            {/* Checkout button */}
            <button
              onClick={handleCheckout}
              disabled={cart.length === 0 || isSubmitting}
              className="w-full py-3 rounded-xl text-white font-extrabold flex items-center justify-center gap-2 transition disabled:opacity-50 shadow-md text-sm"
              style={{ background: 'linear-gradient(135deg, #059669, #0d9488)' }}
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <CheckCircleIcon sx={{ fontSize: 20 }} />
              )}
              {isSubmitting ? 'Processing...' : `Complete Sale · ₹${fmt(grandTotal)}`}
            </button>
          </div>
        </div>
      </div>

      {/* Success Receipt Modal */}
      {lastInvoice && (
        <ReceiptModal
          invoice={lastInvoice}
          company={settingsData?.data || {}}
          onClose={() => setLastInvoice(null)}
          onWhatsApp={handleWhatsApp}
        />
      )}

      {/* Quick Add Customer Modal */}
      {showAddCustomer && (
        <QuickAddCustomerModal
          onClose={() => setShowAddCustomer(false)}
          onCreated={(newCustomer) => {
            setSelectedCustomer(newCustomer._id);
            setShowAddCustomer(false);
            qc.invalidateQueries({ queryKey: ['customers', 'pos'] });
          }}
        />
      )}
    </>
  );
}

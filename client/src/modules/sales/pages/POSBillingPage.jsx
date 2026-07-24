import { useState, useEffect, useRef } from 'react';
import { QrCode, ShoppingBag, Plus, Minus, Trash2, Printer, CheckCircle } from 'lucide-react';
import api from '@services/axios.js';

export default function POSBillingPage() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [paymentMode, setPaymentMode] = useState('cash');
  const barcodeRef = useRef(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await api.get('/products');
        setProducts(res.data.data || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchProducts();
  }, []);

  const handleBarcodeSubmit = (e) => {
    e.preventDefault();
    const found = products.find((p) => p.sku === barcodeInput || p.barcode === barcodeInput);
    if (found) {
      addToCart(found);
      setBarcodeInput('');
    } else {
      alert('Product not found for SKU/Barcode');
    }
  };

  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item._id === product._id);
      if (existing) {
        return prev.map((item) =>
          item._id === product._id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1, discount: 0 }];
    });
  };

  const updateQuantity = (id, delta) => {
    setCart((prev) =>
      prev
        .map((item) => (item._id === id ? { ...item, quantity: item.quantity + delta } : item))
        .filter((item) => item.quantity > 0)
    );
  };

  const subtotal = cart.reduce((sum, item) => sum + item.sellingPrice * item.quantity, 0);
  const tax = subtotal * 0.18; // 18% GST estimate
  const grandTotal = subtotal + tax;

  const handleCheckout = async () => {
    if (cart.length === 0) return alert('Cart is empty');
    try {
      await api.post('/sales', {
        type: 'Invoice',
        items: cart.map((i) => ({ product: i._id, quantity: i.quantity, unitPrice: i.sellingPrice })),
        paymentMethod: paymentMode,
        paymentStatus: 'paid',
        paidAmount: grandTotal,
      });
      alert('POS Invoice generated successfully!');
      setCart([]);
    } catch (err) {
      alert(err.response?.data?.message || 'Checkout failed');
    }
  };

  return (
    <div className="h-[calc(100vh-6rem)] grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Product Catalog & Barcode Scanner */}
      <div className="lg:col-span-2 space-y-4 flex flex-col h-full">
        <form onSubmit={handleBarcodeSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <QrCode className="w-5 h-5 absolute left-3 top-3 text-slate-400" />
            <input
              ref={barcodeRef}
              type="text"
              placeholder="Scan Barcode or Enter SKU..."
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
              autoFocus
            />
          </div>
          <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium text-sm">
            Scan
          </button>
        </form>

        <div className="flex-1 bg-white rounded-xl border border-slate-200 p-4 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-4">
          {products.map((p) => (
            <button
              key={p._id}
              onClick={() => addToCart(p)}
              className="border border-slate-200 rounded-xl p-3 text-left hover:border-indigo-500 hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{p.sku}</span>
                <h4 className="font-bold text-slate-800 text-sm mt-2 line-clamp-2">{p.name}</h4>
              </div>
              <div className="mt-3 flex justify-between items-center">
                <span className="font-extrabold text-slate-900 text-base">₹{p.sellingPrice}</span>
                <span className="text-xs text-slate-400">Stock: {p.stockQuantity}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Cart & Checkout */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col h-full shadow-sm">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
          <ShoppingBag className="w-5 h-5 text-indigo-600" /> POS Billing Cart
        </h2>

        <div className="flex-1 overflow-y-auto space-y-3 divide-y divide-slate-100">
          {cart.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-400 text-sm">Scan items to start billing</div>
          ) : (
            cart.map((item) => (
              <div key={item._id} className="pt-3 flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">{item.name}</h4>
                  <p className="text-xs text-slate-500">₹{item.sellingPrice} x {item.quantity}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => updateQuantity(item._id, -1)} className="p-1 rounded bg-slate-100 hover:bg-slate-200">
                    <Minus className="w-3.5 h-3.5 text-slate-600" />
                  </button>
                  <span className="font-bold text-sm w-4 text-center">{item.quantity}</span>
                  <button onClick={() => addToCart(item)} className="p-1 rounded bg-slate-100 hover:bg-slate-200">
                    <Plus className="w-3.5 h-3.5 text-slate-600" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="border-t border-slate-200 pt-4 space-y-2 text-sm">
          <div className="flex justify-between text-slate-600">
            <span>Subtotal</span>
            <span>₹{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Estimated GST (18%)</span>
            <span>₹{tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-extrabold text-slate-900 text-lg border-t border-slate-100 pt-2">
            <span>Grand Total</span>
            <span className="text-indigo-600">₹{grandTotal.toFixed(2)}</span>
          </div>

          <div className="pt-4 space-y-3">
            <select
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value)}
              className="w-full border rounded-xl p-2.5 text-sm font-semibold border-slate-300 outline-none"
            >
              <option value="cash">Cash Payment</option>
              <option value="upi">UPI / QR Code</option>
              <option value="card">Credit / Debit Card</option>
            </select>

            <button
              onClick={handleCheckout}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl shadow-md flex items-center justify-center gap-2 transition"
            >
              <Printer className="w-5 h-5" /> Complete POS Billing & Print
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

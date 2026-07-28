/**
 * Generates a full-page HTML string for a Purchase Order / Invoice.
 */
export function buildPurchaseHTML({ purchase, company = {} }) {
  const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  const date = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  const typeLabel = (purchase.type || '').replace(/_/g, ' ').toUpperCase();
  const paymentBadgeClass = purchase.paymentStatus === 'paid' ? 'badge-paid' : purchase.paymentStatus === 'partial' ? 'badge-partial' : 'badge-unpaid';

  const companyName = company.name || company.businessName || 'Your Company';
  const companyAddress = [company.address, company.city, company.state, company.pincode].filter(Boolean).join(', ');
  const companyGST = company.gstin || company.gstNumber || '';

  const itemRows = (purchase.items || []).map((item, i) => `
    <tr class="tbody-row">
      <td class="text-center text-gray-500">${i + 1}</td>
      <td>
        <div class="font-bold text-gray-900">${item.productName || item.product?.name || '—'}</div>
        ${item.sku ? `<div style="font-family:monospace; font-size:10px; color:#9ca3af">SKU: ${item.sku}</div>` : ''}
        ${item.batchNumber ? `<div style="font-size:10px; color:#4f46e5">Batch: ${item.batchNumber}</div>` : ''}
        ${item.expiryDate ? `<div style="font-size:10px; color:#dc2626">Exp: ${date(item.expiryDate)}</div>` : ''}
      </td>
      <td class="text-center font-bold">${item.quantity} ${item.unit?.symbol || ''}</td>
      <td class="text-right" style="font-family:monospace">${fmt(item.unitPrice)}</td>
      <td class="text-right text-gray-500">${item.discount || 0}${item.discountType === 'percent' ? '%' : ''}</td>
      <td class="text-right text-gray-500">${item.taxRate || 0}%</td>
      <td class="text-right font-bold" style="font-family:monospace">${fmt(item.total)}</td>
    </tr>`).join('');

  return `
  <div style="position:relative; max-width:800px; margin:0 auto; border:1px solid #e5e7eb; border-radius:12px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.08)">

    ${purchase.paymentStatus === 'paid' ? '<div class="watermark-paid">PAID</div>' : ''}

    <!-- Header Band (Green for purchases) -->
    <div style="background:linear-gradient(135deg,#059669 0%,#0d9488 100%); color:white; padding:20px 24px; display:flex; justify-content:space-between; align-items:flex-start; border-radius:10px 10px 0 0">
      <div>
        <div style="font-size:22px; font-weight:900; letter-spacing:-0.5px">${companyName}</div>
        ${companyAddress ? `<div style="font-size:11px; opacity:0.8; margin-top:4px">${companyAddress}</div>` : ''}
        ${companyGST ? `<div style="font-size:10px; opacity:0.7; margin-top:2px; font-family:monospace">GSTIN: ${companyGST}</div>` : ''}
      </div>
      <div style="text-align:right">
        <div style="font-size:11px; opacity:0.7; text-transform:uppercase; letter-spacing:0.1em">${typeLabel}</div>
        <div style="font-size:20px; font-weight:900; margin-top:2px">${purchase.purchaseNumber || '—'}</div>
        <div style="margin-top:6px"><span class="badge ${paymentBadgeClass}">${purchase.paymentStatus || 'pending'}</span></div>
      </div>
    </div>

    <!-- Supplier & Dates Row -->
    <div style="display:flex; justify-content:space-between; padding:16px 24px; background:#fafafa; border-bottom:1px solid #e5e7eb; gap:24px">
      <div>
        <div style="font-size:10px; font-weight:700; color:#9ca3af; text-transform:uppercase; letter-spacing:0.08em; margin-bottom:4px">Supplier</div>
        <div style="font-weight:800; font-size:14px; color:#111827">${purchase.supplier?.name || '—'}</div>
        ${purchase.supplier?.phone ? `<div style="font-size:11px; color:#6b7280">📞 ${purchase.supplier.phone}</div>` : ''}
        ${purchase.supplier?.email ? `<div style="font-size:11px; color:#6b7280">✉ ${purchase.supplier.email}</div>` : ''}
        ${purchase.supplier?.gstin ? `<div style="font-size:10px; color:#9ca3af; font-family:monospace">GSTIN: ${purchase.supplier.gstin}</div>` : ''}
      </div>
      <div style="text-align:right">
        <div style="font-size:11px; color:#6b7280"><span style="font-weight:600">Order Date:</span> ${date(purchase.purchaseDate)}</div>
        ${purchase.expectedDeliveryDate ? `<div style="font-size:11px; color:#6b7280"><span style="font-weight:600">Expected Delivery:</span> ${date(purchase.expectedDeliveryDate)}</div>` : ''}
        ${purchase.deliveryDate ? `<div style="font-size:11px; color:#16a34a"><span style="font-weight:600">Delivered:</span> ${date(purchase.deliveryDate)}</div>` : ''}
        ${purchase.supplierInvoiceNumber ? `<div style="font-size:11px; color:#6b7280"><span style="font-weight:600">Supplier Inv#:</span> ${purchase.supplierInvoiceNumber}</div>` : ''}
        ${purchase.warehouse?.name ? `<div style="font-size:11px; color:#6b7280"><span style="font-weight:600">Warehouse:</span> ${purchase.warehouse.name}</div>` : ''}
      </div>
    </div>

    <!-- Items Table -->
    <table>
      <thead>
        <tr class="thead-row">
          <th class="text-center" style="width:36px">#</th>
          <th>Item Description</th>
          <th class="text-center" style="width:80px">Qty</th>
          <th class="text-right" style="width:100px">Unit Price</th>
          <th class="text-right" style="width:70px">Disc</th>
          <th class="text-right" style="width:60px">Tax</th>
          <th class="text-right" style="width:110px">Amount</th>
        </tr>
      </thead>
      <tbody>${itemRows || '<tr><td colspan="7" style="text-align:center;padding:24px;color:#9ca3af">No items</td></tr>'}</tbody>
    </table>

    <!-- Totals -->
    <div class="totals-box">
      <div style="display:flex; justify-content:flex-end">
        <div style="min-width:280px">
          <div class="total-row"><span class="text-gray-500">Subtotal</span><span style="font-family:monospace">${fmt(purchase.subtotal)}</span></div>
          ${purchase.discountAmount > 0 ? `<div class="total-row text-success"><span>Discount</span><span style="font-family:monospace">− ${fmt(purchase.discountAmount)}</span></div>` : ''}
          <div class="total-row"><span class="text-gray-500">Tax</span><span style="font-family:monospace">${fmt(purchase.taxAmount)}</span></div>
          ${purchase.shippingAmount > 0 ? `<div class="total-row"><span class="text-gray-500">Shipping</span><span style="font-family:monospace">${fmt(purchase.shippingAmount)}</span></div>` : ''}
          ${purchase.otherCharges > 0 ? `<div class="total-row"><span class="text-gray-500">Other Charges</span><span style="font-family:monospace">${fmt(purchase.otherCharges)}</span></div>` : ''}
          <div style="display:flex;justify-content:space-between;padding:10px 0 4px;font-size:16px;font-weight:900;color:#059669;border-top:2px solid #059669;margin-top:8px">
            <span>Grand Total</span><span style="font-family:monospace">${fmt(purchase.totalAmount)}</span>
          </div>
          <div class="total-row text-success font-bold" style="padding-top:6px"><span>Amount Paid</span><span style="font-family:monospace">${fmt(purchase.paidAmount)}</span></div>
          ${purchase.dueAmount > 0 ? `<div class="total-row text-danger font-bold"><span>Balance Due</span><span style="font-family:monospace">${fmt(purchase.dueAmount)}</span></div>` : ''}
        </div>
      </div>
    </div>

    <!-- Notes -->
    ${purchase.notes ? `
    <div style="padding:16px 24px; background:#fafafa; border-top:1px solid #e5e7eb">
      <div style="font-size:10px; font-weight:700; color:#9ca3af; text-transform:uppercase; margin-bottom:4px">Notes</div>
      <div style="font-size:12px; color:#4b5563">${purchase.notes}</div>
    </div>` : ''}

    <!-- Footer -->
    <div style="padding:12px 24px; background:#f3f4f6; border-top:1px solid #e5e7eb; display:flex; justify-content:space-between; align-items:center">
      <div style="font-size:10px; color:#9ca3af">${companyName} • Purchase Document</div>
      <div style="font-size:10px; color:#9ca3af; font-family:monospace">${purchase.purchaseNumber}</div>
    </div>
  </div>`;
}

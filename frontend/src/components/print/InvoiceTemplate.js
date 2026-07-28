/**
 * Professional Invoice & Receipt Templates
 * buildSaleInvoiceHTML  — Full A4 GST Invoice
 * buildThermalReceiptHTML — 80mm Thermal Receipt
 */

const rupee = (n) =>
  `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const fmtDateTime = (d) =>
  d ? new Date(d).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  }) : '—';

/** Number to words (Indian system, up to crores) */
function numberToWords(num) {
  if (!num || isNaN(num)) return '';
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const convert = (n) => {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convert(n % 100) : '');
    if (n < 100000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + convert(n % 1000) : '');
    if (n < 10000000) return convert(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + convert(n % 100000) : '');
    return convert(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + convert(n % 10000000) : '');
  };
  const intPart = Math.floor(Math.abs(num));
  const decPart = Math.round((Math.abs(num) - intPart) * 100);
  let result = convert(intPart) + ' Rupees';
  if (decPart > 0) result += ' and ' + convert(decPart) + ' Paise';
  return result + ' Only';
}

export function buildSaleInvoiceHTML({ sale, company = {} }) {
  const companyName = company.name || company.businessName || 'Inventory Management';
  const companyAddr = [company.address, company.city, company.state, company.pincode]
    .filter(Boolean).join(', ');
  const companyGST  = company.gstin || company.gstNumber || '';
  const companyPhone = company.phone || '';
  const companyEmail = company.email || '';

  const typeLabel = {
    invoice: 'TAX INVOICE',
    quotation: 'QUOTATION',
    sales_order: 'SALES ORDER',
    sales_return: 'CREDIT NOTE',
  }[sale.type] || 'TAX INVOICE';

  const isPaid = sale.paymentStatus === 'paid';
  const isReturn = sale.type === 'sales_return';

  // ── Build items table rows ──────────────────────────────────────────────
  const itemRows = (sale.items || []).map((item, i) => {
    const qty    = item.quantity || 0;
    const rate   = item.unitPrice || 0;
    const disc   = item.discount || 0;
    const taxRate= item.taxRate || 0;
    const taxableAmt = (rate * qty) - disc;
    const taxAmt = taxableAmt * taxRate / 100;
    const lineTotal = item.total ?? (taxableAmt + taxAmt);
    return `
    <tr style="border-bottom:1px solid #f1f5f9">
      <td style="padding:10px 12px; color:#64748b; font-size:11px; text-align:center; vertical-align:top">${i + 1}</td>
      <td style="padding:10px 12px; vertical-align:top">
        <div style="font-weight:700; color:#0f172a; font-size:12px">${item.productName || item.product?.name || '—'}</div>
        ${item.sku ? `<div style="font-size:10px; color:#94a3b8; font-family:monospace; margin-top:2px">SKU: ${item.sku}</div>` : ''}
        ${item.batchNumber ? `<div style="font-size:10px; color:#6366f1; margin-top:1px">Batch: ${item.batchNumber}</div>` : ''}
        ${item.hsnCode || item.hsn ? `<div style="font-size:10px; color:#94a3b8">HSN: ${item.hsnCode || item.hsn}</div>` : ''}
      </td>
      <td style="padding:10px 12px; text-align:center; font-weight:600; font-size:12px; vertical-align:top">${qty} ${item.unit?.symbol || ''}</td>
      <td style="padding:10px 12px; text-align:right; font-family:monospace; font-size:12px; vertical-align:top">${rupee(rate)}</td>
      <td style="padding:10px 12px; text-align:right; font-size:11px; color:#64748b; vertical-align:top">${disc > 0 ? rupee(disc) : '—'}</td>
      <td style="padding:10px 12px; text-align:center; font-size:11px; color:#64748b; vertical-align:top">${taxRate}%</td>
      <td style="padding:10px 12px; text-align:right; font-weight:700; font-family:monospace; font-size:12px; vertical-align:top; color:#0f172a">${rupee(lineTotal)}</td>
    </tr>`;
  }).join('');

  const totalInWords = numberToWords(sale.totalAmount || 0);

  return `
<div style="font-family:'Segoe UI',Arial,sans-serif; color:#0f172a; max-width:820px; margin:0 auto; border:1px solid #e2e8f0; border-radius:12px; overflow:hidden; box-shadow:0 4px 20px rgba(0,0,0,0.08)">

  ${isPaid ? `<div style="position:absolute; pointer-events:none; top:50%; left:50%; transform:translate(-50%,-50%) rotate(-30deg); font-size:96px; font-weight:900; color:rgba(16,185,129,0.06); white-space:nowrap; z-index:0">PAID</div>` : ''}

  <!-- ── HEADER BAND ── -->
  <div style="background:linear-gradient(135deg,#4f46e5 0%,#7c3aed 60%,#6d28d9 100%); padding:24px 28px; display:flex; justify-content:space-between; align-items:flex-start; gap:20px">
    <div style="flex:1">
      <div style="font-size:24px; font-weight:900; color:#fff; letter-spacing:-0.5px">${companyName}</div>
      ${companyAddr ? `<div style="font-size:11px; color:rgba(255,255,255,0.75); margin-top:4px; line-height:1.5">${companyAddr}</div>` : ''}
      <div style="display:flex; gap:16px; margin-top:6px; flex-wrap:wrap">
        ${companyPhone ? `<div style="font-size:10px; color:rgba(255,255,255,0.7)">📞 ${companyPhone}</div>` : ''}
        ${companyEmail ? `<div style="font-size:10px; color:rgba(255,255,255,0.7)">✉ ${companyEmail}</div>` : ''}
        ${companyGST ? `<div style="font-size:10px; color:rgba(255,255,255,0.7); font-family:monospace">GSTIN: ${companyGST}</div>` : ''}
      </div>
    </div>
    <div style="text-align:right; flex-shrink:0">
      <div style="font-size:11px; color:rgba(255,255,255,0.6); text-transform:uppercase; letter-spacing:0.15em; font-weight:700">${typeLabel}</div>
      <div style="font-size:22px; font-weight:900; color:#fff; margin-top:4px; font-family:monospace; letter-spacing:1px">${sale.invoiceNumber || '—'}</div>
      <div style="margin-top:8px; display:inline-block; padding:3px 12px; border-radius:999px; font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:0.08em;
        background:${isPaid ? 'rgba(16,185,129,0.25)' : sale.paymentStatus === 'partial' ? 'rgba(245,158,11,0.25)' : 'rgba(239,68,68,0.25)'};
        color:${isPaid ? '#6ee7b7' : sale.paymentStatus === 'partial' ? '#fde68a' : '#fca5a5'};
        border:1px solid ${isPaid ? 'rgba(110,231,183,0.4)' : sale.paymentStatus === 'partial' ? 'rgba(253,230,138,0.4)' : 'rgba(252,165,165,0.4)'}">
        ${sale.paymentStatus || 'pending'}
      </div>
    </div>
  </div>

  <!-- ── BILL TO / DATES ── -->
  <div style="display:flex; justify-content:space-between; gap:24px; padding:18px 28px; background:#f8fafc; border-bottom:1px solid #e2e8f0">
    <div style="flex:1">
      <div style="font-size:9px; font-weight:800; color:#94a3b8; text-transform:uppercase; letter-spacing:0.1em; margin-bottom:6px">BILL TO</div>
      <div style="font-weight:800; font-size:15px; color:#0f172a">${sale.customer?.name || 'Walk-In Customer'}</div>
      ${sale.customer?.phone ? `<div style="font-size:11px; color:#64748b; margin-top:3px">📞 ${sale.customer.phone}</div>` : ''}
      ${sale.customer?.email ? `<div style="font-size:11px; color:#64748b">✉ ${sale.customer.email}</div>` : ''}
      ${sale.customer?.address ? `<div style="font-size:11px; color:#64748b; margin-top:3px">${sale.customer.address}</div>` : ''}
      ${sale.customer?.gstin ? `<div style="font-size:10px; color:#94a3b8; font-family:monospace; margin-top:3px">GSTIN: ${sale.customer.gstin}</div>` : ''}
    </div>
    <div style="text-align:right; font-size:11px; color:#64748b; line-height:1.9; flex-shrink:0">
      <div><span style="font-weight:700; color:#475569">Date & Time:</span> ${fmtDateTime(sale.saleDate || sale.createdAt)}</div>
      ${sale.dueDate ? `<div><span style="font-weight:700; color:#475569">Due Date:</span> ${fmtDate(sale.dueDate)}</div>` : ''}
      ${sale.warehouse?.name ? `<div><span style="font-weight:700; color:#475569">Warehouse:</span> ${sale.warehouse.name}</div>` : ''}
      <div style="margin-top:4px">
        <span style="background:#e0e7ff; color:#4338ca; font-size:10px; font-weight:700; padding:2px 10px; border-radius:999px; text-transform:uppercase">
          ${(sale.paymentMethod || 'cash').replace(/_/g,' ')}
        </span>
      </div>
    </div>
  </div>

  <!-- ── ITEMS TABLE ── -->
  <table style="width:100%; border-collapse:collapse">
    <thead>
      <tr style="background:#f1f5f9; border-bottom:2px solid #e2e8f0">
        <th style="padding:10px 12px; text-align:center; font-size:10px; font-weight:700; color:#64748b; text-transform:uppercase; letter-spacing:0.05em; width:36px">#</th>
        <th style="padding:10px 12px; text-align:left; font-size:10px; font-weight:700; color:#64748b; text-transform:uppercase; letter-spacing:0.05em">Description</th>
        <th style="padding:10px 12px; text-align:center; font-size:10px; font-weight:700; color:#64748b; text-transform:uppercase; letter-spacing:0.05em; width:70px">Qty</th>
        <th style="padding:10px 12px; text-align:right; font-size:10px; font-weight:700; color:#64748b; text-transform:uppercase; letter-spacing:0.05em; width:100px">Rate</th>
        <th style="padding:10px 12px; text-align:right; font-size:10px; font-weight:700; color:#64748b; text-transform:uppercase; letter-spacing:0.05em; width:90px">Discount</th>
        <th style="padding:10px 12px; text-align:center; font-size:10px; font-weight:700; color:#64748b; text-transform:uppercase; letter-spacing:0.05em; width:60px">Tax</th>
        <th style="padding:10px 12px; text-align:right; font-size:10px; font-weight:700; color:#64748b; text-transform:uppercase; letter-spacing:0.05em; width:110px">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${itemRows || '<tr><td colspan="7" style="text-align:center;padding:32px;color:#94a3b8;font-size:13px">No items on this invoice</td></tr>'}
    </tbody>
  </table>

  <!-- ── TOTALS ── -->
  <div style="display:flex; justify-content:flex-end; padding:0 28px 20px; background:#fff; border-top:2px solid #f1f5f9">
    <div style="min-width:300px; padding-top:16px">
      ${sale.subtotal > 0 ? `
      <div style="display:flex; justify-content:space-between; padding:5px 0; font-size:12px; color:#64748b">
        <span>Subtotal</span><span style="font-family:monospace">${rupee(sale.subtotal)}</span>
      </div>` : ''}
      ${(sale.discountAmount || 0) > 0 ? `
      <div style="display:flex; justify-content:space-between; padding:5px 0; font-size:12px; color:#16a34a">
        <span>Discount</span><span style="font-family:monospace">− ${rupee(sale.discountAmount)}</span>
      </div>` : ''}
      ${(sale.taxAmount || 0) > 0 ? `
      <div style="display:flex; justify-content:space-between; padding:5px 0; font-size:12px; color:#64748b">
        <span>GST / Tax</span><span style="font-family:monospace">${rupee(sale.taxAmount)}</span>
      </div>` : ''}
      ${(sale.shippingAmount || 0) > 0 ? `
      <div style="display:flex; justify-content:space-between; padding:5px 0; font-size:12px; color:#64748b">
        <span>Shipping</span><span style="font-family:monospace">${rupee(sale.shippingAmount)}</span>
      </div>` : ''}
      <!-- Grand Total -->
      <div style="display:flex; justify-content:space-between; padding:12px 14px; margin-top:8px; background:linear-gradient(135deg,#4f46e5,#7c3aed); border-radius:10px; color:#fff">
        <span style="font-weight:900; font-size:14px">Grand Total</span>
        <span style="font-family:monospace; font-weight:900; font-size:18px">${rupee(sale.totalAmount)}</span>
      </div>
      ${(sale.paidAmount || 0) > 0 ? `
      <div style="display:flex; justify-content:space-between; padding:6px 0; font-size:12px; color:#16a34a; font-weight:700; margin-top:4px">
        <span>✓ Amount Paid</span><span style="font-family:monospace">${rupee(sale.paidAmount)}</span>
      </div>` : ''}
      ${(sale.dueAmount || 0) > 0 ? `
      <div style="display:flex; justify-content:space-between; padding:6px 0; font-size:12px; color:#dc2626; font-weight:700">
        <span>Balance Due</span><span style="font-family:monospace">${rupee(sale.dueAmount)}</span>
      </div>` : ''}
      <!-- Amount in words -->
      <div style="margin-top:10px; padding:8px 12px; background:#f8fafc; border-radius:8px; border:1px solid #e2e8f0">
        <div style="font-size:9px; font-weight:700; color:#94a3b8; text-transform:uppercase; letter-spacing:0.08em; margin-bottom:2px">Amount in Words</div>
        <div style="font-size:11px; font-weight:600; color:#475569; font-style:italic">${totalInWords}</div>
      </div>
    </div>
  </div>

  <!-- ── NOTES & TERMS ── -->
  ${(sale.notes || sale.terms) ? `
  <div style="padding:16px 28px; background:#f8fafc; border-top:1px solid #e2e8f0; display:flex; gap:24px">
    ${sale.notes ? `<div style="flex:1"><div style="font-size:9px; font-weight:800; color:#94a3b8; text-transform:uppercase; letter-spacing:0.1em; margin-bottom:5px">Notes</div><div style="font-size:11px; color:#475569; line-height:1.6">${sale.notes}</div></div>` : ''}
    ${sale.terms ? `<div style="flex:1"><div style="font-size:9px; font-weight:800; color:#94a3b8; text-transform:uppercase; letter-spacing:0.1em; margin-bottom:5px">Terms & Conditions</div><div style="font-size:11px; color:#475569; line-height:1.6">${sale.terms}</div></div>` : ''}
  </div>` : ''}

  <!-- ── FOOTER ── -->
  <div style="padding:12px 28px; background:#f1f5f9; border-top:1px solid #e2e8f0; display:flex; justify-content:space-between; align-items:center">
    <div style="font-size:10px; color:#94a3b8">Thank you for your business! • ${companyName}</div>
    <div style="font-size:10px; color:#94a3b8; font-family:monospace">${sale.invoiceNumber} • ${fmtDateTime(sale.createdAt)}</div>
  </div>
  <div style="padding:6px 28px; background:#4f46e5; text-align:center">
    <div style="font-size:9px; color:rgba(255,255,255,0.6); letter-spacing:0.05em">This is a computer-generated document. No signature is required.</div>
  </div>
</div>`;
}

/**
 * Compact 80mm thermal receipt — professional format
 */
export function buildThermalReceiptHTML({ sale, company = {} }) {
  const companyName  = company.name || company.businessName || 'Inventory Management';
  const companyPhone = company.phone || '';
  const companyAddr  = [company.address, company.city].filter(Boolean).join(', ');
  const companyGST   = company.gstin || '';

  const itemRows = (sale.items || []).map((item) => `
    <div style="padding:5px 0; border-bottom:1px dashed #d1d5db">
      <div style="display:flex; justify-content:space-between; gap:4px">
        <div style="font-weight:700; font-size:12px; flex:1">${item.productName || '—'}</div>
        <div style="font-weight:700; font-family:monospace; font-size:12px; white-space:nowrap">${rupee(item.total)}</div>
      </div>
      <div style="font-size:10px; color:#6b7280; margin-top:1px">
        ${item.quantity} × ${rupee(item.unitPrice)}${item.discount > 0 ? ` − ${rupee(item.discount)} disc` : ''}
        ${item.taxRate ? ` · GST ${item.taxRate}%` : ''}
      </div>
    </div>`).join('');

  const isPaid = sale.paymentStatus === 'paid';

  return `
<div style="max-width:310px; margin:0 auto; font-family:'Courier New',monospace; font-size:12px; padding:16px; background:#fff">

  <!-- Header -->
  <div style="text-align:center; margin-bottom:12px">
    <div style="font-size:18px; font-weight:900; letter-spacing:-0.5px">${companyName}</div>
    ${companyAddr ? `<div style="font-size:10px; color:#6b7280; margin-top:2px">${companyAddr}</div>` : ''}
    ${companyPhone ? `<div style="font-size:10px; color:#6b7280">📞 ${companyPhone}</div>` : ''}
    ${companyGST ? `<div style="font-size:10px; color:#6b7280">GSTIN: ${companyGST}</div>` : ''}
  </div>

  <!-- Invoice strip -->
  <div style="border-top:2px dashed #111; border-bottom:2px dashed #111; padding:6px 0; margin:0 0 10px; text-align:center">
    <div style="font-size:10px; font-weight:700; letter-spacing:0.12em; color:#4b5563; text-transform:uppercase">
      ${({invoice:'TAX INVOICE', quotation:'QUOTATION', sales_order:'SALES ORDER', sales_return:'CREDIT NOTE'}[sale.type] || 'RECEIPT')}
    </div>
    <div style="font-size:15px; font-weight:900; margin-top:1px; letter-spacing:2px">${sale.invoiceNumber || '—'}</div>
    <div style="font-size:9px; color:#6b7280; margin-top:2px">${fmtDateTime(sale.saleDate || sale.createdAt)}</div>
  </div>

  <!-- Customer -->
  <div style="margin-bottom:8px; font-size:11px">
    <div><span style="font-weight:700">Customer:</span> ${sale.customer?.name || 'Walk-In Customer'}</div>
    ${sale.customer?.phone ? `<div style="color:#6b7280">Phone: ${sale.customer.phone}</div>` : ''}
  </div>

  <!-- Items -->
  <div style="margin-bottom:8px">${itemRows}</div>

  <!-- Totals -->
  <div style="border-top:1px dashed #111; padding-top:8px; font-size:11px">
    ${(sale.subtotal || 0) > 0 ? `<div style="display:flex; justify-content:space-between; color:#6b7280; padding:2px 0"><span>Subtotal</span><span>${rupee(sale.subtotal)}</span></div>` : ''}
    ${(sale.discountAmount || 0) > 0 ? `<div style="display:flex; justify-content:space-between; color:#16a34a; padding:2px 0"><span>Discount</span><span>− ${rupee(sale.discountAmount)}</span></div>` : ''}
    ${(sale.taxAmount || 0) > 0 ? `<div style="display:flex; justify-content:space-between; color:#6b7280; padding:2px 0"><span>Tax / GST</span><span>${rupee(sale.taxAmount)}</span></div>` : ''}
    <div style="display:flex; justify-content:space-between; font-size:16px; font-weight:900; border-top:2px solid #111; border-bottom:2px solid #111; padding:7px 0; margin-top:6px">
      <span>TOTAL</span><span>${rupee(sale.totalAmount)}</span>
    </div>
    <div style="display:flex; justify-content:space-between; color:${isPaid ? '#16a34a' : '#dc2626'}; font-weight:700; padding:4px 0">
      <span>${isPaid ? '✓ PAID' : 'DUE'} (${(sale.paymentMethod || 'cash').toUpperCase().replace(/_/g,' ')})</span>
      <span>${rupee(isPaid ? sale.paidAmount : sale.dueAmount)}</span>
    </div>
    ${(sale.dueAmount || 0) > 0 && isPaid === false ? `<div style="display:flex; justify-content:space-between; color:#dc2626; font-weight:700; padding:2px 0"><span>Balance Due</span><span>${rupee(sale.dueAmount)}</span></div>` : ''}
  </div>

  <!-- Footer -->
  <div style="text-align:center; margin-top:14px; padding-top:10px; border-top:1px dashed #111; font-size:10px; color:#6b7280">
    <div style="font-weight:700">Thank you for shopping with us!</div>
    <div style="margin-top:4px">Visit again · ${companyName}</div>
    <div style="margin-top:6px; font-size:9px; border:1px dashed #d1d5db; padding:4px; border-radius:4px">
      This is a computer-generated receipt
    </div>
  </div>
</div>`;
}

/**
 * printDocument — opens a styled popup and triggers window.print()
 * @param {string} htmlContent  - Full HTML string to print
 * @param {string} title        - Window/tab title
 */
export function printDocument(htmlContent, title = 'Document') {
  const win = window.open('', '_blank', 'width=900,height=700');
  win.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${title}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #111827; background: #fff; font-size: 13px; }
    @page { margin: 12mm 14mm; size: A4 portrait; }
    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
    table { border-collapse: collapse; width: 100%; }
    th, td { padding: 8px 10px; text-align: left; }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .font-bold { font-weight: 700; }
    .font-black { font-weight: 900; }
    .text-sm { font-size: 12px; }
    .text-xs { font-size: 11px; }
    .text-2xs { font-size: 10px; }
    .text-lg { font-size: 16px; }
    .text-xl { font-size: 18px; }
    .text-2xl { font-size: 22px; }
    .text-gray-400 { color: #9ca3af; }
    .text-gray-500 { color: #6b7280; }
    .text-gray-600 { color: #4b5563; }
    .text-gray-900 { color: #111827; }
    .text-brand { color: #4f46e5; }
    .text-success { color: #16a34a; }
    .text-danger { color: #dc2626; }
    .text-amber { color: #d97706; }
    .bg-brand { background: #4f46e5; }
    .bg-gray-50 { background: #f9fafb; }
    .bg-gray-100 { background: #f3f4f6; }
    .border { border: 1px solid #e5e7eb; }
    .border-t { border-top: 1px solid #e5e7eb; }
    .border-b { border-bottom: 1px solid #e5e7eb; }
    .rounded { border-radius: 8px; }
    .p-4 { padding: 16px; }
    .p-6 { padding: 24px; }
    .mb-4 { margin-bottom: 16px; }
    .mt-4 { margin-top: 16px; }
    .flex { display: flex; }
    .justify-between { justify-content: space-between; }
    .items-start { align-items: flex-start; }
    .gap-4 { gap: 16px; }
    .thead-row th { background: #f3f4f6; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; border-bottom: 2px solid #e5e7eb; }
    .tbody-row td { border-bottom: 1px solid #f3f4f6; vertical-align: top; }
    .tbody-row:last-child td { border-bottom: none; }
    .badge { display: inline-block; padding: 2px 10px; border-radius: 999px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; }
    .badge-paid { background: #dcfce7; color: #16a34a; }
    .badge-partial { background: #fef3c7; color: #d97706; }
    .badge-unpaid { background: #fee2e2; color: #dc2626; }
    .divider { border: none; border-top: 1px solid #e5e7eb; margin: 12px 0; }
    .header-band { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: white; padding: 20px 24px; border-radius: 10px 10px 0 0; }
    .totals-box { background: #f9fafb; border-top: 2px solid #e5e7eb; padding: 16px 24px; }
    .total-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 12px; }
    .grand-total-row { display: flex; justify-content: space-between; padding: 10px 0 4px; font-size: 16px; font-weight: 900; color: #4f46e5; border-top: 2px solid #4f46e5; margin-top: 8px; }
    .footer { margin-top: 24px; text-align: center; font-size: 10px; color: #9ca3af; }
    .watermark-paid { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%) rotate(-30deg); font-size: 80px; font-weight: 900; color: rgba(22,163,74,0.07); pointer-events: none; white-space: nowrap; }
  </style>
</head>
<body>${htmlContent}</body>
</html>`);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); }, 500);
}

/**
 * downloadAsPDF — converts a DOM element to a PDF file
 * @param {string} elementId   - ID of the element to capture
 * @param {string} filename    - Output filename (without .pdf)
 */
export async function downloadAsPDF(elementId, filename = 'document') {
  const { default: html2canvas } = await import('html2canvas');
  const { default: jsPDF } = await import('jspdf');

  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element #${elementId} not found`);
    return;
  }

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = pageWidth - 20; // 10mm margin each side
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = 10;

  pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
  heightLeft -= pageHeight - 20;

  while (heightLeft > 0) {
    position = heightLeft - imgHeight + 10;
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
    heightLeft -= pageHeight - 20;
  }

  pdf.save(`${filename}.pdf`);
}

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Eye, ChevronRight } from 'lucide-react';
import api from '@services/axios.js';
import DataTable from '@components/ui/DataTable.jsx';

const typeLabel = { quotation: 'Quotation', sales_order: 'Order', invoice: 'Invoice', sales_return: 'Return' };
const paymentColor = { unpaid: 'badge-danger', partial: 'badge-warning', paid: 'badge-success' };

const columns = [
  { key: 'invoiceNumber', label: 'Number', render: (v, row) => (
    <div><div className="font-mono text-sm font-semibold text-gray-900">{v}</div><div className="badge-brand text-xs">{typeLabel[row.type]}</div></div>
  )},
  { key: 'customer', label: 'Customer', render: (v) => (
    <div className="flex items-center gap-2">
      <div className="w-6 h-6 rounded-full bg-brand-100 flex items-center justify-center text-xs text-brand-700 font-semibold">{v?.name?.[0]}</div>
      <span className="font-medium">{v?.name}</span>
    </div>
  )},
  { key: 'saleDate', label: 'Date', render: (v) => new Date(v).toLocaleDateString('en-IN') },
  { key: 'status', label: 'Status', render: (v) => <span className="badge-gray capitalize">{v}</span> },
  { key: 'totalAmount', label: 'Total', render: (v) => <span className="font-semibold text-gray-900">₹{v?.toLocaleString('en-IN')}</span> },
  { key: 'dueAmount', label: 'Due', render: (v) => v > 0 ? <span className="text-danger font-medium">₹{v?.toLocaleString('en-IN')}</span> : <span className="text-success">—</span> },
  { key: 'paymentStatus', label: 'Payment', render: (v) => <span className={paymentColor[v] || 'badge-gray capitalize'}>{v}</span> },
];

export default function SalesPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['sales', page, search, type],
    queryFn: () => api.get(`/sales?page=${page}&limit=20&search=${search}&type=${type}`),
  });

  const renderSaleMobileCard = (sale) => (
    <div
      onClick={() => navigate(`/sales/${sale._id}`)}
      className="card p-4 bg-white border border-gray-200/90 shadow-sm hover:border-brand-400 transition cursor-pointer flex flex-col justify-between space-y-2.5 rounded-xl"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-mono font-extrabold text-sm text-gray-900 leading-snug">{sale.invoiceNumber}</div>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-2xs font-extrabold uppercase px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
              {typeLabel[sale.type] || sale.type}
            </span>
            <span className={`text-2xs font-extrabold uppercase px-2 py-0.5 rounded-full ${paymentColor[sale.paymentStatus] || 'badge-gray'}`}>
              {sale.paymentStatus}
            </span>
          </div>
        </div>
        <div className="text-right">
          <div className="font-extrabold text-sm font-mono text-brand-700">₹{sale.totalAmount?.toLocaleString('en-IN')}</div>
          <div className="text-2xs text-gray-400 mt-0.5">{new Date(sale.saleDate).toLocaleDateString('en-IN')}</div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs">
        <div className="flex items-center gap-2 truncate">
          <div className="w-6 h-6 rounded-full bg-brand-100 flex items-center justify-center text-2xs text-brand-700 font-bold flex-shrink-0">
            {sale.customer?.name?.[0] || 'C'}
          </div>
          <span className="font-medium text-gray-800 truncate">{sale.customer?.name || 'Walk-In'}</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-brand-600 font-bold flex-shrink-0">
          <span>View</span>
          <ChevronRight size={14} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div><h1 className="page-title">Sales</h1><p className="page-subtitle">Quotations, orders, and invoices</p></div>
      </div>
      <div className="flex gap-2 mb-1 overflow-x-auto scrollbar-none pb-1">
        {[['', 'All'], ['quotation', 'Quotations'], ['sales_order', 'Orders'], ['invoice', 'Invoices'], ['sales_return', 'Returns']].map(([t, l]) => (
          <button key={t} onClick={() => setType(t)} className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-all whitespace-nowrap ${type === t ? 'bg-brand-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>{l}</button>
        ))}
      </div>
      <DataTable
        data={data?.data || []}
        columns={columns}
        loading={isLoading}
        pagination={data?.pagination}
        onPageChange={setPage}
        onSearch={(q) => { setSearch(q); setPage(1); }}
        searchPlaceholder="Search by invoice number..."
        onAdd={() => navigate('/sales/new')}
        addLabel="New Invoice"
        emptyTitle="No sales found"
        emptyDescription="Create your first invoice or quotation"
        renderMobileCard={renderSaleMobileCard}
        onRowClick={(row) => navigate(`/sales/${row._id}`)}
        rowActions={(row) => (
          <button onClick={() => navigate(`/sales/${row._id}`)} className="btn-icon btn-ghost"><Eye size={14} /></button>
        )}
      />
    </div>
  );
}

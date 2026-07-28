import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Eye, ChevronRight } from 'lucide-react';
import api from '@services/axios.js';
import DataTable from '@components/ui/DataTable.jsx';

const typeLabel = { purchase_order: 'PO', purchase_invoice: 'Invoice', goods_received: 'GRN', purchase_return: 'Return' };
const statusColor = { draft: 'badge-gray', ordered: 'badge-info', received: 'badge-success', cancelled: 'badge-danger', partial: 'badge-warning' };
const paymentColor = { unpaid: 'badge-danger', partial: 'badge-warning', paid: 'badge-success', overdue: 'badge-danger' };

const columns = [
  { key: 'purchaseNumber', label: 'Number', render: (v, row) => (
    <div><div className="font-mono text-sm font-semibold text-gray-900">{v}</div><div className="badge-gray text-xs">{typeLabel[row.type]}</div></div>
  )},
  { key: 'supplier', label: 'Supplier', render: (v) => <div className="font-medium">{v?.name}</div> },
  { key: 'purchaseDate', label: 'Date', render: (v) => new Date(v).toLocaleDateString('en-IN') },
  { key: 'status', label: 'Status', render: (v) => <span className={statusColor[v] || 'badge-gray'}>{v}</span> },
  { key: 'totalAmount', label: 'Total', render: (v) => <span className="font-semibold">₹{v?.toLocaleString('en-IN')}</span> },
  { key: 'paidAmount', label: 'Paid', render: (v) => <span className="text-success font-medium">₹{(v || 0).toLocaleString('en-IN')}</span> },
  { key: 'paymentStatus', label: 'Payment', render: (v) => <span className={paymentColor[v] || 'badge-gray'}>{v}</span> },
];

export default function PurchasesPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['purchases', page, search, type],
    queryFn: () => api.get(`/purchases?page=${page}&limit=20&search=${search}&type=${type}`),
  });

  const renderPurchaseMobileCard = (purchase) => (
    <div
      onClick={() => navigate(`/purchases/${purchase._id}`)}
      className="card p-4 bg-white border border-gray-200/90 shadow-sm hover:border-emerald-400 transition cursor-pointer flex flex-col justify-between space-y-2.5 rounded-xl"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-mono font-extrabold text-sm text-gray-900 leading-snug">{purchase.purchaseNumber}</div>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-2xs font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-100">
              {typeLabel[purchase.type] || purchase.type}
            </span>
            <span className={`text-2xs font-extrabold uppercase px-2 py-0.5 rounded-full ${paymentColor[purchase.paymentStatus] || 'badge-gray'}`}>
              {purchase.paymentStatus}
            </span>
          </div>
        </div>
        <div className="text-right">
          <div className="font-extrabold text-sm font-mono text-emerald-700">₹{purchase.totalAmount?.toLocaleString('en-IN')}</div>
          <div className="text-2xs text-gray-400 mt-0.5">{new Date(purchase.purchaseDate).toLocaleDateString('en-IN')}</div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs">
        <div className="flex items-center gap-2 truncate">
          <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-2xs text-emerald-700 font-bold flex-shrink-0">
            {purchase.supplier?.name?.[0] || 'S'}
          </div>
          <span className="font-medium text-gray-800 truncate">{purchase.supplier?.name || 'Supplier'}</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-emerald-700 font-bold flex-shrink-0">
          <span>View Order</span>
          <ChevronRight size={14} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div><h1 className="page-title">Purchases</h1><p className="page-subtitle">Orders, invoices, and goods received</p></div>
      </div>
      <div className="flex gap-2 mb-1 overflow-x-auto scrollbar-none pb-1">
        {['', 'purchase_order', 'purchase_invoice', 'goods_received'].map((t) => (
          <button key={t} onClick={() => setType(t)} className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-all whitespace-nowrap ${type === t ? 'bg-brand-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {t === '' ? 'All' : typeLabel[t] || t}
          </button>
        ))}
      </div>
      <DataTable
        data={data?.data || []}
        columns={columns}
        loading={isLoading}
        pagination={data?.pagination}
        onPageChange={setPage}
        onSearch={(q) => { setSearch(q); setPage(1); }}
        searchPlaceholder="Search by number..."
        onAdd={() => navigate('/purchases/new')}
        addLabel="New Purchase"
        emptyTitle="No purchases found"
        emptyDescription="Create your first purchase order"
        renderMobileCard={renderPurchaseMobileCard}
        onRowClick={(row) => navigate(`/purchases/${row._id}`)}
        rowActions={(row) => (
          <button onClick={() => navigate(`/purchases/${row._id}`)} className="btn-icon btn-ghost"><Eye size={14} /></button>
        )}
      />
    </div>
  );
}

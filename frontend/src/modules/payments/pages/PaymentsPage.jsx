import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CreditCard, ArrowDownLeft, ArrowUpRight, ChevronDown } from 'lucide-react';
import api from '@services/axios.js';
import DataTable from '@components/ui/DataTable.jsx';

const columns = [
  { key: 'paymentNumber', label: 'Number', render: (v) => <code className="font-mono text-sm font-semibold text-gray-900">{v}</code> },
  { key: 'type', label: 'Type', render: (v) => (
    <span className={`badge ${v === 'received' ? 'badge-success' : 'badge-danger'} gap-1`}>
      {v === 'received' ? <ArrowDownLeft size={12} /> : <ArrowUpRight size={12} />}
      {v === 'received' ? 'Inward (Received)' : 'Outward (Paid)'}
    </span>
  )},
  { key: 'partyType', label: 'Party Type', render: (v) => <span className="badge-gray capitalize">{v}</span> },
  { key: 'amount', label: 'Amount', render: (v, row) => (
    <span className={`font-semibold ${row.type === 'received' ? 'text-success' : 'text-danger'}`}>
      ₹{v?.toLocaleString('en-IN')}
    </span>
  )},
  { key: 'paymentMethod', label: 'Method', render: (v) => <span className="badge-brand uppercase text-xs">{v?.replace('_', ' ')}</span> },
  { key: 'paymentDate', label: 'Date', render: (v) => new Date(v).toLocaleDateString('en-IN') },
  { key: 'status', label: 'Status', render: (v) => <span className="badge-success capitalize">{v}</span> },
];

function PaymentMobileCard({ payment }) {
  const [expanded, setExpanded] = useState(false);
  const isReceived = payment.type === 'received';

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-xs overflow-hidden">
      <div className="flex items-center justify-between gap-2 px-4 py-3" onClick={() => setExpanded(p => !p)}>
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${isReceived ? 'bg-emerald-50' : 'bg-rose-50'}`}>
            {isReceived ? <ArrowDownLeft size={16} className="text-emerald-600" /> : <ArrowUpRight size={16} className="text-rose-600" />}
          </div>
          <div className="min-w-0">
            <div className="font-bold text-gray-900 text-sm font-mono truncate">{payment.paymentNumber}</div>
            <div className="text-2xs text-gray-400 mt-0.5 capitalize">{payment.partyType} · {new Date(payment.paymentDate).toLocaleDateString('en-IN')}</div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`font-extrabold text-sm font-mono ${isReceived ? 'text-emerald-700' : 'text-rose-700'}`}>
            ₹{payment.amount?.toLocaleString('en-IN')}
          </span>
          <ChevronDown size={15} className={`text-gray-400 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {expanded && (
        <div className="border-t border-gray-100 bg-gray-50/60 px-3 pb-3 pt-2">
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Type', value: <span className={`badge ${isReceived ? 'badge-success' : 'badge-danger'} gap-1 text-2xs`}>{isReceived ? 'Inward (Received)' : 'Outward (Paid)'}</span> },
              { label: 'Method', value: <span className="badge-brand uppercase text-2xs">{payment.paymentMethod?.replace('_', ' ')}</span> },
              { label: 'Party Type', value: <span className="badge-gray capitalize text-2xs">{payment.partyType}</span> },
              { label: 'Status', value: <span className="badge-success capitalize text-2xs">{payment.status}</span> },
              { label: 'Amount', value: <span className={`font-bold font-mono text-xs ${isReceived ? 'text-emerald-700' : 'text-rose-700'}`}>₹{payment.amount?.toLocaleString('en-IN')}</span> },
              { label: 'Date', value: <span className="text-xs text-gray-700">{new Date(payment.paymentDate).toLocaleDateString('en-IN')}</span> },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white border border-gray-100 rounded-lg px-3 py-2">
                <span className="text-2xs font-semibold text-gray-400 uppercase tracking-wider block mb-0.5">{label}</span>
                <div className="mt-0.5">{value}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function PaymentsPage() {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['payments', page],
    queryFn: () => api.get(`/payments?page=${page}&limit=20`),
  });

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Payments & Receipts</h1>
          <p className="page-subtitle">Track inward customer payments and outward supplier settlements</p>
        </div>
      </div>

      <DataTable
        data={data?.data || []}
        columns={columns}
        loading={isLoading}
        pagination={data?.pagination}
        onPageChange={setPage}
        emptyTitle="No payments recorded"
        emptyDescription="Receipts and payment entries will appear here"
        renderMobileCard={(row) => <PaymentMobileCard payment={row} />}
      />
    </div>
  );
}

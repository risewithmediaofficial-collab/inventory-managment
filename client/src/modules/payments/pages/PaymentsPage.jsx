import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CreditCard, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
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
      />
    </div>
  );
}

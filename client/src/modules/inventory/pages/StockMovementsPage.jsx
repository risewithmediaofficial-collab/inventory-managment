import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeftRight, ArrowUpRight, ArrowDownLeft, RefreshCcw } from 'lucide-react';
import api from '@services/axios.js';
import DataTable from '@components/ui/DataTable.jsx';

const movementTypes = {
  purchase: ['badge-success', 'Purchase (In)', ArrowDownLeft],
  sale: ['badge-brand', 'Sale (Out)', ArrowUpRight],
  transfer_in: ['badge-info', 'Transfer In', ArrowDownLeft],
  transfer_out: ['badge-warning', 'Transfer Out', ArrowUpRight],
  adjustment: ['badge-gray', 'Adjustment', RefreshCcw],
  return: ['badge-warning', 'Return', RefreshCcw],
};

const columns = [
  { key: 'createdAt', label: 'Date & Time', render: (v) => (
    <div>
      <div className="text-sm font-medium text-gray-900">{new Date(v).toLocaleDateString('en-IN')}</div>
      <div className="text-xs text-gray-400">{new Date(v).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>
    </div>
  )},
  { key: 'type', label: 'Type', render: (v) => {
    const [cls, label, Icon] = movementTypes[v] || ['badge-gray', v, ArrowLeftRight];
    return (
      <span className={`${cls} gap-1`}>
        <Icon size={12} />
        {label}
      </span>
    );
  }},
  { key: 'product', label: 'Product', render: (v) => (
    <div>
      <div className="font-medium text-gray-900">{v?.name || '—'}</div>
      <div className="text-xs text-gray-400 font-mono">{v?.sku}</div>
    </div>
  )},
  { key: 'quantity', label: 'Qty Changed', render: (v, row) => {
    const isPositive = ['purchase', 'transfer_in', 'return'].includes(row.type);
    return (
      <span className={`font-semibold ${isPositive ? 'text-success' : 'text-danger'}`}>
        {isPositive ? '+' : '-'}{Math.abs(v)}
      </span>
    );
  }},
  { key: 'previousStock', label: 'Previous', render: (v) => <span className="text-gray-500">{v}</span> },
  { key: 'newStock', label: 'New Stock', render: (v) => <span className="font-semibold text-gray-900">{v}</span> },
  { key: 'referenceNumber', label: 'Reference', render: (v) => (
    v ? <code className="badge-gray font-mono text-xs">{v}</code> : '—'
  )},
];

export default function StockMovementsPage() {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['stock-movements', page],
    queryFn: () => api.get(`/stock-movements?page=${page}&limit=20`),
  });

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Stock Movements</h1>
          <p className="page-subtitle">Audit log of all stock increases, sales, purchases, and adjustments</p>
        </div>
      </div>

      <DataTable
        data={data?.data || []}
        columns={columns}
        loading={isLoading}
        pagination={data?.pagination}
        onPageChange={setPage}
        emptyTitle="No stock movements recorded"
        emptyDescription="Transactions like sales and purchases will record stock history here"
      />
    </div>
  );
}

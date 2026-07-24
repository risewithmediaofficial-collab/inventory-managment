import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Eye, Trash2, Users } from 'lucide-react';
import api from '@services/axios.js';
import DataTable from '@components/ui/DataTable.jsx';
import toast from 'react-hot-toast';

const columns = [
  { key: 'name', label: 'Customer', render: (v, row) => (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
        <span className="text-brand-700 text-xs font-semibold">{v?.[0]}</span>
      </div>
      <div><div className="font-medium text-gray-900">{v}</div><div className="text-xs text-gray-400">{row.code}</div></div>
    </div>
  )},
  { key: 'phone', label: 'Phone', render: (v) => v || '—' },
  { key: 'email', label: 'Email', render: (v) => v || '—' },
  { key: 'currentBalance', label: 'Balance', render: (v) => (
    <span className={`font-semibold ${v > 0 ? 'text-danger' : v < 0 ? 'text-success' : 'text-gray-500'}`}>
      ₹{Math.abs(v || 0).toLocaleString('en-IN')} {v > 0 ? 'Due' : v < 0 ? 'Advance' : ''}
    </span>
  )},
  { key: 'priceGroup', label: 'Group', render: (v) => <span className="badge-brand capitalize">{v}</span> },
  { key: 'isActive', label: 'Status', render: (v) => <span className={v ? 'badge-success' : 'badge-gray'}>{v ? 'Active' : 'Inactive'}</span> },
];

export default function CustomersPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['customers', page, search],
    queryFn: () => api.get(`/customers?page=${page}&limit=20&search=${search}`),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/customers/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['customers'] }); toast.success('Customer deleted'); },
  });

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div><h1 className="page-title">Customers</h1><p className="page-subtitle">Manage your customers and clients</p></div>
      </div>
      <DataTable
        data={data?.data || []}
        columns={columns}
        loading={isLoading}
        pagination={data?.pagination}
        onPageChange={setPage}
        onSearch={(q) => { setSearch(q); setPage(1); }}
        searchPlaceholder="Search customers..."
        onAdd={() => navigate('/customers/new')}
        addLabel="Add Customer"
        emptyTitle="No customers yet"
        emptyDescription="Add your first customer to start selling"
        rowActions={(row) => (
          <>
            <button onClick={() => navigate(`/customers/${row._id}`)} className="btn-icon btn-ghost"><Eye size={14} /></button>
            <button onClick={() => { if (confirm('Delete?')) deleteMutation.mutate(row._id); }} className="btn-icon btn-ghost text-danger hover:bg-red-50"><Trash2 size={14} /></button>
          </>
        )}
      />
    </div>
  );
}

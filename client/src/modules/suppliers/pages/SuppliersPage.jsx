import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Edit, Trash2, Eye, Building2, Phone, Mail } from 'lucide-react';
import api from '@services/axios.js';
import DataTable from '@components/ui/DataTable.jsx';
import toast from 'react-hot-toast';

const columns = [
  { key: 'name', label: 'Supplier', render: (v, row) => (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
        <span className="text-amber-700 text-xs font-semibold">{v?.[0]}</span>
      </div>
      <div><div className="font-medium text-gray-900">{v}</div><div className="text-xs text-gray-400">{row.code}</div></div>
    </div>
  )},
  { key: 'phone', label: 'Contact', render: (v, row) => (
    <div><div className="text-sm">{v || '—'}</div><div className="text-xs text-gray-400">{row.email || ''}</div></div>
  )},
  { key: 'gstin', label: 'GSTIN', render: (v) => v ? <code className="text-xs font-mono text-gray-600">{v}</code> : '—' },
  { key: 'currentBalance', label: 'Balance', render: (v) => (
    <span className={`font-semibold ${v > 0 ? 'text-danger' : v < 0 ? 'text-success' : 'text-gray-500'}`}>
      ₹{Math.abs(v || 0).toLocaleString('en-IN')} {v > 0 ? 'Due' : v < 0 ? 'Advance' : ''}
    </span>
  )},
  { key: 'paymentTerms', label: 'Terms', render: (v) => <span className="badge-gray capitalize">{v?.replace('_', ' ')}</span> },
  { key: 'isActive', label: 'Status', render: (v) => <span className={v ? 'badge-success' : 'badge-gray'}>{v ? 'Active' : 'Inactive'}</span> },
];

export default function SuppliersPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['suppliers', page, search],
    queryFn: () => api.get(`/suppliers?page=${page}&limit=20&search=${search}`),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/suppliers/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['suppliers'] }); toast.success('Supplier deleted'); },
  });

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div><h1 className="page-title">Suppliers</h1><p className="page-subtitle">Manage your vendors and suppliers</p></div>
      </div>
      <DataTable
        data={data?.data || []}
        columns={columns}
        loading={isLoading}
        pagination={data?.pagination}
        onPageChange={setPage}
        onSearch={(q) => { setSearch(q); setPage(1); }}
        searchPlaceholder="Search suppliers..."
        onAdd={() => navigate('/suppliers/new')}
        addLabel="Add Supplier"
        emptyTitle="No suppliers yet"
        emptyDescription="Add your first supplier to start purchasing"
        rowActions={(row) => (
          <>
            <button onClick={() => navigate(`/suppliers/${row._id}`)} className="btn-icon btn-ghost"><Eye size={14} /></button>
            <button onClick={() => { if (confirm('Delete?')) deleteMutation.mutate(row._id); }} className="btn-icon btn-ghost text-danger hover:bg-red-50"><Trash2 size={14} /></button>
          </>
        )}
      />
    </div>
  );
}

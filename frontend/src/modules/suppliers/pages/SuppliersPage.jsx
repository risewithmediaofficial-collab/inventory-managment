import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Edit, Trash2, Eye, Building2, Phone, Mail, ChevronRight } from 'lucide-react';
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

  const renderSupplierMobileCard = (supplier) => (
    <div
      onClick={() => navigate(`/suppliers/${supplier._id}`)}
      className="card p-4 bg-white border border-gray-200/90 shadow-sm hover:border-amber-400 transition cursor-pointer flex flex-col justify-between space-y-3 rounded-xl"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center font-extrabold text-sm shadow-xs flex-shrink-0">
            {supplier.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <h4 className="font-bold text-gray-900 text-sm leading-snug">{supplier.name}</h4>
            <span className="text-2xs font-mono text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded mt-0.5 inline-block">
              {supplier.code || 'NO-CODE'}
            </span>
          </div>
        </div>
        <span className={`px-2 py-0.5 rounded-full text-2xs font-bold uppercase ${supplier.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'}`}>
          {supplier.isActive ? 'Active' : 'Inactive'}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs py-2 border-y border-gray-100 bg-gray-50/50 rounded-lg p-2">
        <div>
          <span className="text-gray-400 text-2xs block font-semibold">Phone / GSTIN</span>
          <span className="font-medium text-gray-800 truncate block">{supplier.phone || '—'}</span>
          {supplier.gstin && <span className="text-2xs font-mono text-gray-400 block truncate">{supplier.gstin}</span>}
        </div>
        <div className="text-right">
          <span className="text-gray-400 text-2xs block font-semibold">Current Balance</span>
          <span className={`font-bold font-mono ${supplier.currentBalance > 0 ? 'text-danger' : supplier.currentBalance < 0 ? 'text-success' : 'text-gray-500'}`}>
            ₹{Math.abs(supplier.currentBalance || 0).toLocaleString('en-IN')} {supplier.currentBalance > 0 ? 'Due' : supplier.currentBalance < 0 ? 'Adv' : ''}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-0.5">
        <span className="text-2xs font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md capitalize">
          {supplier.paymentTerms?.replace(/_/g, ' ') || 'Net 30'}
        </span>
        <div
          className="flex items-center gap-1 text-xs text-amber-700 font-bold hover:text-amber-900"
          onClick={(e) => { e.stopPropagation(); navigate(`/suppliers/${supplier._id}`); }}
        >
          <span>View Details</span>
          <ChevronRight size={14} />
        </div>
      </div>
    </div>
  );

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
        renderMobileCard={renderSupplierMobileCard}
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

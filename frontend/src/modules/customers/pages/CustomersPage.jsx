import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Eye, Trash2, Users, ChevronRight, Plus } from 'lucide-react';
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

  const renderCustomerMobileCard = (customer) => (
    <div
      onClick={() => navigate(`/customers/${customer._id}`)}
      className="card p-4 bg-white border border-gray-200/90 shadow-sm hover:border-brand-400 transition cursor-pointer flex flex-col justify-between space-y-3 rounded-xl"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-extrabold text-sm shadow-xs flex-shrink-0">
            {customer.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <h4 className="font-bold text-gray-900 text-sm leading-snug">{customer.name}</h4>
            <span className="text-2xs font-mono text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded mt-0.5 inline-block">
              {customer.code || 'NO-CODE'}
            </span>
          </div>
        </div>
        <span className={`px-2 py-0.5 rounded-full text-2xs font-bold uppercase ${customer.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'}`}>
          {customer.isActive ? 'Active' : 'Inactive'}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs py-2 border-y border-gray-100 bg-gray-50/50 rounded-lg p-2">
        <div>
          <span className="text-gray-400 text-2xs block font-semibold">Contact</span>
          <span className="font-medium text-gray-800 truncate block">{customer.phone || customer.email || '—'}</span>
        </div>
        <div className="text-right">
          <span className="text-gray-400 text-2xs block font-semibold">Current Balance</span>
          <span className={`font-bold font-mono ${customer.currentBalance > 0 ? 'text-danger' : customer.currentBalance < 0 ? 'text-success' : 'text-gray-500'}`}>
            ₹{Math.abs(customer.currentBalance || 0).toLocaleString('en-IN')} {customer.currentBalance > 0 ? 'Due' : customer.currentBalance < 0 ? 'Adv' : ''}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-0.5">
        <span className="text-2xs font-bold text-brand-700 bg-brand-50 border border-brand-100 px-2 py-0.5 rounded-md capitalize">
          {customer.priceGroup || 'Standard'}
        </span>
        <div
          className="flex items-center gap-1 text-xs text-brand-600 font-bold hover:text-brand-800"
          onClick={(e) => { e.stopPropagation(); navigate(`/customers/${customer._id}`); }}
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
        emptyTitle="No customers yet"
        emptyDescription="Add your first customer to start selling"
        renderMobileCard={renderCustomerMobileCard}
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

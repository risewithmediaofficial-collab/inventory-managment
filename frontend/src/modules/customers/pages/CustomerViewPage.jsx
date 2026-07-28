import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import api from '@services/axios.js';

export default function CustomerViewPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['customer', id],
    queryFn: () => api.get(`/customers/${id}`),
    enabled: !!id && id !== 'new' && id !== 'undefined',
  });
  const c = data?.data || data;

  if (!id || id === 'new' || id === 'undefined') {
    navigate('/customers/new', { replace: true });
    return null;
  }

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full" /></div>;
  if (isError || !c) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <p className="text-gray-500 font-semibold">Customer not found</p>
      <button onClick={() => navigate('/customers')} className="btn-secondary btn-sm">Back to Customers</button>
    </div>
  );

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="btn-ghost btn-icon"><ArrowLeft size={18} /></button>
        <div><h1 className="page-title">{c.name}</h1><p className="page-subtitle">{c.code}</p></div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card p-5">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Contact</h3>
          <dl className="space-y-3 text-sm">
            {[['Phone', c.phone], ['Email', c.email], ['GSTIN', c.gstin], ['Type', c.type]].map(([k, v]) => (
              <div key={k} className="flex justify-between"><dt className="text-gray-500">{k}</dt><dd className="font-medium capitalize">{v || '—'}</dd></div>
            ))}
          </dl>
        </div>
        <div className="card p-5">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Financial</h3>
          <dl className="space-y-3 text-sm">
            {[['Outstanding', `₹${Math.abs(c.currentBalance || 0).toLocaleString('en-IN')}`], ['Credit Limit', `₹${(c.creditLimit || 0).toLocaleString('en-IN')}`], ['Price Group', c.priceGroup], ['Payment Terms', c.paymentTerms?.replace('_', ' ')]].map(([k, v]) => (
              <div key={k} className="flex justify-between"><dt className="text-gray-500">{k}</dt><dd className="font-semibold capitalize">{v || '—'}</dd></div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
}

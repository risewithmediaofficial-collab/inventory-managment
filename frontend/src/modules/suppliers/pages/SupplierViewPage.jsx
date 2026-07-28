import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import api from '@services/axios.js';

export default function SupplierViewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({ queryKey: ['supplier', id], queryFn: () => api.get(`/suppliers/${id}`) });
  const s = data?.data;

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full" /></div>;
  if (!s) return null;

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="btn-ghost btn-icon"><ArrowLeft size={18} /></button>
        <div><h1 className="page-title">{s.name}</h1><p className="page-subtitle">{s.code}</p></div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card p-5">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Contact</h3>
          <dl className="space-y-3 text-sm">
            {[['Phone', s.phone], ['Email', s.email], ['GSTIN', s.gstin], ['PAN', s.pan]].map(([k, v]) => (
              <div key={k} className="flex justify-between"><dt className="text-gray-500">{k}</dt><dd className="font-medium">{v || '—'}</dd></div>
            ))}
          </dl>
        </div>
        <div className="card p-5">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Financial</h3>
          <dl className="space-y-3 text-sm">
            {[['Balance', `₹${Math.abs(s.currentBalance || 0).toLocaleString('en-IN')}`], ['Credit Limit', `₹${(s.creditLimit || 0).toLocaleString('en-IN')}`], ['Payment Terms', s.paymentTerms?.replace('_', ' ')]].map(([k, v]) => (
              <div key={k} className="flex justify-between"><dt className="text-gray-500">{k}</dt><dd className="font-semibold text-gray-900">{v || '—'}</dd></div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
}

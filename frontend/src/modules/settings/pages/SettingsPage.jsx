import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Building2, Save } from 'lucide-react';
import api from '@services/axios.js';
import toast from 'react-hot-toast';
import { useEffect } from 'react';

export default function SettingsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['settings'], queryFn: () => api.get('/settings') });

  const { register, handleSubmit, reset } = useForm();

  useEffect(() => {
    if (data?.data) {
      reset({
        name: data.data.name,
        email: data.data.email,
        phone: data.data.phone,
        gstin: data.data.gstin,
        pan: data.data.pan,
        currencySymbol: data.data.currencySymbol || '₹',
        address: data.data.address?.street || '',
        city: data.data.address?.city || '',
        state: data.data.address?.state || '',
      });
    }
  }, [data, reset]);

  const mutation = useMutation({
    mutationFn: (formData) => api.put('/settings', formData),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Settings updated!');
    },
  });

  if (isLoading) return <div className="p-8 text-center text-sm text-gray-400">Loading settings...</div>;

  return (
    <div className="max-w-3xl space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Company Settings</h1>
          <p className="page-subtitle">Manage company details, tax registration, and invoice settings</p>
        </div>
      </div>

      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-5">
        <div className="card p-5 space-y-4">
          <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-3">Company Information</h3>
          <div className="form-group">
            <label className="input-label">Company Legal Name</label>
            <input {...register('name')} className="input" placeholder="Company Name" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="input-label">Email</label>
              <input {...register('email')} className="input" placeholder="email@company.com" />
            </div>
            <div className="form-group">
              <label className="input-label">Phone</label>
              <input {...register('phone')} className="input" placeholder="+91..." />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="input-label">GSTIN</label>
              <input {...register('gstin')} className="input font-mono" placeholder="22AAAAA0000A1Z5" />
            </div>
            <div className="form-group">
              <label className="input-label">PAN</label>
              <input {...register('pan')} className="input font-mono" placeholder="AAAAA0000A" />
            </div>
          </div>
        </div>

        <div className="card p-5 space-y-4">
          <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-3">Address</h3>
          <div className="form-group">
            <label className="input-label">Street Address</label>
            <input {...register('address')} className="input" placeholder="Address..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="input-label">City</label>
              <input {...register('city')} className="input" placeholder="City" />
            </div>
            <div className="form-group">
              <label className="input-label">State</label>
              <input {...register('state')} className="input" placeholder="State" />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button type="submit" disabled={mutation.isPending} className="btn-primary gap-2">
            {mutation.isPending ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={16} />}
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}

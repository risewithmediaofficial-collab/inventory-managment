import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, User, Phone, Mail, Building2, CreditCard, Check } from 'lucide-react';
import api from '@services/axios.js';
import toast from 'react-hot-toast';

export default function CustomerFormPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    gstin: '',
    street: '',
    city: '',
    state: '',
    pincode: '',
    priceGroup: 'retail',
    creditLimit: '',
    paymentTerms: 'immediate',
    notes: '',
  });

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/customers', data),
    onSuccess: (apiRes) => {
      // axios interceptor returns response.data, so apiRes = { success, message, data: <customer> }
      qc.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Customer created successfully!');
      const id = apiRes?.data?._id;
      if (id) navigate(`/customers/${id}`);
      else navigate('/customers');
    },
    onError: (err) => toast.error(err?.message || 'Failed to create customer'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Customer name is required');

    // Build nested address object as expected by model
    const payload = {
      name: form.name.trim(),
      phone: form.phone.trim() || undefined,
      email: form.email.trim() || undefined,
      gstin: form.gstin.trim() || undefined,
      priceGroup: form.priceGroup,
      paymentTerms: form.paymentTerms,
      notes: form.notes.trim() || undefined,
    };
    if (form.creditLimit) payload.creditLimit = Number(form.creditLimit);
    if (form.street || form.city || form.state || form.pincode) {
      payload.address = {
        street: form.street || undefined,
        city: form.city || undefined,
        state: form.state || undefined,
        pincode: form.pincode || undefined,
      };
    }

    createMutation.mutate(payload);
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="btn-ghost btn-icon">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="page-title">Add New Customer</h1>
          <p className="page-subtitle">Create a customer profile to link with invoices</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Basic Info */}
        <div className="card p-5 space-y-4">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
            <User size={13} /> Basic Information
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="form-group sm:col-span-2">
              <label className="input-label">Full Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                className="input"
                placeholder="e.g. Ramesh Kumar"
                required
                autoFocus
              />
            </div>
            <div className="form-group">
              <label className="input-label">Phone Number</label>
              <div className="relative">
                <Phone size={14} className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => set('phone', e.target.value)}
                  className="input pl-9"
                  placeholder="9876543210"
                />
              </div>
            </div>
            <div className="form-group">
              <label className="input-label">Email Address</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => set('email', e.target.value)}
                  className="input pl-9"
                  placeholder="customer@email.com"
                />
              </div>
            </div>
            <div className="form-group sm:col-span-2">
              <label className="input-label">GSTIN</label>
              <div className="relative">
                <Building2 size={14} className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  value={form.gstin}
                  onChange={(e) => set('gstin', e.target.value.toUpperCase())}
                  className="input pl-9 font-mono uppercase"
                  placeholder="22AAAAA0000A1Z5"
                  maxLength={15}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="card p-5 space-y-4">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Address</h3>
          <div className="form-group">
            <label className="input-label">Street Address</label>
            <textarea
              value={form.street}
              onChange={(e) => set('street', e.target.value)}
              className="input resize-none"
              rows={2}
              placeholder="Door No, Street Name"
            />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="form-group">
              <label className="input-label">City</label>
              <input type="text" value={form.city} onChange={(e) => set('city', e.target.value)} className="input" placeholder="City" />
            </div>
            <div className="form-group">
              <label className="input-label">State</label>
              <input type="text" value={form.state} onChange={(e) => set('state', e.target.value)} className="input" placeholder="State" />
            </div>
            <div className="form-group">
              <label className="input-label">Pincode</label>
              <input type="text" value={form.pincode} onChange={(e) => set('pincode', e.target.value)} className="input" placeholder="600001" maxLength={6} />
            </div>
          </div>
        </div>

        {/* Financial */}
        <div className="card p-5 space-y-4">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
            <CreditCard size={13} /> Financial Settings
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="form-group">
              <label className="input-label">Price Group</label>
              <select value={form.priceGroup} onChange={(e) => set('priceGroup', e.target.value)} className="input">
                <option value="retail">Retail</option>
                <option value="wholesale">Wholesale</option>
                <option value="vip">VIP</option>
                <option value="distributor">Distributor</option>
              </select>
            </div>
            <div className="form-group">
              <label className="input-label">Payment Terms</label>
              <select value={form.paymentTerms} onChange={(e) => set('paymentTerms', e.target.value)} className="input">
                <option value="immediate">Immediate</option>
                <option value="net_7">Net 7 Days</option>
                <option value="net_15">Net 15 Days</option>
                <option value="net_30">Net 30 Days</option>
                <option value="net_60">Net 60 Days</option>
              </select>
            </div>
            <div className="form-group">
              <label className="input-label">Credit Limit (₹)</label>
              <input
                type="number"
                min={0}
                value={form.creditLimit}
                onChange={(e) => set('creditLimit', e.target.value)}
                className="input font-mono"
                placeholder="0"
              />
            </div>
          </div>
          <div className="form-group">
            <label className="input-label">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              className="input resize-none"
              rows={2}
              placeholder="Internal notes about this customer..."
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pb-6">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary">
            Cancel
          </button>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="btn-primary gap-2 px-6"
          >
            {createMutation.isPending ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Check size={16} />
            )}
            {createMutation.isPending ? 'Saving...' : 'Create Customer'}
          </button>
        </div>
      </form>
    </div>
  );
}

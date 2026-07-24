// Generic master data page factory
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit, Trash2, X, Check } from 'lucide-react';
import api from '@services/axios.js';
import DataTable from '@components/ui/DataTable.jsx';
import toast from 'react-hot-toast';

function MasterModal({ title, fields, initial, onSave, onClose, loading }) {
  const [form, setForm] = useState(initial || {});
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4" onClick={onClose}>
      <motion.div
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="btn-ghost btn-icon"><X size={16} /></button>
        </div>
        <div className="p-5 space-y-4">
          {fields.map((f) => (
            <div key={f.key} className="form-group">
              <label className="input-label">{f.label}{f.required && ' *'}</label>
              {f.type === 'textarea' ? (
                <textarea value={form[f.key] || ''} onChange={(e) => set(f.key, e.target.value)} rows={3} className="input resize-none" placeholder={f.placeholder} />
              ) : f.type === 'select' ? (
                <select value={form[f.key] || ''} onChange={(e) => set(f.key, e.target.value)} className="input">
                  <option value="">Select...</option>
                  {f.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              ) : (
                <input type={f.type || 'text'} value={form[f.key] || ''} onChange={(e) => set(f.key, e.target.value)} className="input" placeholder={f.placeholder} />
              )}
            </div>
          ))}
        </div>
        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-gray-100 bg-gray-50">
          <button onClick={onClose} className="btn-secondary btn-sm">Cancel</button>
          <button onClick={() => onSave(form)} disabled={loading} className="btn-primary btn-sm gap-1.5">
            {loading ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check size={14} />}
            Save
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export function createMasterPage({ title, subtitle, endpoint, columns, formFields, initialValues = {} }) {
  return function MasterPage() {
    const qc = useQueryClient();
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [modal, setModal] = useState(null); // null | { mode: 'create' | 'edit', data? }

    const { data, isLoading } = useQuery({
      queryKey: [endpoint, page, search],
      queryFn: () => api.get(`/${endpoint}?page=${page}&limit=20&search=${search}`),
    });

    const saveMutation = useMutation({
      mutationFn: (form) => modal?.data?._id ? api.put(`/${endpoint}/${modal.data._id}`, form) : api.post(`/${endpoint}`, form),
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: [endpoint] });
        toast.success(modal?.data ? 'Updated successfully' : 'Created successfully');
        setModal(null);
      },
    });

    const deleteMutation = useMutation({
      mutationFn: (id) => api.delete(`/${endpoint}/${id}`),
      onSuccess: () => { qc.invalidateQueries({ queryKey: [endpoint] }); toast.success('Deleted successfully'); },
    });

    return (
      <div className="space-y-5">
        <div className="page-header">
          <div>
            <h1 className="page-title">{title}</h1>
            <p className="page-subtitle">{subtitle}</p>
          </div>
        </div>

        <DataTable
          data={data?.data || []}
          columns={columns}
          loading={isLoading}
          pagination={data?.pagination}
          onPageChange={setPage}
          onSearch={(q) => { setSearch(q); setPage(1); }}
          searchPlaceholder={`Search ${title.toLowerCase()}...`}
          onAdd={() => setModal({ mode: 'create' })}
          addLabel={`Add ${title.slice(0, -1) || title}`}
          emptyTitle={`No ${title.toLowerCase()} yet`}
          emptyDescription={`Create your first ${title.slice(0, -1).toLowerCase()}`}
          rowActions={(row) => (
            <>
              <button onClick={() => setModal({ mode: 'edit', data: row })} className="btn-icon btn-ghost" title="Edit"><Edit size={14} /></button>
              <button onClick={() => { if (confirm(`Delete this ${title.slice(0, -1).toLowerCase()}?`)) deleteMutation.mutate(row._id); }} className="btn-icon btn-ghost text-danger hover:bg-red-50" title="Delete"><Trash2 size={14} /></button>
            </>
          )}
        />

        <AnimatePresence>
          {modal && (
            <MasterModal
              title={modal.mode === 'create' ? `Add ${title.slice(0, -1)}` : `Edit ${title.slice(0, -1)}`}
              fields={formFields}
              initial={modal.data || initialValues}
              onSave={(form) => saveMutation.mutate(form)}
              onClose={() => setModal(null)}
              loading={saveMutation.isPending}
            />
          )}
        </AnimatePresence>
      </div>
    );
  };
}

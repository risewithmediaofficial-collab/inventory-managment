import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserCheck, Shield, Clock, CheckCircle2, Warehouse, Building2 } from 'lucide-react';
import api from '@services/axios.js';
import DataTable from '@components/ui/DataTable.jsx';
import toast from 'react-hot-toast';

export default function UsersPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [roles, setRoles] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [approvalForm, setApprovalForm] = useState({
    roleId: '',
    assignedWarehouse: '',
    assignedBranch: '',
    isApproved: true,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['users', page],
    queryFn: () => api.get(`/users?page=${page}&limit=20`),
  });

  useEffect(() => {
    const fetchMasters = async () => {
      try {
        const [rRes, wRes, bRes] = await Promise.all([
          api.get('/users/roles'),
          api.get('/warehouses'),
          api.get('/branches'),
        ]);
        setRoles(rRes.data.data || []);
        setWarehouses(wRes.data.data || []);
        setBranches(bRes.data.data || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchMasters();
  }, []);

  const approveMutation = useMutation({
    mutationFn: ({ id, payload }) => api.put(`/users/${id}/approve`, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      toast.success('User approval, role & warehouse position saved!');
      setSelectedUser(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Approval failed');
    },
  });

  const columns = [
    {
      key: 'firstName',
      label: 'User',
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 font-bold text-indigo-700 text-xs">
            {row.firstName?.[0]}{row.lastName?.[0]}
          </div>
          <div>
            <div className="font-bold text-gray-900 text-sm">{row.firstName} {row.lastName}</div>
            <div className="text-xs text-gray-400">{row.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      label: 'Assigned Role',
      render: (v) => v ? (
        <span className="bg-indigo-50 text-indigo-700 text-xs font-bold px-2.5 py-1 rounded-full border border-indigo-100">
          {v.displayName || v.name}
        </span>
      ) : (
        <span className="text-xs text-amber-600 font-semibold bg-amber-50 px-2 py-0.5 rounded">Unassigned</span>
      ),
    },
    {
      key: 'assignedWarehouse',
      label: 'Position & Location',
      render: (_, row) => (
        <div className="text-xs space-y-1">
          {row.assignedWarehouse && (
            <div className="flex items-center gap-1 text-slate-700 font-medium">
              <Warehouse className="w-3.5 h-3.5 text-indigo-500" /> {row.assignedWarehouse.name}
            </div>
          )}
          {row.assignedBranch && (
            <div className="flex items-center gap-1 text-slate-500">
              <Building2 className="w-3.5 h-3.5 text-slate-400" /> {row.assignedBranch.name}
            </div>
          )}
          {!row.assignedWarehouse && !row.assignedBranch && (
            <span className="text-slate-400">All Locations (Admin)</span>
          )}
        </div>
      ),
    },
    {
      key: 'approvalStatus',
      label: 'Approval Status',
      render: (v, row) => (
        <span className={`text-xs px-2.5 py-1 rounded-full font-bold capitalize flex items-center gap-1 w-max ${
          row.isApproved || v === 'approved' ? 'bg-emerald-100 text-emerald-700' :
          v === 'rejected' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
        }`}>
          {row.isApproved || v === 'approved' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
          {row.isApproved || v === 'approved' ? 'Approved' : 'Pending Approval'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Action',
      render: (_, row) => (
        <button
          onClick={() => {
            setSelectedUser(row);
            setApprovalForm({
              roleId: row.role?._id || '',
              assignedWarehouse: row.assignedWarehouse?._id || '',
              assignedBranch: row.assignedBranch?._id || '',
              isApproved: true,
            });
          }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm transition flex items-center gap-1"
        >
          <UserCheck className="w-3.5 h-3.5" /> Approve & Assign Position
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">User Approval & Role/Position Assignment</h1>
          <p className="page-subtitle">Approve new registrations, assign operational roles & bind staff to specific Warehouses or Branches</p>
        </div>
      </div>

      <DataTable
        data={data?.data || []}
        columns={columns}
        loading={isLoading}
        pagination={data?.pagination}
        onPageChange={setPage}
        emptyTitle="No registered users found"
        emptyDescription="Registered accounts will appear here for your review and approval."
      />

      {/* Admin Approval & Role/Warehouse Assignment Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <div>
                <h3 className="font-bold text-gray-900 text-lg">Approve & Assign Position</h3>
                <p className="text-xs text-gray-500">{selectedUser.firstName} {selectedUser.lastName} ({selectedUser.email})</p>
              </div>
              <button onClick={() => setSelectedUser(null)} className="text-gray-400 hover:text-gray-600 text-sm">✕</button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                approveMutation.mutate({
                  id: selectedUser._id,
                  payload: approvalForm,
                });
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">System Role *</label>
                <select
                  required
                  value={approvalForm.roleId}
                  onChange={(e) => setApprovalForm({ ...approvalForm, roleId: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl p-2.5 text-sm font-semibold text-gray-800 outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select Role...</option>
                  {roles.map((r) => (
                    <option key={r._id} value={r._id}>
                      {r.displayName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Assigned Godown / Warehouse (Optional)</label>
                <select
                  value={approvalForm.assignedWarehouse}
                  onChange={(e) => setApprovalForm({ ...approvalForm, assignedWarehouse: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl p-2.5 text-sm font-semibold text-gray-800 outline-none"
                >
                  <option value="">All Warehouses (Super Admin / Global)</option>
                  {warehouses.map((w) => (
                    <option key={w._id} value={w._id}>
                      📦 {w.name} ({w.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Assigned Branch (Optional)</label>
                <select
                  value={approvalForm.assignedBranch}
                  onChange={(e) => setApprovalForm({ ...approvalForm, assignedBranch: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl p-2.5 text-sm font-semibold text-gray-800 outline-none"
                >
                  <option value="">All Branches (Head Office View)</option>
                  {branches.map((b) => (
                    <option key={b._id} value={b._id}>
                      🏢 {b.name} ({b.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Account Status</label>
                <select
                  value={approvalForm.isApproved ? 'approved' : 'rejected'}
                  onChange={(e) => setApprovalForm({ ...approvalForm, isApproved: e.target.value === 'approved' })}
                  className="w-full border border-gray-300 rounded-xl p-2.5 text-sm font-semibold text-gray-800 outline-none"
                >
                  <option value="approved">✅ Approve & Grant Access</option>
                  <option value="rejected">❌ Reject Request / Keep Suspended</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={approveMutation.isPending}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md"
                >
                  {approveMutation.isPending ? 'Saving...' : 'Save Approval & Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

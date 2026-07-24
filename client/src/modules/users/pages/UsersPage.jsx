import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserCheck, Shield, Clock, CheckCircle2, Warehouse, Building2, AlertCircle, Filter } from 'lucide-react';
import api from '@services/axios.js';
import DataTable from '@components/ui/DataTable.jsx';
import toast from 'react-hot-toast';

export default function UsersPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'pending' | 'approved'
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
    queryKey: ['users', page, activeTab],
    queryFn: () => {
      let url = `/users?page=${page}&limit=20`;
      if (activeTab === 'pending') url += '&approvalStatus=pending';
      if (activeTab === 'approved') url += '&approvalStatus=approved';
      return api.get(url);
    },
  });

  useEffect(() => {
    const fetchMasters = async () => {
      try {
        const [rRes, wRes, bRes] = await Promise.all([
          api.get('/users/roles'),
          api.get('/warehouses'),
          api.get('/branches'),
        ]);
        const rolesList = Array.isArray(rRes) ? rRes : (rRes?.data || []);
        const warehousesList = Array.isArray(wRes) ? wRes : (wRes?.data || []);
        const branchesList = Array.isArray(bRes) ? bRes : (bRes?.data || []);

        setRoles(rolesList);
        setWarehouses(warehousesList);
        setBranches(branchesList);
      } catch (err) {
        console.error('Error loading roles/warehouses/branches:', err);
      }
    };
    fetchMasters();
  }, []);

  const approveMutation = useMutation({
    mutationFn: ({ id, payload }) => api.put(`/users/${id}/approve`, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      toast.success('User approval, role & position saved successfully!');
      setSelectedUser(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || err.message || 'Approval failed');
    },
  });

  const usersList = Array.isArray(data) ? data : (data?.data || []);
  const pendingCount = usersList.filter(u => u.approvalStatus === 'pending' || !u.isApproved).length;

  const columns = [
    {
      key: 'firstName',
      label: 'Registered User',
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 font-bold text-indigo-700 text-sm">
            {row.firstName?.[0]}{row.lastName?.[0]}
          </div>
          <div>
            <div className="font-bold text-gray-900 text-sm">{row.firstName} {row.lastName}</div>
            <div className="text-xs text-gray-500 font-mono">{row.email}</div>
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
        <span className="text-xs text-amber-700 bg-amber-50 font-bold px-2.5 py-1 rounded-full border border-amber-200 animate-pulse">
          ⚠️ Needs Role Assignment
        </span>
      ),
    },
    {
      key: 'assignedWarehouse',
      label: 'Assigned Position / Location',
      render: (_, row) => (
        <div className="text-xs space-y-1">
          {row.assignedWarehouse && (
            <div className="flex items-center gap-1 text-slate-700 font-bold">
              <Warehouse className="w-3.5 h-3.5 text-indigo-600" /> {row.assignedWarehouse.name}
            </div>
          )}
          {row.assignedBranch && (
            <div className="flex items-center gap-1 text-slate-500 font-medium">
              <Building2 className="w-3.5 h-3.5 text-slate-400" /> {row.assignedBranch.name}
            </div>
          )}
          {!row.assignedWarehouse && !row.assignedBranch && (
            <span className="text-slate-400 font-medium">Global / Unassigned</span>
          )}
        </div>
      ),
    },
    {
      key: 'approvalStatus',
      label: 'Account Status',
      render: (v, row) => (
        <span className={`text-xs px-3 py-1 rounded-full font-bold capitalize flex items-center gap-1.5 w-max ${
          row.isApproved || v === 'approved' ? 'bg-emerald-100 text-emerald-700' :
          v === 'rejected' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700 border border-amber-200'
        }`}>
          {row.isApproved || v === 'approved' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
          {row.isApproved || v === 'approved' ? 'Approved Account' : 'Pending Approval'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Admin Action',
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
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-sm transition flex items-center gap-1.5"
        >
          <UserCheck className="w-4 h-4" /> Approve & Assign Role
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="page-header flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="page-title">User Approvals & Role Assignments</h1>
          <p className="page-subtitle">Review new account signups, grant system access & bind staff to Godowns or Branches</p>
        </div>

        {/* Tab Filters */}
        <div className="bg-gray-100 p-1 rounded-xl flex text-xs font-bold">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-1.5 rounded-lg transition ${activeTab === 'all' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-600'}`}
          >
            All Accounts
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-3.5 py-1.5 rounded-lg transition flex items-center gap-1.5 ${activeTab === 'pending' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-600'}`}
          >
            Pending Approvals
            {pendingCount > 0 && (
              <span className="bg-rose-500 text-white text-2xs px-1.5 py-0.5 rounded-full font-extrabold">{pendingCount}</span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('approved')}
            className={`px-3.5 py-1.5 rounded-lg transition ${activeTab === 'approved' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-600'}`}
          >
            Approved Users
          </button>
        </div>
      </div>

      {/* Alert Card if pending approvals exist */}
      {pendingCount > 0 && activeTab !== 'pending' && (
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-2xl p-4 shadow-md flex justify-between items-center">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-amber-100 flex-shrink-0" />
            <div>
              <p className="font-bold text-sm">Action Required: {pendingCount} New Signup(s) Awaiting Approval</p>
              <p className="text-xs text-amber-100">Review pending user accounts, approve access, and assign roles & warehouse locations.</p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('pending')}
            className="bg-white text-amber-900 hover:bg-amber-50 px-3.5 py-1.5 rounded-xl text-xs font-extrabold shadow-sm"
          >
            Review Pending ({pendingCount}) →
          </button>
        </div>
      )}

      <DataTable
        data={usersList}
        columns={columns}
        loading={isLoading}
        pagination={data?.pagination}
        onPageChange={setPage}
        emptyTitle="No users found"
        emptyDescription="When new users register an account, they will appear here for Admin review & role assignment."
      />

      {/* Admin Approval & Role/Warehouse Assignment Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <div>
                <h3 className="font-bold text-gray-900 text-lg">Approve Account & Assign Role</h3>
                <p className="text-xs text-gray-500 font-semibold">{selectedUser.firstName} {selectedUser.lastName} ({selectedUser.email})</p>
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
                <label className="block text-xs font-bold text-gray-700 mb-1">Select System Role *</label>
                <select
                  required
                  value={approvalForm.roleId}
                  onChange={(e) => setApprovalForm({ ...approvalForm, roleId: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl p-2.5 text-sm font-bold text-gray-800 outline-none focus:ring-2 focus:ring-indigo-500"
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
                <label className="block text-xs font-bold text-gray-700 mb-1">Assign Warehouse / Godown Position</label>
                <select
                  value={approvalForm.assignedWarehouse}
                  onChange={(e) => setApprovalForm({ ...approvalForm, assignedWarehouse: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl p-2.5 text-sm font-semibold text-gray-800 outline-none"
                >
                  <option value="">All Warehouses (Global Admin / Executive)</option>
                  {warehouses.map((w) => (
                    <option key={w._id} value={w._id}>
                      📦 {w.name} ({w.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Assign Branch</label>
                <select
                  value={approvalForm.assignedBranch}
                  onChange={(e) => setApprovalForm({ ...approvalForm, assignedBranch: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl p-2.5 text-sm font-semibold text-gray-800 outline-none"
                >
                  <option value="">All Branches (Head Office)</option>
                  {branches.map((b) => (
                    <option key={b._id} value={b._id}>
                      🏢 {b.name} ({b.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Approval Status</label>
                <select
                  value={approvalForm.isApproved ? 'approved' : 'rejected'}
                  onChange={(e) => setApprovalForm({ ...approvalForm, isApproved: e.target.value === 'approved' })}
                  className="w-full border border-gray-300 rounded-xl p-2.5 text-sm font-bold text-gray-800 outline-none"
                >
                  <option value="approved">✅ Approve Account & Grant Login Access</option>
                  <option value="rejected">❌ Reject Registration Request</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={approveMutation.isPending}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md"
                >
                  {approveMutation.isPending ? 'Saving...' : 'Confirm & Save Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Clock, ShieldCheck, FileCheck } from 'lucide-react';
import api from '@services/axios.js';

export default function PendingApprovalsPage() {
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      const res = await api.get('/approvals');
      setApprovals(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, []);

  const handleAction = async (id, status) => {
    const comments = prompt(`Enter comments for ${status}:`);
    if (comments === null) return;

    try {
      await api.put(`/approvals/${id}/process`, { status, comments });
      fetchApprovals();
    } catch (err) {
      alert(err.response?.data?.message || 'Action failed');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Approval Workflow Engine</h1>
        <p className="text-slate-500 text-sm">Review & authorize Purchase Orders, Stock Adjustments, and Sales Returns</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 font-bold text-slate-700 flex items-center gap-2">
          <Clock className="w-5 h-5 text-amber-500" /> Pending & Historical Approvals
        </div>

        <div className="divide-y divide-slate-100">
          {approvals.length === 0 ? (
            <div className="p-8 text-center text-slate-400">No approval requests found</div>
          ) : (
            approvals.map((a) => (
              <div key={a._id} className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-slate-50 transition">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-slate-800">{a.module}</span>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold capitalize ${
                      a.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                      a.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                    }`}>
                      {a.status}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600">Reason: {a.reason}</p>
                  <p className="text-xs text-slate-400 mt-1">Requested by {a.requestedBy?.name || 'User'} on {new Date(a.createdAt).toLocaleDateString()}</p>
                </div>

                {a.status === 'pending' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAction(a._id, 'approved')}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-sm"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Approve
                    </button>
                    <button
                      onClick={() => handleAction(a._id, 'rejected')}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-sm"
                    >
                      <XCircle className="w-4 h-4" /> Reject
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck, Trash2 } from 'lucide-react';
import api from '@services/axios.js';
import toast from 'react-hot-toast';

export default function NotificationsPage() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications'),
  });

  const markAllMutation = useMutation({
    mutationFn: () => api.put('/notifications/mark-all-read'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('All marked as read');
    },
  });

  const notifs = data?.data || [];

  return (
    <div className="max-w-3xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="page-subtitle">Real-time alerts, stock warnings, and activity logs</p>
        </div>
        <button onClick={() => markAllMutation.mutate()} className="btn-secondary btn-sm gap-2">
          <CheckCheck size={14} /> Mark all read
        </button>
      </div>

      <div className="card overflow-hidden divide-y divide-gray-100">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-gray-400">Loading notifications...</div>
        ) : notifs.length === 0 ? (
          <div className="p-12 text-center text-sm text-gray-400 flex flex-col items-center">
            <Bell size={28} className="text-gray-300 mb-2" />
            No new notifications
          </div>
        ) : (
          notifs.map((n) => (
            <div key={n._id} className="p-4 flex items-start gap-3 hover:bg-gray-50 transition-colors">
              <div className="w-8 h-8 rounded-full bg-brand-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bell size={15} className="text-brand-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-gray-900">{n.title}</div>
                <div className="text-sm text-gray-600 mt-0.5">{n.message}</div>
                <div className="text-xs text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString('en-IN')}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

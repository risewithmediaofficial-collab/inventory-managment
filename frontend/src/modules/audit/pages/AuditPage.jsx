import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Shield } from 'lucide-react';
import api from '@services/axios.js';
import DataTable from '@components/ui/DataTable.jsx';

const columns = [
  { key: 'createdAt', label: 'Timestamp', render: (v) => (
    <div>
      <div className="text-sm font-medium text-gray-900">{new Date(v).toLocaleDateString('en-IN')}</div>
      <div className="text-xs text-gray-400">{new Date(v).toLocaleTimeString('en-IN')}</div>
    </div>
  )},
  { key: 'user', label: 'User', render: (v) => v ? `${v.firstName} ${v.lastName}` : 'System' },
  { key: 'action', label: 'Action', render: (v) => <span className="badge-brand uppercase font-mono text-xs">{v}</span> },
  { key: 'resource', label: 'Resource', render: (v) => <span className="badge-gray capitalize">{v}</span> },
  { key: 'ipAddress', label: 'IP Address', render: (v) => <code className="text-xs text-gray-500 font-mono">{v || '127.0.0.1'}</code> },
];

export default function AuditPage() {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', page],
    queryFn: () => api.get(`/audit?page=${page}&limit=20`),
  });

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Audit Trail</h1>
          <p className="page-subtitle">Security log of all user activities, data modifications, and logins</p>
        </div>
      </div>

      <DataTable
        data={data?.data || []}
        columns={columns}
        loading={isLoading}
        pagination={data?.pagination}
        onPageChange={setPage}
        emptyTitle="No audit logs recorded"
        emptyDescription="User activity will be recorded here for security compliance"
      />
    </div>
  );
}

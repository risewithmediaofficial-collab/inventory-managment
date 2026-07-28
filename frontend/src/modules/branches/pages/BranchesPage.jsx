import { createMasterPage } from '@components/ui/MasterPage.jsx';

const columns = [
  { key: 'name', label: 'Branch Name', render: (v) => <span className="font-medium text-gray-900">{v}</span> },
  { key: 'code', label: 'Code', render: (v) => <code className="badge-brand font-mono">{v}</code> },
  { key: 'phone', label: 'Phone', render: (v) => v || '—' },
  { key: 'email', label: 'Email', render: (v) => v || '—' },
  { key: 'gstin', label: 'GSTIN', render: (v) => v ? <code className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded">{v}</code> : '—' },
  { key: 'isHeadOffice', label: 'Head Office', render: (v) => v ? <span className="badge-success">Head Office</span> : <span className="text-gray-400">—</span> },
  { key: 'status', label: 'Status', render: (v) => <span className={v === 'active' ? 'badge-success' : 'badge-gray'}>{v || 'active'}</span> },
];

const formFields = [
  { key: 'name', label: 'Branch Name', placeholder: 'e.g. Central Head Office', required: true },
  { key: 'code', label: 'Branch Code', placeholder: 'e.g. BR-01', required: true },
  { key: 'phone', label: 'Phone Number', placeholder: '+91 9876543210' },
  { key: 'email', label: 'Email', type: 'email', placeholder: 'branch@company.com' },
  { key: 'gstin', label: 'GSTIN', placeholder: '27AAAAA0000A1Z5' },
  { key: 'status', label: 'Status', type: 'select', options: [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
  ]},
];

export default createMasterPage({
  title: 'Branch Management',
  subtitle: 'Manage company head office & regional branches',
  endpoint: 'branches',
  columns,
  formFields,
  initialValues: { status: 'active', isHeadOffice: false },
});

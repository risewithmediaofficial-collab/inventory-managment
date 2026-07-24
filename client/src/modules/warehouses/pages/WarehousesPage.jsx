import { createMasterPage } from '@components/ui/MasterPage.jsx';

const columns = [
  { key: 'name', label: 'Warehouse', render: (v) => <span className="font-medium">{v}</span> },
  { key: 'code', label: 'Code', render: (v) => <code className="badge-brand font-mono">{v}</code> },
  { key: 'type', label: 'Type', render: (v) => <span className="badge-gray capitalize">{v}</span> },
  { key: 'address', label: 'Location', render: (v) => v ? `${v.city || '—'}, ${v.state || ''}` : '—' },
  { key: 'isDefault', label: 'Default', render: (v) => v ? <span className="badge-success">Default</span> : null },
  { key: 'isActive', label: 'Status', render: (v) => <span className={v ? 'badge-success' : 'badge-gray'}>{v ? 'Active' : 'Inactive'}</span> },
];
const formFields = [
  { key: 'name', label: 'Warehouse Name', placeholder: 'e.g. Main Warehouse', required: true },
  { key: 'code', label: 'Code', placeholder: 'e.g. WH-001' },
  { key: 'type', label: 'Type', type: 'select', options: [
    { value: 'main', label: 'Main' }, { value: 'secondary', label: 'Secondary' }, { value: 'transit', label: 'Transit' },
  ]},
];
export default createMasterPage({ title: 'Warehouses', subtitle: 'Manage storage locations', endpoint: 'warehouses', columns, formFields });

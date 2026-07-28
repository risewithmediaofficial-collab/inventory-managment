import { createMasterPage } from '@components/ui/MasterPage.jsx';

const columns = [
  { key: 'name', label: 'Tax Name', render: (v) => <span className="font-medium">{v}</span> },
  { key: 'type', label: 'Type', render: (v) => <span className="badge-brand">{v}</span> },
  { key: 'rate', label: 'Rate', render: (v) => <span className="font-semibold text-gray-900">{v}%</span> },
  { key: 'hsnCode', label: 'HSN Code', render: (v) => v ? <code className="text-xs font-mono text-gray-500">{v}</code> : '—' },
  { key: 'isActive', label: 'Status', render: (v) => <span className={v ? 'badge-success' : 'badge-gray'}>{v ? 'Active' : 'Inactive'}</span> },
];
const formFields = [
  { key: 'name', label: 'Tax Name', placeholder: 'e.g. GST 18%', required: true },
  { key: 'type', label: 'Type', type: 'select', options: [{ value: 'GST', label: 'GST' }, { value: 'IGST', label: 'IGST' }, { value: 'NONE', label: 'None' }] },
  { key: 'rate', label: 'Rate (%)', type: 'number', placeholder: '18', required: true },
  { key: 'hsnCode', label: 'HSN Code', placeholder: 'e.g. 8471' },
];
export default createMasterPage({ title: 'Taxes', subtitle: 'GST & tax configuration', endpoint: 'taxes', columns, formFields });

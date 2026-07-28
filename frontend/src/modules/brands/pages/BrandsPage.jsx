import { createMasterPage } from '@components/ui/MasterPage.jsx';

const columns = [
  { key: 'name', label: 'Brand', render: (v) => <span className="font-medium">{v}</span> },
  { key: 'slug', label: 'Slug', render: (v) => <code className="text-xs text-gray-500 font-mono">{v}</code> },
  { key: 'website', label: 'Website', render: (v) => v ? <a href={v} target="_blank" className="text-brand-600 text-xs hover:underline">{v}</a> : '—' },
  { key: 'isActive', label: 'Status', render: (v) => <span className={v ? 'badge-success' : 'badge-gray'}>{v ? 'Active' : 'Inactive'}</span> },
];
const formFields = [
  { key: 'name', label: 'Brand Name', placeholder: 'e.g. Samsung', required: true },
  { key: 'website', label: 'Website', placeholder: 'https://...' },
  { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Optional' },
];
export default createMasterPage({ title: 'Brands', subtitle: 'Manage product brands', endpoint: 'brands', columns, formFields });

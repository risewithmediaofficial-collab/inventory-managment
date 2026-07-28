import { createMasterPage } from '@components/ui/MasterPage.jsx';

const columns = [
  { key: 'name', label: 'Category Name', render: (v) => <span className="font-medium">{v}</span> },
  { key: 'slug', label: 'Slug', render: (v) => <code className="text-xs text-gray-500 font-mono">{v}</code> },
  { key: 'parent', label: 'Parent', render: (v) => v?.name || <span className="text-gray-400">Root</span> },
  { key: 'isActive', label: 'Status', render: (v) => <span className={v ? 'badge-success' : 'badge-gray'}>{v ? 'Active' : 'Inactive'}</span> },
];

const formFields = [
  { key: 'name', label: 'Category Name', placeholder: 'e.g. Electronics', required: true },
  { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Optional description' },
];

export default createMasterPage({
  title: 'Categories',
  subtitle: 'Organize products into categories',
  endpoint: 'categories',
  columns,
  formFields,
});

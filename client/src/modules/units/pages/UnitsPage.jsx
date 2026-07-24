import { createMasterPage } from '@components/ui/MasterPage.jsx';

const columns = [
  { key: 'name', label: 'Unit', render: (v) => <span className="font-medium">{v}</span> },
  { key: 'symbol', label: 'Symbol', render: (v) => <code className="badge-brand">{v}</code> },
  { key: 'type', label: 'Type', render: (v) => <span className="badge-gray capitalize">{v}</span> },
];
const formFields = [
  { key: 'name', label: 'Unit Name', placeholder: 'e.g. Kilogram', required: true },
  { key: 'symbol', label: 'Symbol', placeholder: 'e.g. kg', required: true },
  { key: 'type', label: 'Type', type: 'select', options: [
    { value: 'weight', label: 'Weight' }, { value: 'volume', label: 'Volume' }, { value: 'piece', label: 'Piece' },
    { value: 'length', label: 'Length' }, { value: 'area', label: 'Area' }, { value: 'other', label: 'Other' },
  ]},
];
export default createMasterPage({ title: 'Units', subtitle: 'Units of measurement', endpoint: 'units', columns, formFields });

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Plus, Download, Trash2, ChevronLeft, ChevronRight, MoreHorizontal, ChevronDown } from 'lucide-react';
import { clsx } from 'clsx';

function Skeleton({ className }) {
  return <div className={`skeleton ${className}`} />;
}

function MobileDefaultCard({ row, columns, rowActions, onRowClick }) {
  const [expanded, setExpanded] = useState(false);

  // First column is the "title" row, rest are field boxes
  const titleCol = columns[0];
  const fieldCols = columns.slice(1).filter(c => c.label); // skip blank-label cols (like thumbnail)

  return (
    <div
      className={`bg-white border border-gray-200 rounded-xl shadow-xs overflow-hidden transition-all duration-200 ${onRowClick ? 'cursor-pointer active:scale-[0.99]' : ''}`}
    >
      {/* Header row — always visible */}
      <div
        className="flex items-center justify-between gap-2 px-4 py-3"
        onClick={() => setExpanded(prev => !prev)}
      >
        <div className="flex-1 min-w-0">
          <div className="font-bold text-gray-900 text-sm truncate">
            {titleCol?.render ? titleCol.render(row[titleCol.key], row) : (row[titleCol.key] ?? '—')}
          </div>
          {/* Show second column inline as a subtle subtitle */}
          {fieldCols[0] && (
            <div className="text-2xs text-gray-400 mt-0.5 truncate">
              {fieldCols[0].label}: {fieldCols[0].render
                ? <span className="text-gray-600">{fieldCols[0].render(row[fieldCols[0].key], row)}</span>
                : (row[fieldCols[0].key] ?? '—')}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {rowActions && (
            <div onClick={(e) => e.stopPropagation()}>
              {rowActions(row)}
            </div>
          )}
          <ChevronDown
            size={16}
            className={`text-gray-400 transition-transform duration-200 ml-1 ${expanded ? 'rotate-180' : ''}`}
          />
        </div>
      </div>

      {/* Expanded field boxes */}
      {expanded && (
        <div
          className="border-t border-gray-100 bg-gray-50/60 px-3 pb-3 pt-2"
          onClick={() => onRowClick?.(row)}
        >
          <div className="grid grid-cols-2 gap-2">
            {fieldCols.map((col) => (
              <div
                key={col.key}
                className="bg-white border border-gray-100 rounded-lg px-3 py-2 min-w-0"
              >
                <span className="text-2xs font-semibold text-gray-400 uppercase tracking-wider block mb-0.5">
                  {col.label}
                </span>
                <div className="text-xs font-medium text-gray-800 break-words">
                  {col.render ? col.render(row[col.key], row) : (row[col.key] ?? '—')}
                </div>
              </div>
            ))}
          </div>
          {onRowClick && (
            <button
              className="mt-2.5 w-full text-center text-xs font-bold text-brand-600 py-1.5 rounded-lg bg-brand-50 border border-brand-100 hover:bg-brand-100 transition"
              onClick={(e) => { e.stopPropagation(); onRowClick(row); }}
            >
              View Details →
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function DataTable({
  data = [],
  columns = [],
  loading = false,
  pagination = null,
  onPageChange,
  title,
  subtitle,
  onAdd,
  addLabel = 'Add New',
  onSearch,
  searchPlaceholder = 'Search...',
  onDelete,
  rowActions,
  emptyIcon,
  emptyTitle = 'No data found',
  emptyDescription = 'Get started by adding your first item.',
  selectable = false,
  renderMobileCard = null,
  onRowClick = null,
}) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState([]);

  const handleSearch = (val) => {
    setSearch(val);
    onSearch?.(val);
  };

  const toggleSelect = (id) => {
    setSelected((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);
  };

  const toggleAll = () => {
    setSelected(selected.length === data.length ? [] : data.map((r) => r._id));
  };

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1">
          {title && <h2 className="text-sm font-semibold text-gray-900">{title}</h2>}
          {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Search */}
          {onSearch && (
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className="input pl-9 py-2 text-sm h-9 w-52"
              />
            </div>
          )}

          {/* Bulk delete */}
          {selectable && selected.length > 0 && onDelete && (
            <button onClick={() => onDelete(selected)} className="btn-danger btn-sm gap-1.5">
              <Trash2 size={14} />
              Delete ({selected.length})
            </button>
          )}

          {/* Add button */}
          {onAdd && (
            <button onClick={onAdd} className="btn-primary btn-sm gap-1.5">
              <Plus size={14} />
              {addLabel}
            </button>
          )}
        </div>
      </div>

      {/* Mobile Card Grid View */}
      <div className="block md:hidden p-3 space-y-3 bg-slate-50/40 border-b border-gray-100">
        {loading ? (
          Array(4).fill(0).map((_, i) => (
            <div key={i} className="card p-4 h-28 animate-pulse bg-gray-100 rounded-xl" />
          ))
        ) : data.length === 0 ? (
          <div className="empty-state py-8">
            <h3 className="text-sm font-semibold text-gray-900">{emptyTitle}</h3>
            <p className="text-xs text-gray-400 mt-1">{emptyDescription}</p>
          </div>
        ) : (
          data.map((row, idx) => (
            renderMobileCard ? (
              <div key={row._id || idx}>{renderMobileCard(row)}</div>
            ) : (
              <MobileDefaultCard
                key={row._id || idx}
                row={row}
                columns={columns}
                rowActions={rowActions}
                onRowClick={onRowClick}
              />
            )
          ))
        )}
      </div>

      {/* Desktop Table View */}
      <div className="table-container hidden md:block">
        <table className="table">
          <thead>
            <tr>
              {selectable && (
                <th className="w-10">
                  <input
                    type="checkbox"
                    checked={selected.length === data.length && data.length > 0}
                    onChange={toggleAll}
                    className="rounded border-gray-300"
                  />
                </th>
              )}
              {columns.map((col) => (
                <th key={col.key} style={{ width: col.width }} className={col.className}>
                  {col.label}
                </th>
              ))}
              {rowActions && <th className="text-right">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array(8).fill(0).map((_, i) => (
                <tr key={i}>
                  {selectable && <td><Skeleton className="h-4 w-4 rounded" /></td>}
                  {columns.map((col) => (
                    <td key={col.key}><Skeleton className="h-4 rounded" style={{ width: col.skeletonWidth || '80%' }} /></td>
                  ))}
                  {rowActions && <td><Skeleton className="h-4 w-16 ml-auto rounded" /></td>}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (selectable ? 1 : 0) + (rowActions ? 1 : 0)}>
                  <div className="empty-state">
                    {emptyIcon || (
                      <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <Search size={24} className="text-gray-400" />
                      </div>
                    )}
                    <h3 className="text-sm font-semibold text-gray-900 mt-3">{emptyTitle}</h3>
                    <p className="text-sm text-gray-400 mt-1 max-w-xs">{emptyDescription}</p>
                    {onAdd && (
                      <button onClick={onAdd} className="btn-primary btn-sm mt-4 gap-1.5">
                        <Plus size={14} />
                        {addLabel}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              data.map((row, rowIdx) => (
                <motion.tr
                  key={row._id || rowIdx}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: rowIdx * 0.02 }}
                  className="group"
                >
                  {selectable && (
                    <td>
                      <input
                        type="checkbox"
                        checked={selected.includes(row._id)}
                        onChange={() => toggleSelect(row._id)}
                        className="rounded border-gray-300"
                      />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td key={col.key} className={col.tdClassName}>
                      {col.render ? col.render(row[col.key], row) : (row[col.key] ?? '—')}
                    </td>
                  ))}
                  {rowActions && (
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {rowActions(row)}
                      </div>
                    </td>
                  )}
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="px-5 py-3.5 border-t border-gray-100 flex items-center justify-between text-sm">
          <span className="text-gray-500 text-xs">
            Showing {((pagination.page - 1) * pagination.limit) + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={!pagination.hasPrev}
              className="btn-ghost btn-icon disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="px-3 py-1 text-xs font-medium text-gray-700">
              {pagination.page} / {pagination.totalPages}
            </span>
            <button
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={!pagination.hasNext}
              className="btn-ghost btn-icon disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

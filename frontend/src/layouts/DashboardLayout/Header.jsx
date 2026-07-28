import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { Search, Bell, Menu, Command } from 'lucide-react';
import { toggleMobileSidebar, setGlobalSearch } from '@store/slices/uiSlice.js';
import api from '@services/axios.js';
import { useQuery } from '@tanstack/react-query';

function GlobalSearchModal({ onClose }) {
  const [q, setQ] = useState('');
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => { inputRef.current?.focus(); }, []);

  const { data, isLoading } = useQuery({
    queryKey: ['search', q],
    queryFn: () => api.get(`/search?q=${q}`),
    enabled: q.trim().length >= 2,
    staleTime: 0,
  });

  const results = data?.data;
  const hasResults = results && (
    results.products?.length || results.customers?.length ||
    results.suppliers?.length || results.sales?.length || results.purchases?.length
  );

  const navigate_ = (url) => { navigate(url); onClose(); };

  return (
    <div className="fixed inset-0 z-100 flex items-start justify-center pt-20 px-4 bg-gray-900/50 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100">
          <Search size={18} className="text-gray-400 flex-shrink-0" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search products, customers, invoices..."
            className="flex-1 text-sm text-gray-900 placeholder:text-gray-400 outline-none bg-transparent"
          />
          <kbd className="px-2 py-1 text-xs text-gray-400 bg-gray-100 rounded-md font-mono">ESC</kbd>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {isLoading && q.length >= 2 && (
            <div className="p-6 text-center text-sm text-gray-400">Searching...</div>
          )}
          {!isLoading && q.length >= 2 && !hasResults && (
            <div className="p-8 text-center text-sm text-gray-400">No results found for "{q}"</div>
          )}
          {hasResults && (
            <div className="py-2">
              {results.products?.length > 0 && (
                <ResultGroup label="Products" items={results.products}
                  onSelect={(p) => navigate_(`/products/${p._id}`)}
                  renderItem={(p) => <><span className="font-medium">{p.name}</span><span className="ml-2 text-xs text-gray-400">{p.sku}</span></>}
                />
              )}
              {results.customers?.length > 0 && (
                <ResultGroup label="Customers" items={results.customers}
                  onSelect={(c) => navigate_(`/customers/${c._id}`)}
                  renderItem={(c) => <><span className="font-medium">{c.name}</span><span className="ml-2 text-xs text-gray-400">{c.phone}</span></>}
                />
              )}
              {results.sales?.length > 0 && (
                <ResultGroup label="Invoices" items={results.sales}
                  onSelect={(s) => navigate_(`/sales/${s._id}`)}
                  renderItem={(s) => <><span className="font-medium">{s.invoiceNumber}</span><span className="ml-2 text-xs text-gray-400">{s.customer?.name}</span></>}
                />
              )}
            </div>
          )}
          {q.length === 0 && (
            <div className="p-6 text-center text-sm text-gray-400">
              Type to search products, customers, invoices...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ResultGroup({ label, items, onSelect, renderItem }) {
  return (
    <div>
      <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</div>
      {items.map((item) => (
        <button key={item._id} onClick={() => onSelect(item)}
          className="w-full flex items-center px-4 py-2.5 text-sm text-left hover:bg-gray-50 transition-colors">
          {renderItem(item)}
        </button>
      ))}
    </div>
  );
}

export default function Header() {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const { unreadCount } = useSelector((s) => s.notifications);
  const { globalSearchOpen } = useSelector((s) => s.ui);
  const navigate = useNavigate();

  useEffect(() => {
    const handleKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        dispatch(setGlobalSearch(true));
      }
      if (e.key === 'Escape') dispatch(setGlobalSearch(false));
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [dispatch]);

  return (
    <>
      <header className="h-[60px] bg-white border-b border-gray-100 flex items-center justify-between px-3 sm:px-6 flex-shrink-0 sticky top-0 z-30">
        <div className="flex items-center gap-2 sm:gap-4">
          <button onClick={() => dispatch(toggleMobileSidebar())} className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-700">
            <Menu size={20} />
          </button>
          {/* Search trigger */}
          <button
            onClick={() => dispatch(setGlobalSearch(true))}
            className="flex items-center gap-2 px-2.5 py-1.5 sm:px-3 sm:py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs sm:text-sm text-gray-400 hover:bg-gray-100 transition-colors w-32 sm:w-64"
          >
            <Search size={15} />
            <span className="flex-1 text-left truncate">Search...</span>
            <kbd className="hidden sm:flex items-center gap-1 text-xs text-gray-300 font-mono">
              <Command size={11} />K
            </kbd>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Notifications */}
          <button
            onClick={() => navigate('/notifications')}
            className="relative btn-icon btn-ghost"
            title="Notifications"
          >
            <Bell size={18} className="text-gray-600" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-danger rounded-full" />
            )}
          </button>

          {/* User avatar */}
          <div className="flex items-center gap-2.5 pl-2 ml-1 border-l border-gray-100">
            <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center cursor-pointer" onClick={() => navigate('/settings')}>
              <span className="text-brand-700 text-xs font-semibold">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </span>
            </div>
            <div className="hidden md:block">
              <div className="text-sm font-medium text-gray-900 leading-none">{user?.firstName}</div>
              <div className="text-xs text-gray-400 mt-0.5">{user?.role?.displayName}</div>
            </div>
          </div>
        </div>
      </header>

      {/* Global Search Modal */}
      {globalSearchOpen && (
        <GlobalSearchModal onClose={() => dispatch(setGlobalSearch(false))} />
      )}
    </>
  );
}

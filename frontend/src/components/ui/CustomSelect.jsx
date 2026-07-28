/**
 * CustomSelect — clean animated dropdown (replaces native <select> and react-select in forms).
 */

import { useState, useRef, useEffect, useMemo, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import CheckIcon from '@mui/icons-material/Check';
import SearchIcon from '@mui/icons-material/Search';

const menuMotion = {
  initial: { opacity: 0, y: 8, filter: 'blur(4px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
  exit: { opacity: 0, y: 6, filter: 'blur(2px)' },
  transition: { type: 'spring', stiffness: 420, damping: 32, mass: 0.85 },
};

const optionMotion = {
  initial: { opacity: 0, x: -6 },
  animate: { opacity: 1, x: 0 },
  transition: { type: 'spring', stiffness: 500, damping: 35 },
};

export default function CustomSelect({
  value,
  onChange,
  options = [],
  placeholder = 'Select...',
  icon: LeftIcon,
  iconColor,
  disabled = false,
  className = '',
  size = 'md',
  searchable = false,
  label,
  error,
  clearable = false,
  menuPortal = false,
  required = false,
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [menuStyle, setMenuStyle] = useState(null);
  const ref = useRef(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const searchRef = useRef(null);

  const selected = options.find((o) => String(o.value) === String(value));

  useEffect(() => {
    const handler = (e) => {
      const inTrigger = ref.current?.contains(e.target);
      const inMenu = menuRef.current?.contains(e.target);
      if (!inTrigger && !inMenu) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (open && searchable) {
      const t = setTimeout(() => searchRef.current?.focus(), 80);
      return () => clearTimeout(t);
    }
  }, [open, searchable]);

  useLayoutEffect(() => {
    if (!open || !menuPortal || !triggerRef.current) return;

    const update = () => {
      const rect = triggerRef.current.getBoundingClientRect();
      setMenuStyle({
        position: 'fixed',
        top: rect.bottom + 6,
        left: rect.left,
        width: rect.width,
        zIndex: 9999,
      });
    };
    update();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [open, menuPortal]);

  const filtered = useMemo(() => {
    if (!search.trim()) return options;
    const q = search.toLowerCase();
    return options.filter(
      (o) =>
        o.label?.toLowerCase().includes(q) ||
        o.sub?.toLowerCase().includes(q) ||
        String(o.value).toLowerCase().includes(q)
    );
  }, [options, search]);

  const sizeClass = {
    sm: 'py-1.5 px-2.5 text-xs min-h-[34px] rounded-lg',
    md: 'py-2 px-3 text-sm min-h-[40px] rounded-xl',
  }[size] || 'py-2 px-3 text-sm min-h-[40px] rounded-xl';

  const showSearch = searchable || options.length > 8;

  const handleSelect = (opt) => {
    onChange(opt.value);
    setOpen(false);
    setSearch('');
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange('');
  };

  const menuContent = (
    <motion.div
      ref={menuRef}
      key="dropdown-menu"
      {...menuMotion}
      className={`
        bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-[0_12px_40px_-12px_rgba(15,23,42,0.18)]
        overflow-hidden
        ${menuPortal ? 'rounded-xl' : 'absolute z-[200] left-0 right-0 mt-1.5 rounded-xl'}
      `}
      style={menuPortal ? menuStyle : { minWidth: '100%' }}
      onClick={(e) => e.stopPropagation()}
    >
      {showSearch && (
        <div className="px-2.5 pt-2.5 pb-2 border-b border-slate-100/80">
          <div className="relative">
            <SearchIcon
              sx={{ fontSize: 15, color: '#94a3b8' }}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
            />
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50/80 border border-transparent rounded-lg outline-none focus:bg-white focus:border-slate-200 transition-colors"
            />
          </div>
        </div>
      )}

      <div className="max-h-52 overflow-y-auto py-1 scrollbar-none">
        {!required && !clearable && placeholder && (
          <button
            type="button"
            onClick={() => handleSelect({ value: '' })}
            className={`w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-400 hover:bg-slate-50/90 transition-colors ${!value ? 'text-slate-600' : ''}`}
          >
            {placeholder}
          </button>
        )}

        {filtered.length === 0 && (
          <div className="px-4 py-5 text-center text-xs text-slate-400">No results</div>
        )}

        {filtered.map((opt, i) => {
          const isSelected = String(opt.value) === String(value);
          return (
            <motion.button
              key={String(opt.value)}
              type="button"
              onClick={() => handleSelect(opt)}
              {...optionMotion}
              transition={{ ...optionMotion.transition, delay: Math.min(i * 0.02, 0.12) }}
              className={`
                relative w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm
                transition-colors duration-150
                ${isSelected ? 'bg-indigo-50/90 text-indigo-800' : 'text-slate-700 hover:bg-slate-50'}
              `}
            >
              <span
                className={`absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full transition-all duration-200
                  ${isSelected ? 'bg-indigo-500 opacity-100' : 'bg-transparent opacity-0'}`}
              />
              {opt.icon && (
                <opt.icon sx={{ fontSize: 16, color: opt.color || (isSelected ? '#4f46e5' : '#64748b'), flexShrink: 0 }} />
              )}
              {opt.emoji && !opt.icon && <span className="text-sm flex-shrink-0">{opt.emoji}</span>}
              <div className="flex-1 min-w-0 pl-0.5">
                <div className={`truncate text-xs sm:text-sm ${isSelected ? 'font-semibold' : 'font-medium'}`}>
                  {opt.label}
                </div>
                {opt.sub && <div className="text-[10px] text-slate-400 truncate mt-0.5">{opt.sub}</div>}
              </div>
              {isSelected && <CheckIcon sx={{ fontSize: 16, color: '#6366f1', flexShrink: 0 }} />}
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );

  return (
    <div ref={ref} className={`relative ${className}`}>
      {label && <label className="block text-xs font-bold text-slate-700 mb-1.5">{label}</label>}

      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((v) => !v)}
        className={`
          w-full flex items-center gap-2 border outline-none transition-[border-color,box-shadow,background] duration-200
          ${sizeClass}
          ${open ? 'border-indigo-400/80 bg-white shadow-[0_0_0_3px_rgba(99,102,241,0.08)]' : 'border-slate-200 bg-white hover:border-slate-300'}
          ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-50' : 'cursor-pointer'}
          ${error ? 'border-rose-400 shadow-[0_0_0_3px_rgba(244,63,94,0.08)]' : ''}
          text-left
        `}
      >
        {LeftIcon && (
          <LeftIcon
            sx={{ fontSize: size === 'sm' ? 14 : 16, color: iconColor || (selected ? '#6366f1' : '#94a3b8'), flexShrink: 0 }}
          />
        )}

        <span className="flex-1 min-w-0 flex items-center gap-2">
          {selected ? (
            <>
              {selected.icon && (
                <selected.icon sx={{ fontSize: 15, color: selected.color || '#6366f1' }} />
              )}
              <span className="font-medium truncate text-slate-800">{selected.label}</span>
              {selected.sub && (
                <span className="text-xs text-slate-400 truncate hidden sm:inline">{selected.sub}</span>
              )}
            </>
          ) : (
            <span className="text-slate-400 font-normal truncate">{placeholder}</span>
          )}
        </span>

        {clearable && selected && (
          <span
            role="button"
            tabIndex={-1}
            onClick={handleClear}
            className="flex-shrink-0 text-slate-300 hover:text-slate-500 transition text-xs px-0.5"
          >
            ×
          </span>
        )}

        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 28 }}
          className="flex-shrink-0 text-slate-400"
        >
          <KeyboardArrowDownIcon sx={{ fontSize: size === 'sm' ? 18 : 20 }} />
        </motion.span>
      </button>

      <AnimatePresence>
        {open && (!menuPortal || menuStyle) && (menuPortal ? createPortal(menuContent, document.body) : menuContent)}
      </AnimatePresence>

      {error && <p className="mt-1 text-xs text-rose-500 font-medium">{error}</p>}
    </div>
  );
}

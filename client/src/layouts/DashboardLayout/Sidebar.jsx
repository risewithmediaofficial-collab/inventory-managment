import { NavLink, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { toggleSidebar } from '@store/slices/uiSlice.js';
import { clsx } from 'clsx';
import {
  LayoutDashboard, Package, Tag, Bookmark, Ruler, Warehouse, Percent,
  Users, Building2, ShoppingCart, Receipt, Layers, ArrowLeftRight,
  CreditCard, BarChart3, Bell, Settings, Shield, ChevronLeft, ChevronRight,
  LogOut, User, Box
} from 'lucide-react';
import { useDispatch as useReduxDispatch } from 'react-redux';
import { logout } from '@store/slices/authSlice.js';
import { useNavigate } from 'react-router-dom';

const navGroups = [
  {
    label: 'Overview',
    items: [
      { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
      { label: 'POS Billing', to: '/pos', icon: Receipt },
      { label: 'Branches', to: '/branches', icon: Building2 },
    ],
  },
  {
    label: 'Products',
    items: [
      { label: 'Products',    to: '/products',    icon: Package },
      { label: 'Categories',  to: '/categories',  icon: Tag },
      { label: 'Brands',      to: '/brands',      icon: Bookmark },
      { label: 'Units',       to: '/units',       icon: Ruler },
      { label: 'Warehouses',  to: '/warehouses',  icon: Warehouse },
      { label: 'Taxes',       to: '/taxes',       icon: Percent },
    ],
  },
  {
    label: 'Parties',
    items: [
      { label: 'Suppliers', to: '/suppliers', icon: Building2 },
      { label: 'Customers', to: '/customers', icon: Users },
    ],
  },
  {
    label: 'Transactions',
    items: [
      { label: 'Purchases', to: '/purchases', icon: ShoppingCart },
      { label: 'Sales',     to: '/sales',     icon: Receipt },
      { label: 'Payments',  to: '/payments',  icon: CreditCard },
      { label: 'Approvals', to: '/approvals', icon: Shield },
    ],
  },
  {
    label: 'Inventory & Godowns',
    items: [
      { label: 'Stock View',          to: '/inventory',          icon: Box },
      { label: 'Stock Movements',     to: '/stock-movements',    icon: ArrowLeftRight },
      { label: 'Godown Transfers',    to: '/warehouse-transfers',icon: Warehouse },
    ],
  },
  {
    label: 'Finance & Ledger',
    items: [
      { label: 'General Ledger & P&L', to: '/finance-ledger', icon: CreditCard },
    ],
  },
  {
    label: 'Insights & BI',
    items: [
      { label: 'Reports', to: '/reports', icon: BarChart3 },
      { label: 'BI Analytics', to: '/intelligent-analytics', icon: BarChart3 },
    ],
  },
  {
    label: 'Admin',
    items: [
      { label: 'Notifications', to: '/notifications', icon: Bell },
      { label: 'Users',         to: '/users',         icon: User },
      { label: 'Settings',      to: '/settings',      icon: Settings },
      { label: 'Audit Logs',    to: '/audit',         icon: Shield },
    ],
  },
];

export default function Sidebar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { sidebarCollapsed, sidebarMobileOpen } = useSelector((s) => s.ui);
  const { user } = useSelector((s) => s.auth);
  const { unreadCount } = useSelector((s) => s.notifications);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <motion.aside
      className={clsx(
        'fixed top-0 left-0 h-screen bg-white border-r border-gray-100 shadow-sm z-50 flex flex-col',
        'transition-all duration-300 ease-in-out',
        sidebarMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}
      style={{ width: sidebarCollapsed ? 72 : 260 }}
    >
      {/* Logo */}
      <div className={clsx('flex items-center gap-3 p-4 border-b border-gray-100 min-h-[60px]', sidebarCollapsed && 'justify-center')}>
        <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <Layers size={16} className="text-white" />
        </div>
        {!sidebarCollapsed && (
          <div className="overflow-hidden">
            <div className="font-bold text-gray-900 text-sm truncate">StockFlow ERP</div>
            <div className="text-xs text-gray-400">Enterprise Edition</div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto scrollbar-none py-3 px-2">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-4">
            {!sidebarCollapsed && (
              <div className="px-3 mb-1 text-2xs font-semibold text-gray-400 uppercase tracking-widest">
                {group.label}
              </div>
            )}
            {group.items.map((item) => (
              <SidebarItem
                key={item.to}
                item={item}
                collapsed={sidebarCollapsed}
                badge={item.to === '/notifications' ? unreadCount : 0}
              />
            ))}
          </div>
        ))}
      </nav>

      {/* User info + collapse toggle */}
      <div className="border-t border-gray-100 p-2">
        {!sidebarCollapsed && (
          <div className="flex items-center gap-3 px-3 py-2.5 mb-1 rounded-lg hover:bg-gray-50 cursor-pointer">
            <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
              <span className="text-brand-700 text-xs font-semibold">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 truncate">{user?.fullName || user?.firstName}</div>
              <div className="text-xs text-gray-400 truncate">{user?.role?.displayName}</div>
            </div>
            <button onClick={handleLogout} className="p-1 text-gray-400 hover:text-danger rounded" title="Logout">
              <LogOut size={15} />
            </button>
          </div>
        )}
        <button
          onClick={() => dispatch(toggleSidebar())}
          className="w-full flex items-center justify-center p-2.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>
    </motion.aside>
  );
}

function SidebarItem({ item, collapsed, badge }) {
  return (
    <NavLink
      to={item.to}
      title={collapsed ? item.label : undefined}
      className={({ isActive }) =>
        clsx(
          'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 relative',
          collapsed && 'justify-center',
          isActive
            ? 'bg-brand-50 text-brand-700'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <motion.div
              layoutId="activeIndicator"
              className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-brand-600 rounded-r-full"
            />
          )}
          <item.icon size={17} className={isActive ? 'text-brand-600' : 'text-current'} />
          {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
          {!collapsed && badge > 0 && (
            <span className="badge-danger text-xs px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
              {badge > 99 ? '99+' : badge}
            </span>
          )}
          {collapsed && badge > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-danger rounded-full" />
          )}
        </>
      )}
    </NavLink>
  );
}

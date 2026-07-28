import { NavLink, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { toggleSidebar, setMobileSidebar } from '@store/slices/uiSlice.js';
import { logout } from '@store/slices/authSlice.js';
import { useNavigate } from 'react-router-dom';

// MUI Icons
import DashboardIcon from '@mui/icons-material/Dashboard';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import InventoryIcon from '@mui/icons-material/Inventory';
import CategoryIcon from '@mui/icons-material/Category';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import StraightenIcon from '@mui/icons-material/Straighten';
import WarehouseIcon from '@mui/icons-material/Warehouse';
import PercentIcon from '@mui/icons-material/Percent';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import ReceiptIcon from '@mui/icons-material/Receipt';
import PaymentIcon from '@mui/icons-material/Payment';
import GradingIcon from '@mui/icons-material/Grading';
import StorageIcon from '@mui/icons-material/Storage';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import MoneyOffIcon from '@mui/icons-material/MoneyOff';
import BarChartIcon from '@mui/icons-material/BarChart';
import InsightsIcon from '@mui/icons-material/Insights';
import NotificationsIcon from '@mui/icons-material/Notifications';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import SettingsIcon from '@mui/icons-material/Settings';
import SecurityIcon from '@mui/icons-material/Security';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import LogoutIcon from '@mui/icons-material/Logout';
import StoreIcon from '@mui/icons-material/Store';
import CloseIcon from '@mui/icons-material/Close';

const navGroups = [
  {
    label: 'Home',
    color: 'indigo',
    items: [
      { label: 'Dashboard',   to: '/dashboard',  icon: DashboardIcon,   bg: '#4f46e5' },
      { label: 'POS Billing', to: '/pos',         icon: PointOfSaleIcon, bg: '#7c3aed' },
    ],
  },
  {
    label: 'Inventory',
    color: 'emerald',
    items: [
      { label: 'Products',    to: '/products',    icon: InventoryIcon,   bg: '#059669' },
      { label: 'Categories',  to: '/categories',  icon: CategoryIcon,    bg: '#0d9488' },
      { label: 'Brands',      to: '/brands',      icon: LocalOfferIcon,  bg: '#0891b2' },
      { label: 'Units',       to: '/units',       icon: StraightenIcon,  bg: '#0284c7' },
      { label: 'Godowns',     to: '/warehouses',  icon: WarehouseIcon,   bg: '#2563eb' },
      { label: 'Taxes & GST', to: '/taxes',       icon: PercentIcon,     bg: '#7c3aed' },
    ],
  },
  {
    label: 'Parties',
    color: 'orange',
    items: [
      { label: 'Customers',   to: '/customers',   icon: PeopleAltIcon,   bg: '#ea580c' },
      { label: 'Suppliers',   to: '/suppliers',   icon: LocalShippingIcon, bg: '#d97706' },
    ],
  },
  {
    label: 'Transactions',
    color: 'purple',
    items: [
      { label: 'Purchases',   to: '/purchases',   icon: ShoppingCartIcon, bg: '#9333ea' },
      { label: 'Sales',       to: '/sales',        icon: ReceiptIcon,     bg: '#db2777' },
      { label: 'Payments',    to: '/payments',     icon: PaymentIcon,     bg: '#e11d48' },
      { label: 'Approvals',   to: '/approvals',    icon: GradingIcon,     bg: '#b45309' },
    ],
  },
  {
    label: 'Godown & Stock',
    color: 'teal',
    items: [
      { label: 'Stock View',      to: '/inventory',           icon: StorageIcon,      bg: '#0f766e' },
      { label: 'Stock Movements', to: '/stock-movements',     icon: SwapHorizIcon,    bg: '#0284c7' },
      { label: 'Transfers',       to: '/warehouse-transfers', icon: CompareArrowsIcon,bg: '#0369a1' },
    ],
  },
  {
    label: 'Finance',
    color: 'rose',
    items: [
      { label: 'Ledger & P&L',  to: '/finance-ledger',       icon: AccountBalanceIcon, bg: '#be185d' },
      { label: 'Branches',      to: '/branches',              icon: AccountTreeIcon,    bg: '#9f1239' },
    ],
  },
  {
    label: 'Reports & BI',
    color: 'amber',
    items: [
      { label: 'Reports',     to: '/reports',                 icon: BarChartIcon,   bg: '#b45309' },
      { label: 'BI Analytics',to: '/intelligent-analytics',  icon: InsightsIcon,   bg: '#92400e' },
    ],
  },
  {
    label: 'Admin',
    color: 'slate',
    items: [
      { label: 'Notifications', to: '/notifications', icon: NotificationsIcon,  bg: '#475569' },
      { label: 'Users',          to: '/users',          icon: ManageAccountsIcon, bg: '#334155' },
      { label: 'Settings',       to: '/settings',       icon: SettingsIcon,       bg: '#1e293b' },
      { label: 'Audit Logs',     to: '/audit',           icon: SecurityIcon,       bg: '#0f172a' },
    ],
  },
];

// Colored icon bubble
function NavIcon({ Icon, bg, size = 20, collapsed = false }) {
  return (
    <span
      className="flex items-center justify-center rounded-lg flex-shrink-0"
      style={{
        background: bg,
        width: collapsed ? 34 : 30,
        height: collapsed ? 34 : 30,
        minWidth: collapsed ? 34 : 30,
      }}
    >
      <Icon sx={{ fontSize: size, color: '#fff' }} />
    </span>
  );
}

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

  const sidebarW = sidebarCollapsed ? 72 : 240;

  return (
    <>
      {/* Mobile backdrop */}
      <AnimatePresence>
        {sidebarMobileOpen && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => dispatch(setMobileSidebar(false))}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        animate={{ width: sidebarW }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
        className={`fixed top-0 left-0 h-screen z-50 flex flex-col overflow-hidden transition-transform duration-300 ${
          sidebarMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
        style={{
          width: sidebarW,
          background: 'linear-gradient(180deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
          borderRight: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-3 py-4 border-b border-white/10">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg">
            <StoreIcon sx={{ fontSize: 20, color: '#fff' }} />
          </div>
          <AnimatePresence>
            {!sidebarCollapsed && (
              <motion.div
                key="logo-text"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <p className="font-extrabold text-white text-sm leading-tight">Inventory Management</p>
                <p className="text-indigo-300 text-2xs font-medium">ERP Management</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Mobile close button */}
          <button
            onClick={() => dispatch(setMobileSidebar(false))}
            className="ml-auto p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition lg:hidden flex items-center justify-center"
            title="Close menu"
          >
            <CloseIcon sx={{ fontSize: 20 }} />
          </button>

          {/* Desktop collapse toggle */}
          <button
            onClick={() => dispatch(toggleSidebar())}
            className="ml-auto p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition hidden lg:flex"
          >
            <motion.div animate={{ rotate: sidebarCollapsed ? 180 : 0 }} transition={{ duration: 0.25 }}>
              <ChevronLeftIcon sx={{ fontSize: 18 }} />
            </motion.div>
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto py-2 scrollbar-none">
          {navGroups.map((group) => (
            <div key={group.label} className="mb-1">
              {/* Group label */}
              {!sidebarCollapsed && (
                <p className="px-4 pt-3 pb-1 text-2xs font-extrabold uppercase tracking-widest text-white/30">
                  {group.label}
                </p>
              )}
              {sidebarCollapsed && <div className="mx-3 my-2 border-t border-white/10" />}

              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  title={item.label}
                  onClick={() => dispatch(setMobileSidebar(false))}
                >
                  {({ isActive }) => (
                    <motion.div
                      whileHover={{ x: 2 }}
                      className={`
                        flex items-center gap-2.5 mx-2 my-0.5 rounded-xl transition-all cursor-pointer
                        ${sidebarCollapsed ? 'px-1.5 py-1.5 justify-center' : 'px-2.5 py-2'}
                        ${isActive
                          ? 'bg-white/15 shadow-sm ring-1 ring-white/20'
                          : 'hover:bg-white/8'
                        }
                      `}
                    >
                      <NavIcon Icon={item.icon} bg={item.bg} collapsed={sidebarCollapsed} />

                      {!sidebarCollapsed && (
                        <span className={`text-xs font-semibold truncate ${isActive ? 'text-white' : 'text-white/70'}`}>
                          {item.label}
                        </span>
                      )}

                      {/* Notification badge for notifications */}
                      {!sidebarCollapsed && item.to === '/notifications' && unreadCount > 0 && (
                        <span className="ml-auto bg-rose-500 text-white text-2xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </motion.div>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* User profile + logout */}
        <div className="border-t border-white/10 p-3">
          {!sidebarCollapsed ? (
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center flex-shrink-0">
                <span className="text-white font-extrabold text-xs">
                  {user?.firstName?.charAt(0) || user?.name?.charAt(0) || 'A'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white truncate">{user?.firstName || user?.name || 'Admin'}</p>
                <p className="text-2xs text-white/40 truncate">{user?.role?.displayName || 'Administrator'}</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-1.5 rounded-lg hover:bg-rose-500/20 text-white/40 hover:text-rose-400 transition"
                title="Logout"
              >
                <LogoutIcon sx={{ fontSize: 16 }} />
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center p-2 rounded-xl hover:bg-rose-500/20 text-white/40 hover:text-rose-400 transition"
              title="Logout"
            >
              <LogoutIcon sx={{ fontSize: 18 }} />
            </button>
          )}
        </div>
      </motion.aside>
    </>
  );
}

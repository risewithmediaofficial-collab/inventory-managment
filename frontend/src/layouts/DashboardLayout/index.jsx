import { Outlet, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useEffect, useState, Suspense } from 'react';
import Sidebar from './Sidebar.jsx';
import Header from './Header.jsx';
import ContentLoader from '@components/ui/ContentLoader.jsx';
import { setMobileSidebar } from '@store/slices/uiSlice.js';
import { initSocket, disconnectSocket, subscribeToEvent } from '@services/socket.js';
import { addNotification } from '@store/slices/notificationSlice.js';
import { queryClient } from '@services/queryClient.js';
import toast from 'react-hot-toast';

export default function DashboardLayout() {
  const dispatch = useDispatch();
  const location = useLocation();
  const { sidebarCollapsed, sidebarMobileOpen } = useSelector((s) => s.ui);
  const { accessToken } = useSelector((s) => s.auth);
  const [isDesktop, setIsDesktop] = useState(typeof window !== 'undefined' ? window.innerWidth >= 1024 : true);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto close mobile sidebar & scroll to top on route change
  useEffect(() => {
    dispatch(setMobileSidebar(false));
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [location.pathname, dispatch]);

  // Body scroll lock on mobile when sidebar is open
  useEffect(() => {
    if (!isDesktop && sidebarMobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarMobileOpen, isDesktop]);

  // Initialize socket
  useEffect(() => {
    if (accessToken) {
      const socket = initSocket();
      if (!socket) return;

      // Real-time dashboard updates
      const unsubs = [
        subscribeToEvent('sale:created', ({ sale }) => {
          queryClient.invalidateQueries({ queryKey: ['dashboard'] });
          queryClient.invalidateQueries({ queryKey: ['sales'] });
          dispatch(addNotification({ title: 'New Sale', message: `Invoice ${sale.invoiceNumber} created`, type: 'new_sale' }));
          toast.success(`New sale: ${sale.invoiceNumber}`);
        }),
        subscribeToEvent('purchase:created', () => {
          queryClient.invalidateQueries({ queryKey: ['dashboard'] });
          queryClient.invalidateQueries({ queryKey: ['purchases'] });
        }),
        subscribeToEvent('product:created', () => {
          queryClient.invalidateQueries({ queryKey: ['products'] });
        }),
        subscribeToEvent('product:updated', () => {
          queryClient.invalidateQueries({ queryKey: ['products'] });
        }),
      ];

      return () => {
        unsubs.forEach((unsub) => unsub());
        disconnectSocket();
      };
    }
  }, [accessToken, dispatch]);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar handles its own mobile backdrop & drawer */}
      <Sidebar />

      {/* Main content */}
      <div
        className="flex-1 flex flex-col min-w-0 overflow-hidden transition-all duration-300"
        style={{ marginLeft: isDesktop ? (sidebarCollapsed ? 72 : 240) : 0 }}
      >
        <Header />
        <main className="flex-1 overflow-y-auto p-3 sm:p-6">
          <div className="max-w-screen-2xl mx-auto">
            <Suspense fallback={<ContentLoader />}>
              <Outlet />
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
}


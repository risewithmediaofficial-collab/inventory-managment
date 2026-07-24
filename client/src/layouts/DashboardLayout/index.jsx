import { Outlet } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useEffect } from 'react';
import Sidebar from './Sidebar.jsx';
import Header from './Header.jsx';
import { setMobileSidebar } from '@store/slices/uiSlice.js';
import { initSocket, disconnectSocket, subscribeToEvent } from '@services/socket.js';
import { addNotification } from '@store/slices/notificationSlice.js';
import { queryClient } from '@services/queryClient.js';
import toast from 'react-hot-toast';

export default function DashboardLayout() {
  const dispatch = useDispatch();
  const { sidebarCollapsed, sidebarMobileOpen } = useSelector((s) => s.ui);
  const { accessToken } = useSelector((s) => s.auth);

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
      {/* Mobile overlay */}
      {sidebarMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-900/50 lg:hidden"
          onClick={() => dispatch(setMobileSidebar(false))}
        />
      )}

      {/* Sidebar */}
      <Sidebar />

      {/* Main content */}
      <div
        className="flex-1 flex flex-col min-w-0 overflow-hidden transition-all duration-300"
        style={{ marginLeft: sidebarCollapsed ? 72 : 260 }}
      >
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-screen-2xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

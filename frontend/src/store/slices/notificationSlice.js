import { createSlice } from '@reduxjs/toolkit';

const notificationSlice = createSlice({
  name: 'notifications',
  initialState: {
    unreadCount: 0,
    notifications: [],
  },
  reducers: {
    setUnreadCount: (state, action) => { state.unreadCount = action.payload; },
    addNotification: (state, action) => {
      state.notifications.unshift(action.payload);
      state.unreadCount += 1;
    },
    markRead: (state, action) => {
      const notif = state.notifications.find((n) => n._id === action.payload);
      if (notif && !notif.isRead) {
        notif.isRead = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    markAllRead: (state) => {
      state.notifications.forEach((n) => { n.isRead = true; });
      state.unreadCount = 0;
    },
  },
});

export const { setUnreadCount, addNotification, markRead, markAllRead } = notificationSlice.actions;
export default notificationSlice.reducer;

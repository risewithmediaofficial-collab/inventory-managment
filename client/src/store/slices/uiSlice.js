import { createSlice } from '@reduxjs/toolkit';

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    sidebarCollapsed: false,
    sidebarMobileOpen: false,
    theme: 'light',
    pageTitle: 'Dashboard',
    breadcrumbs: [],
    globalSearchOpen: false,
  },
  reducers: {
    toggleSidebar: (state) => { state.sidebarCollapsed = !state.sidebarCollapsed; },
    setSidebarCollapsed: (state, action) => { state.sidebarCollapsed = action.payload; },
    toggleMobileSidebar: (state) => { state.sidebarMobileOpen = !state.sidebarMobileOpen; },
    setMobileSidebar: (state, action) => { state.sidebarMobileOpen = action.payload; },
    setTheme: (state, action) => { state.theme = action.payload; },
    setPageTitle: (state, action) => { state.pageTitle = action.payload; },
    setBreadcrumbs: (state, action) => { state.breadcrumbs = action.payload; },
    setGlobalSearch: (state, action) => { state.globalSearchOpen = action.payload; },
  },
});

export const { toggleSidebar, setSidebarCollapsed, toggleMobileSidebar, setMobileSidebar, setTheme, setPageTitle, setBreadcrumbs, setGlobalSearch } = uiSlice.actions;
export default uiSlice.reducer;

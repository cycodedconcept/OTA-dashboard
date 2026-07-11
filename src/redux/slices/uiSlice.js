import { createSlice } from '@reduxjs/toolkit';
import { getPageFromLocation } from '../../utils/appRoutes';

const initialState = {
  activePage: getPageFromLocation(),
  isSidebarOpen: false,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    closeSidebar: (state) => {
      state.isSidebarOpen = false;
    },
    openSidebar: (state) => {
      state.isSidebarOpen = true;
    },
    setActivePage: (state, action) => {
      state.activePage = action.payload;
    },
    toggleSidebar: (state) => {
      state.isSidebarOpen = !state.isSidebarOpen;
    },
  },
});

export const { closeSidebar, openSidebar, setActivePage, toggleSidebar } =
  uiSlice.actions;

export default uiSlice.reducer;

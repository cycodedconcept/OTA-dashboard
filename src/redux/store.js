import { configureStore } from '@reduxjs/toolkit';
import adminReducer from './slices/adminSlice';
import devicesReducer from './slices/devicesSlice';
import projectsReducer from './slices/projectsSlice';
import releasesReducer from './slices/releasesSlice';
import uiReducer from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    admin: adminReducer,
    devices: devicesReducer,
    projects: projectsReducer,
    releases: releasesReducer,
    ui: uiReducer,
  },
});

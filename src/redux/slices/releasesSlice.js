import { createSlice } from '@reduxjs/toolkit';
import { mockReleases } from '../../data/mockReleases';

const initialState = {
  items: mockReleases,
  searchTerm: '',
  selectedRelease: null,
  uploading: false,
  error: null,
};

const releasesSlice = createSlice({
  name: 'releases',
  initialState,
  reducers: {
    setSearchTerm: (state, action) => {
      state.searchTerm = action.payload;
    },
    addRelease: (state, action) => {
      state.items.unshift(action.payload);
    },
    selectRelease: (state, action) => {
      state.selectedRelease = action.payload;
    },
    clearSelectedRelease: (state) => {
      state.selectedRelease = null;
    },
    updateReleaseChannel: (state, action) => {
      const { channel, id } = action.payload;
      const release = state.items.find((item) => item.id === id);

      if (release) {
        release.channel = channel;
      }
    },
  },
});

export const {
  addRelease,
  clearSelectedRelease,
  selectRelease,
  setSearchTerm,
  updateReleaseChannel,
} = releasesSlice.actions;

export default releasesSlice.reducer;

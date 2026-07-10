import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import {
  getAllDevicesApi,
  registerDeviceApi,
  updateDeviceApi,
} from '../../api/deviceApi';
import { extractCollection } from '../../utils/apiData';
import { getApiSuccessMessage, toSerializableApiError } from '../../utils/apiErrors';

const initialState = {
  items: [],
  searchTerm: '',
  selectedDevice: null,
  getDevicesLoading: false,
  registerDeviceLoading: false,
  updateDeviceLoading: false,
  getDevicesError: null,
  registerDeviceError: null,
  updateDeviceError: null,
  registerDeviceSuccessMessage: null,
  updateDeviceSuccessMessage: null,
};

export const getAllDevices = createAsyncThunk(
  'devices/getAllDevices',
  async (_, { rejectWithValue }) => {
    try {
      return await getAllDevicesApi();
    } catch (error) {
      return rejectWithValue(
        toSerializableApiError(error, 'Unable to retrieve devices.')
      );
    }
  }
);

export const registerDevice = createAsyncThunk(
  'devices/registerDevice',
  async (payload, { rejectWithValue }) => {
    try {
      return await registerDeviceApi(payload);
    } catch (error) {
      return rejectWithValue(
        toSerializableApiError(error, 'Unable to register device.')
      );
    }
  }
);

export const updateDevice = createAsyncThunk(
  'devices/updateDevice',
  async (payload, { rejectWithValue }) => {
    try {
      return await updateDeviceApi(payload);
    } catch (error) {
      return rejectWithValue(
        toSerializableApiError(error, 'Unable to update device.')
      );
    }
  }
);

const devicesSlice = createSlice({
  name: 'devices',
  initialState,
  reducers: {
    clearRegisterDeviceState: (state) => {
      state.registerDeviceError = null;
      state.registerDeviceLoading = false;
      state.registerDeviceSuccessMessage = null;
    },
    clearUpdateDeviceState: (state) => {
      state.updateDeviceError = null;
      state.updateDeviceLoading = false;
      state.updateDeviceSuccessMessage = null;
    },
    setDevicesSearchTerm: (state, action) => {
      state.searchTerm = action.payload;
    },
    setSelectedDevice: (state, action) => {
      state.selectedDevice = action.payload;
    },
    clearSelectedDevice: (state) => {
      state.selectedDevice = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getAllDevices.pending, (state) => {
        state.getDevicesError = null;
        state.getDevicesLoading = true;
      })
      .addCase(getAllDevices.fulfilled, (state, action) => {
        state.items = extractCollection(action.payload, [
          'devices',
          'device',
          'data',
        ]);
        state.getDevicesLoading = false;
      })
      .addCase(getAllDevices.rejected, (state, action) => {
        state.getDevicesError = action.payload ?? {
          message: 'Unable to retrieve devices.',
        };
        state.getDevicesLoading = false;
      })
      .addCase(registerDevice.pending, (state) => {
        state.registerDeviceError = null;
        state.registerDeviceLoading = true;
        state.registerDeviceSuccessMessage = null;
      })
      .addCase(registerDevice.fulfilled, (state, action) => {
        state.registerDeviceLoading = false;
        state.registerDeviceSuccessMessage = getApiSuccessMessage(
          action.payload,
          'Device registered successfully.'
        );
      })
      .addCase(registerDevice.rejected, (state, action) => {
        state.registerDeviceError = action.payload ?? {
          message: 'Unable to register device.',
        };
        state.registerDeviceLoading = false;
      })
      .addCase(updateDevice.pending, (state) => {
        state.updateDeviceError = null;
        state.updateDeviceLoading = true;
        state.updateDeviceSuccessMessage = null;
      })
      .addCase(updateDevice.fulfilled, (state, action) => {
        state.updateDeviceLoading = false;
        state.updateDeviceSuccessMessage = getApiSuccessMessage(
          action.payload,
          'Device updated successfully.'
        );
      })
      .addCase(updateDevice.rejected, (state, action) => {
        state.updateDeviceError = action.payload ?? {
          message: 'Unable to update device.',
        };
        state.updateDeviceLoading = false;
      });
  },
});

export const {
  clearRegisterDeviceState,
  clearSelectedDevice,
  clearUpdateDeviceState,
  setDevicesSearchTerm,
  setSelectedDevice,
} = devicesSlice.actions;

export default devicesSlice.reducer;

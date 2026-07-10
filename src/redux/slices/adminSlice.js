import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import {
  assignAdminPrivilegesApi,
  loginAdminApi,
  registerAdminApi,
  updateAdminPasswordApi,
} from '../../api/adminApi';
import { getApiSuccessMessage, toSerializableApiError } from '../../utils/apiErrors';
import {
  clearAdminSession,
  extractAdminSession,
  persistAdminSession,
  readStoredAdmin,
  readStoredAdminToken,
} from '../../utils/adminSession';

const initialState = {
  admin: readStoredAdmin(),
  token: readStoredAdminToken(),
  registerError: null,
  registerLoading: false,
  registerStatus: 'idle',
  registerSuccessMessage: null,
  loginError: null,
  loginLoading: false,
  loginStatus: 'idle',
  loginSuccessMessage: null,
  updatePasswordError: null,
  updatePasswordLoading: false,
  updatePasswordStatus: 'idle',
  updatePasswordSuccessMessage: null,
  assignPrivilegesError: null,
  assignPrivilegesLoading: false,
  assignPrivilegesStatus: 'idle',
  assignPrivilegesSuccessMessage: null,
};

export const registerAdmin = createAsyncThunk(
  'admin/registerAdmin',
  async (payload, { rejectWithValue }) => {
    try {
      return await registerAdminApi(payload);
    } catch (error) {
      return rejectWithValue(
        toSerializableApiError(error, 'Unable to register admin.')
      );
    }
  }
);

export const loginAdmin = createAsyncThunk(
  'admin/loginAdmin',
  async (payload, { rejectWithValue }) => {
    try {
      const responseData = await loginAdminApi(payload);
      const session = extractAdminSession(responseData);

      persistAdminSession(session);

      return {
        responseData,
        session,
      };
    } catch (error) {
      return rejectWithValue(toSerializableApiError(error, 'Unable to log in.'));
    }
  }
);

export const updateAdminPassword = createAsyncThunk(
  'admin/updateAdminPassword',
  async (payload, { rejectWithValue }) => {
    try {
      return await updateAdminPasswordApi(payload);
    } catch (error) {
      return rejectWithValue(
        toSerializableApiError(error, 'Unable to update password.')
      );
    }
  }
);

export const assignAdminPrivileges = createAsyncThunk(
  'admin/assignAdminPrivileges',
  async (payload, { rejectWithValue }) => {
    try {
      return await assignAdminPrivilegesApi(payload);
    } catch (error) {
      return rejectWithValue(
        toSerializableApiError(error, 'Unable to assign privileges.')
      );
    }
  }
);

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    clearRegisterState: (state) => {
      state.registerError = null;
      state.registerLoading = false;
      state.registerStatus = 'idle';
      state.registerSuccessMessage = null;
    },
    clearLoginState: (state) => {
      state.loginError = null;
      state.loginLoading = false;
      state.loginStatus = 'idle';
      state.loginSuccessMessage = null;
    },
    clearUpdatePasswordState: (state) => {
      state.updatePasswordError = null;
      state.updatePasswordLoading = false;
      state.updatePasswordStatus = 'idle';
      state.updatePasswordSuccessMessage = null;
    },
    clearAssignPrivilegesState: (state) => {
      state.assignPrivilegesError = null;
      state.assignPrivilegesLoading = false;
      state.assignPrivilegesStatus = 'idle';
      state.assignPrivilegesSuccessMessage = null;
    },
    logoutAdminState: (state) => {
      state.admin = null;
      state.token = null;
      state.loginError = null;
      state.loginLoading = false;
      state.loginStatus = 'idle';
      state.loginSuccessMessage = null;
      state.updatePasswordError = null;
      state.updatePasswordLoading = false;
      state.updatePasswordStatus = 'idle';
      state.updatePasswordSuccessMessage = null;
      state.assignPrivilegesError = null;
      state.assignPrivilegesLoading = false;
      state.assignPrivilegesStatus = 'idle';
      state.assignPrivilegesSuccessMessage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(registerAdmin.pending, (state) => {
        state.registerError = null;
        state.registerLoading = true;
        state.registerStatus = 'loading';
        state.registerSuccessMessage = null;
      })
      .addCase(registerAdmin.fulfilled, (state, action) => {
        state.registerLoading = false;
        state.registerStatus = 'success';
        state.registerSuccessMessage = getApiSuccessMessage(
          action.payload,
          'Admin registration completed successfully.'
        );
      })
      .addCase(registerAdmin.rejected, (state, action) => {
        state.registerError = action.payload ?? {
          message: 'Unable to register admin.',
        };
        state.registerLoading = false;
        state.registerStatus = 'error';
      })
      .addCase(loginAdmin.pending, (state) => {
        state.loginError = null;
        state.loginLoading = true;
        state.loginStatus = 'loading';
        state.loginSuccessMessage = null;
      })
      .addCase(loginAdmin.fulfilled, (state, action) => {
        const { responseData, session } = action.payload;

        state.admin = session.admin ?? state.admin;
        state.token = session.token ?? state.token;
        state.loginLoading = false;
        state.loginStatus = 'success';
        state.loginSuccessMessage = getApiSuccessMessage(
          responseData,
          'Signed in successfully.'
        );
      })
      .addCase(loginAdmin.rejected, (state, action) => {
        state.loginError = action.payload ?? {
          message: 'Unable to log in.',
        };
        state.loginLoading = false;
        state.loginStatus = 'error';
      })
      .addCase(updateAdminPassword.pending, (state) => {
        state.updatePasswordError = null;
        state.updatePasswordLoading = true;
        state.updatePasswordStatus = 'loading';
        state.updatePasswordSuccessMessage = null;
      })
      .addCase(updateAdminPassword.fulfilled, (state, action) => {
        state.updatePasswordLoading = false;
        state.updatePasswordStatus = 'success';
        state.updatePasswordSuccessMessage = getApiSuccessMessage(
          action.payload,
          'Password updated successfully.'
        );
      })
      .addCase(updateAdminPassword.rejected, (state, action) => {
        state.updatePasswordError = action.payload ?? {
          message: 'Unable to update password.',
        };
        state.updatePasswordLoading = false;
        state.updatePasswordStatus = 'error';
      })
      .addCase(assignAdminPrivileges.pending, (state) => {
        state.assignPrivilegesError = null;
        state.assignPrivilegesLoading = true;
        state.assignPrivilegesStatus = 'loading';
        state.assignPrivilegesSuccessMessage = null;
      })
      .addCase(assignAdminPrivileges.fulfilled, (state, action) => {
        state.assignPrivilegesLoading = false;
        state.assignPrivilegesStatus = 'success';
        state.assignPrivilegesSuccessMessage = getApiSuccessMessage(
          action.payload,
          'Admin privileges assigned successfully.'
        );
      })
      .addCase(assignAdminPrivileges.rejected, (state, action) => {
        state.assignPrivilegesError = action.payload ?? {
          message: 'Unable to assign privileges.',
        };
        state.assignPrivilegesLoading = false;
        state.assignPrivilegesStatus = 'error';
      });
  },
});

export const logoutAdmin = () => (dispatch) => {
  clearAdminSession();
  dispatch(logoutAdminState());
};

export const {
  clearAssignPrivilegesState,
  clearLoginState,
  clearRegisterState,
  clearUpdatePasswordState,
  logoutAdminState,
} = adminSlice.actions;

export default adminSlice.reducer;

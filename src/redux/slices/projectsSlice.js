import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import {
  createProjectApi,
  getProjectsApi,
  updateProjectApi,
} from '../../api/projectApi';
import { extractCollection } from '../../utils/apiData';
import { getApiSuccessMessage, toSerializableApiError } from '../../utils/apiErrors';

const initialState = {
  items: [],
  searchTerm: '',
  selectedProject: null,
  getProjectsLoading: false,
  createProjectLoading: false,
  updateProjectLoading: false,
  getProjectsError: null,
  createProjectError: null,
  updateProjectError: null,
  createProjectSuccessMessage: null,
  updateProjectSuccessMessage: null,
};

export const getProjects = createAsyncThunk(
  'projects/getProjects',
  async (_, { rejectWithValue }) => {
    try {
      return await getProjectsApi();
    } catch (error) {
      return rejectWithValue(
        toSerializableApiError(error, 'Unable to retrieve projects.')
      );
    }
  }
);

export const createProject = createAsyncThunk(
  'projects/createProject',
  async (payload, { rejectWithValue }) => {
    try {
      return await createProjectApi(payload);
    } catch (error) {
      return rejectWithValue(
        toSerializableApiError(error, 'Unable to create project.')
      );
    }
  }
);

export const updateProject = createAsyncThunk(
  'projects/updateProject',
  async (payload, { rejectWithValue }) => {
    try {
      return await updateProjectApi(payload);
    } catch (error) {
      return rejectWithValue(
        toSerializableApiError(error, 'Unable to update project.')
      );
    }
  }
);

const projectsSlice = createSlice({
  name: 'projects',
  initialState,
  reducers: {
    clearCreateProjectState: (state) => {
      state.createProjectError = null;
      state.createProjectLoading = false;
      state.createProjectSuccessMessage = null;
    },
    clearUpdateProjectState: (state) => {
      state.updateProjectError = null;
      state.updateProjectLoading = false;
      state.updateProjectSuccessMessage = null;
    },
    setProjectsSearchTerm: (state, action) => {
      state.searchTerm = action.payload;
    },
    setSelectedProject: (state, action) => {
      state.selectedProject = action.payload;
    },
    clearSelectedProject: (state) => {
      state.selectedProject = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getProjects.pending, (state) => {
        state.getProjectsError = null;
        state.getProjectsLoading = true;
      })
      .addCase(getProjects.fulfilled, (state, action) => {
        state.items = extractCollection(action.payload, [
          'projects',
          'project',
          'data',
        ]);
        state.getProjectsLoading = false;
      })
      .addCase(getProjects.rejected, (state, action) => {
        state.getProjectsError = action.payload ?? {
          message: 'Unable to retrieve projects.',
        };
        state.getProjectsLoading = false;
      })
      .addCase(createProject.pending, (state) => {
        state.createProjectError = null;
        state.createProjectLoading = true;
        state.createProjectSuccessMessage = null;
      })
      .addCase(createProject.fulfilled, (state, action) => {
        state.createProjectLoading = false;
        state.createProjectSuccessMessage = getApiSuccessMessage(
          action.payload,
          'Project created successfully.'
        );
      })
      .addCase(createProject.rejected, (state, action) => {
        state.createProjectError = action.payload ?? {
          message: 'Unable to create project.',
        };
        state.createProjectLoading = false;
      })
      .addCase(updateProject.pending, (state) => {
        state.updateProjectError = null;
        state.updateProjectLoading = true;
        state.updateProjectSuccessMessage = null;
      })
      .addCase(updateProject.fulfilled, (state, action) => {
        state.updateProjectLoading = false;
        state.updateProjectSuccessMessage = getApiSuccessMessage(
          action.payload,
          'Project updated successfully.'
        );
      })
      .addCase(updateProject.rejected, (state, action) => {
        state.updateProjectError = action.payload ?? {
          message: 'Unable to update project.',
        };
        state.updateProjectLoading = false;
      });
  },
});

export const {
  clearCreateProjectState,
  clearSelectedProject,
  clearUpdateProjectState,
  setProjectsSearchTerm,
  setSelectedProject,
} = projectsSlice.actions;

export default projectsSlice.reducer;

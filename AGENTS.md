# Devices and Projects API Integration Instructions

## Objective

Extend the existing application to integrate the Devices and Projects modules with the OTA Server API.

The implementation must cover:

### Devices

1. Register a device
2. Update a device
3. Get all devices

### Projects

1. Add Projects to the application menu
2. Create a project
3. Get projects
4. Update a project

Redux is already configured in the application. Reuse the existing Redux store, slices, API client, authentication state, async-request pattern, routing structure, UI components, and naming conventions.

Do not create another Redux store, another Axios client, or a separate state-management system.

---

## API Base URL

```text
https://zubitechnologies.com/ota_server/api
```

Use the environment variable and centralized API client already created for the authentication integration.

Do not hardcode the base URL inside individual components.

---

## Authentication Requirements

All Devices and Projects endpoints require an authentication token.

Before implementing these endpoints:

1. Inspect how the login integration stores the authentication token.
2. Reuse the existing authenticated API client or Axios interceptor.
3. Attach the token using the authorization format expected by the backend.
4. Do not create a second token-storage mechanism.
5. Do not pass the token as a visible form field unless the backend explicitly requires that format.

The expected request header will likely be:

```http
Authorization: Bearer <token>
```

However, verify the existing API response and authentication implementation before assuming the token format.

When the project already has an authenticated Axios instance, reuse it.

Example:

```javascript
apiClient.interceptors.request.use((config) => {
  const token = getStoredToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});
```

Do not log authentication tokens.

---

# Devices Module

## Required Device Features

Implement the following Redux actions and API functions:

```text
registerDevice
updateDevice
getAllDevices
```

Suggested service function names:

```text
registerDeviceApi
updateDeviceApi
getAllDevicesApi
```

Follow the naming conventions already used in the application.

---

## 1. Register Device

### Endpoint

```http
POST /register_device
```

### Full URL

```text
https://zubitechnologies.com/ota_server/api/register_device
```

### Authentication

```text
Token required
```

### Request Format

```http
multipart/form-data
```

### FormData Parameters

```text
project_id
device_id
```

Example API function:

```javascript
export const registerDeviceApi = async (payload) => {
  const formData = new FormData();

  formData.append("project_id", String(payload.project_id));
  formData.append("device_id", String(payload.device_id));

  const response = await apiClient.post("/register_device", formData);

  return response.data;
};
```

Do not send this request as raw JSON.

---

## 2. Update Device

### Endpoint

```http
POST /update_device
```

### Full URL

```text
https://zubitechnologies.com/ota_server/api/update_device
```

### Authentication

```text
Token required
```

### Request Format

```http
multipart/form-data
```

### FormData Parameters

```text
device_id
id
```

Parameter meaning:

* `id` represents the database record ID of the device.
* `device_id` represents the device identifier being assigned or updated.

Do not replace `id` with `device_id`, `_id`, or `deviceId`.

Example API function:

```javascript
export const updateDeviceApi = async (payload) => {
  const formData = new FormData();

  formData.append("device_id", String(payload.device_id));
  formData.append("id", String(payload.id));

  const response = await apiClient.post("/update_device", formData);

  return response.data;
};
```

---

## 3. Get All Devices

### Endpoint

```http
GET /getall_devices
```

### Full URL

```text
https://zubitechnologies.com/ota_server/api/getall_devices
```

### Authentication

```text
Token required
```

### Request Body

No request body is required.

Do not create `FormData` for this endpoint unless the backend specifically rejects a normal authenticated GET request.

Example API function:

```javascript
export const getAllDevicesApi = async () => {
  const response = await apiClient.get("/getall_devices");

  return response.data;
};
```

If the backend requires `POST` rather than `GET`, preserve the endpoint name but update the HTTP method only after confirming this from an actual API response or backend documentation.

---

## Devices Redux State

Create or update the appropriate Redux slice.

Suggested state:

```javascript
const initialState = {
  devices: [],
  selectedDevice: null,

  getDevicesLoading: false,
  registerDeviceLoading: false,
  updateDeviceLoading: false,

  getDevicesError: null,
  registerDeviceError: null,
  updateDeviceError: null,

  registerDeviceSuccess: false,
  updateDeviceSuccess: false,
};
```

Use the existing application state structure when it differs.

Create async actions similar to:

```javascript
export const getAllDevices = createAsyncThunk(
  "devices/getAllDevices",
  async (_, { rejectWithValue }) => {
    try {
      return await getAllDevicesApi();
    } catch (error) {
      return rejectWithValue(
        error.response?.data || {
          message: error.message || "Unable to retrieve devices.",
        }
      );
    }
  }
);

export const registerDevice = createAsyncThunk(
  "devices/registerDevice",
  async (payload, { rejectWithValue }) => {
    try {
      return await registerDeviceApi(payload);
    } catch (error) {
      return rejectWithValue(
        error.response?.data || {
          message: error.message || "Unable to register device.",
        }
      );
    }
  }
);

export const updateDevice = createAsyncThunk(
  "devices/updateDevice",
  async (payload, { rejectWithValue }) => {
    try {
      return await updateDeviceApi(payload);
    } catch (error) {
      return rejectWithValue(
        error.response?.data || {
          message: error.message || "Unable to update device.",
        }
      );
    }
  }
);
```

Adapt these examples to the Redux pattern already present in the project.

---

## Devices Page Requirements

Locate the existing Devices page before creating a new one.

The Devices page must:

1. Fetch all devices when the page loads.
2. Display loading, empty, success, and error states.
3. Display the devices in the application’s existing table or list design.
4. Provide a button or form for registering a device.
5. Provide an edit action for updating a device.
6. Refresh or update the device list after successful registration.
7. Refresh or update the device list after a successful update.
8. Prevent duplicate submissions.
9. Keep existing pagination, search, filtering, and responsive design patterns where available.

Suggested table fields should be based on the actual API response.

Do not invent fields that are not returned by the backend.

Possible fields may include:

```text
id
device_id
project_id
project_name
created_at
updated_at
```

Inspect the API response and render only confirmed fields.

---

## Register Device Form

The form must collect:

```text
project_id
device_id
```

Suggested dispatch:

```javascript
dispatch(
  registerDevice({
    project_id,
    device_id,
  })
);
```

The project field should preferably be a select input populated from the Projects API.

Display the project name to the user while submitting the corresponding `project_id`.

Do not ask the user to manually type a project database ID when project data is already available.

---

## Update Device Form

The update form must submit:

```text
device_id
id
```

Suggested dispatch:

```javascript
dispatch(
  updateDevice({
    device_id,
    id,
  })
);
```

The device database record `id` should come from the selected device row.

Do not display the record ID as an editable input unless the existing application specifically requires it.

---

## Device Validation

### Register Device

Validate:

* `project_id` is required.
* `device_id` is required.
* Do not submit empty strings.
* Do not submit `undefined`.
* Do not submit `null`.

### Update Device

Validate:

* `id` is required.
* `device_id` is required.
* The selected device must exist before dispatching the request.

---

# Projects Module

## Menu Integration

Add a Projects item to the application's existing sidebar, navigation menu, or dashboard menu.

Follow the current menu structure, icon library, route naming pattern, permissions logic, and styling.

Suggested label:

```text
Projects
```

Suggested route:

```text
/projects
```

Do not replace the existing menu or create a separate navigation system.

The Projects menu item should:

1. Use the existing menu component.
2. Use the existing active-route styling.
3. Respect existing authentication and privilege checks.
4. Link to the Projects page.
5. Remain responsive on mobile and desktop.

---

## Required Project Features

Implement the following Redux actions and API functions:

```text
createProject
getProjects
updateProject
```

Suggested service function names:

```text
createProjectApi
getProjectsApi
updateProjectApi
```

---

## 1. Create Project

### Endpoint

```http
POST /create_project
```

### Full URL

```text
https://zubitechnologies.com/ota_server/api/create_project
```

### Authentication

```text
Token required
```

### Request Format

```http
multipart/form-data
```

### Provided FormData Parameter

```text
create_project
```

Use the parameter name exactly as provided by the backend:

```javascript
formData.append("create_project", payload.create_project);
```

Example API function:

```javascript
export const createProjectApi = async (payload) => {
  const formData = new FormData();

  formData.append("create_project", payload.create_project);

  const response = await apiClient.post("/create_project", formData);

  return response.data;
};
```

### Important Backend Parameter Check

The provided create-project parameter is:

```text
create_project
```

This may represent the project name, but Codex must not automatically rename it to:

```text
project_name
name
project
```

Use `create_project` unless the backend response or existing code confirms that another field name is required.

For frontend readability, the visible input can be labelled:

```text
Project Name
```

But the submitted backend field must remain:

```text
create_project
```

Suggested dispatch:

```javascript
dispatch(
  createProject({
    create_project: projectName,
  })
);
```

---

## 2. Get Projects

### Endpoint

```http
GET /getproject
```

### Full URL

```text
https://zubitechnologies.com/ota_server/api/getproject
```

### Authentication

```text
Token required
```

### Request Body

No request body is required.

Example API function:

```javascript
export const getProjectsApi = async () => {
  const response = await apiClient.get("/getproject");

  return response.data;
};
```

Do not send an empty `FormData` request with this endpoint unless the backend explicitly requires a POST request.

---

## 3. Update Project

### Endpoint

```http
POST /updateproject
```

### Full URL

```text
https://zubitechnologies.com/ota_server/api/updateproject
```

### Authentication

```text
Token required
```

### Request Format

```http
multipart/form-data
```

### FormData Parameters

```text
project_id
project_name
```

Example API function:

```javascript
export const updateProjectApi = async (payload) => {
  const formData = new FormData();

  formData.append("project_id", String(payload.project_id));
  formData.append("project_name", payload.project_name);

  const response = await apiClient.post("/updateproject", formData);

  return response.data;
};
```

Do not change the endpoint to `/update_project`.

The backend endpoint must remain:

```text
/updateproject
```

---

## Projects Redux State

Suggested state:

```javascript
const initialState = {
  projects: [],
  selectedProject: null,

  getProjectsLoading: false,
  createProjectLoading: false,
  updateProjectLoading: false,

  getProjectsError: null,
  createProjectError: null,
  updateProjectError: null,

  createProjectSuccess: false,
  updateProjectSuccess: false,
};
```

Suggested async actions:

```javascript
export const getProjects = createAsyncThunk(
  "projects/getProjects",
  async (_, { rejectWithValue }) => {
    try {
      return await getProjectsApi();
    } catch (error) {
      return rejectWithValue(
        error.response?.data || {
          message: error.message || "Unable to retrieve projects.",
        }
      );
    }
  }
);

export const createProject = createAsyncThunk(
  "projects/createProject",
  async (payload, { rejectWithValue }) => {
    try {
      return await createProjectApi(payload);
    } catch (error) {
      return rejectWithValue(
        error.response?.data || {
          message: error.message || "Unable to create project.",
        }
      );
    }
  }
);

export const updateProject = createAsyncThunk(
  "projects/updateProject",
  async (payload, { rejectWithValue }) => {
    try {
      return await updateProjectApi(payload);
    } catch (error) {
      return rejectWithValue(
        error.response?.data || {
          message: error.message || "Unable to update project.",
        }
      );
    }
  }
);
```

Follow the existing Redux implementation if the project uses RTK Query, classic Redux, custom hooks, or another established Redux pattern.

---

## Projects Page Requirements

Create or update the Projects page.

The page must:

1. Fetch projects when the page loads.
2. Display all returned projects.
3. Show loading, error, empty, and success states.
4. Provide a Create Project action.
5. Provide an Edit Project action.
6. Refresh or update the project list after a successful creation.
7. Refresh or update the project list after a successful update.
8. Use the application's existing table, card, modal, drawer, and form styles.
9. Preserve responsive behaviour.
10. Avoid unrelated redesigns.

Possible displayed fields must be based on the actual API response.

Possible fields may include:

```text
project_id
id
project_name
created_at
updated_at
```

Do not assume whether the project identifier is called `id` or `project_id`.

Inspect the response before mapping the data.

---

## Create Project Form

Display a field labelled:

```text
Project Name
```

Submit the value using:

```text
create_project
```

Suggested component state:

```javascript
const [projectName, setProjectName] = useState("");
```

Suggested dispatch:

```javascript
dispatch(
  createProject({
    create_project: projectName.trim(),
  })
);
```

Do not expose the backend field name `create_project` as the visible form label unless it is already part of the UI design.

---

## Update Project Form

The update form must submit:

```text
project_id
project_name
```

Suggested dispatch:

```javascript
dispatch(
  updateProject({
    project_id: selectedProject.project_id,
    project_name,
  })
);
```

When the API uses `id` in its response instead of `project_id`, inspect the data and map the correct value before submitting.

Do not guess which field represents the project ID.

---

## Project Validation

### Create Project

Validate:

* The project name is required.
* Trim leading and trailing spaces.
* Do not submit an empty value.
* Do not submit `null` or `undefined`.

### Update Project

Validate:

* `project_id` is required.
* `project_name` is required.
* Trim the project name.
* The selected project must exist.

---

# Shared API Error Handling

Reuse the application's existing error helper.

When one does not exist, use a helper similar to:

```javascript
export const getApiErrorMessage = (
  error,
  fallback = "Something went wrong."
) => {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  );
};
```

Support backend validation responses such as:

```json
{
  "message": "Validation failed",
  "errors": {
    "device_id": ["The device ID has already been registered."]
  }
}
```

Do not render raw Axios objects, HTML error pages, tokens, request headers, or backend stack traces in the UI.

---

# Shared UI Behaviour

For all Devices and Projects forms:

* Disable submit buttons while requests are running.
* Prevent double submission.
* Show operation-specific loading indicators.
* Show backend success messages where available.
* Show useful fallback messages where backend messages are absent.
* Clear previous errors when a new request starts.
* Preserve form values after failed requests.
* Reset forms after successful creation.
* Close modals or drawers only after successful requests.
* Refresh the relevant list after successful create or update operations.
* Maintain keyboard navigation and accessibility labels.
* Reuse existing toast or notification components.

Do not use one global loading state for every device and project operation when multiple actions can occur independently.

---

# Suggested Folder Structure

Use the existing project structure.

Where compatible, a structure similar to this may be used:

```text
src/
  api/
    apiClient.js
    adminApi.js
    deviceApi.js
    projectApi.js

  store/
    slices/
      adminSlice.js
      deviceSlice.js
      projectSlice.js

  pages/
    Devices/
    Projects/

  components/
    devices/
      RegisterDeviceForm.jsx
      UpdateDeviceForm.jsx
      DevicesTable.jsx

    projects/
      CreateProjectForm.jsx
      UpdateProjectForm.jsx
      ProjectsTable.jsx
```

Do not reorganize the application solely to match this example.

---

# Integration Between Projects and Devices

The Register Device form requires:

```text
project_id
```

Therefore:

1. Fetch the projects before or when opening the Register Device form.
2. Populate a project select input from the project list.
3. Display the project name.
4. Submit the associated project ID.
5. Show a useful message when no projects exist.
6. Provide navigation to the Projects page where appropriate.
7. Do not let the user register a device without selecting a valid project.

Example:

```jsx
<select
  value={projectId}
  onChange={(event) => setProjectId(event.target.value)}
>
  <option value="">Select a project</option>

  {projects.map((project) => (
    <option
      key={project.project_id || project.id}
      value={project.project_id || project.id}
    >
      {project.project_name || project.name}
    </option>
  ))}
</select>
```

The exact response properties must be confirmed before finalizing this mapping.

---

# HTTP Method Verification

Use the following initial HTTP methods:

```text
POST /register_device
POST /update_device
GET  /getall_devices

POST /create_project
GET  /getproject
POST /updateproject
```

If the server returns a clear method-related response such as `405 Method Not Allowed`, inspect the backend documentation or existing implementation and use the method required by the server.

Do not silently switch every endpoint to POST without evidence.

---

# Implementation Rules for Codex

Before making changes:

1. Inspect the existing routing structure.
2. Locate the Devices page.
3. Locate the sidebar or dashboard menu.
4. Locate the Redux store and existing slices.
5. Locate the API client and token interceptor.
6. Locate existing reusable tables, forms, modals, buttons, loaders, and notifications.
7. Check whether Projects or Devices modules already partially exist.
8. Follow the current TypeScript or JavaScript conventions.
9. Avoid unrelated refactoring.

During implementation:

1. Reuse the existing token.
2. Use `FormData` for create and update requests.
3. Use authenticated requests for every endpoint.
4. Keep backend parameter names unchanged.
5. Keep backend endpoint spellings unchanged.
6. Use operation-specific Redux loading and error states.
7. Use actual API response structures.
8. Do not add mock data to production code.
9. Do not invent response fields.
10. Do not expose tokens in components or logs.

After implementation:

1. Report every file created.
2. Report every file modified.
3. State where the Projects menu item was added.
4. State the route used for the Projects page.
5. Confirm how the token is attached.
6. Confirm which endpoints use `FormData`.
7. Confirm which endpoints use GET requests.
8. State the actual project response structure.
9. State the actual device response structure.
10. Report unresolved backend inconsistencies.
11. Run available linting.
12. Run available type checking.
13. Run available tests.
14. Fix integration-related errors found by those checks.

---

# API Summary

## Devices

```text
Register Device
POST /register_device
Token required
FormData:
- project_id
- device_id
```

```text
Update Device
POST /update_device
Token required
FormData:
- device_id
- id
```

```text
Get All Devices
GET /getall_devices
Token required
No request body
```

## Projects

```text
Create Project
POST /create_project
Token required
FormData:
- create_project
```

```text
Get Projects
GET /getproject
Token required
No request body
```

```text
Update Project
POST /updateproject
Token required
FormData:
- project_id
- project_name
```

---

# Exact Backend Names

Do not alter these endpoint names:

```text
/register_device
/update_device
/getall_devices
/create_project
/getproject
/updateproject
```

Do not alter these request parameter names:

```text
project_id
device_id
id
create_project
project_name
```

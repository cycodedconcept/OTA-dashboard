Add an **IMEI** module to the OTA Dashboard using the existing project structure, UI components, API configuration, authentication flow, and coding conventions.

## 1. Sidebar Changes

Add a new sidebar menu item named **IMEI**.

Requirements:

* Add an appropriate icon.
* Add the IMEI page route.
* Ensure the active sidebar state works correctly.
* Do not modify or remove unrelated sidebar items.

## 2. IMEI Page

Create an IMEI page with two main sections or tabs:

1. Create IMEI
2. IMEI Records

Use the dashboard’s existing layout, cards, forms, tables, buttons, alerts, loading states, and responsive styling.

## 3. Create IMEI

Endpoint:

```text
POST /post_imei_mcuid
```

Base URL:

```text
https://zubitechnologies.com/ota_server/api
```

Request type:

```text
multipart/form-data
```

Form-data parameters:

```text
imei
mcu_id
```

Requirements:

* Add an input for `imei`.
* Add an input for `mcu_id`.
* Make both fields required.
* Trim unnecessary spaces before submission.
* Validate the IMEI according to the format expected by the backend.
* Do not assume a fixed IMEI length unless confirmed by the API documentation.
* Display clear field validation messages.
* Disable the submit button while the request is processing.
* Display success and error feedback.
* Reset the form only after a successful request.
* Use the existing API client and authentication/token pattern.
* Do not manually set the multipart boundary.

Example FormData construction:

```javascript
const formData = new FormData();

formData.append("imei", imei.trim());
formData.append("mcu_id", mcuId.trim());
```

## 4. Get IMEI Records

Endpoint:

```text
GET /get_imei_mcuid
```

Requirements:

* Fetch the IMEI records when the page loads.
* Display the records in a responsive table.
* Include the IMEI, MCU ID, and any other useful fields returned by the API.
* Do not invent response property names.
* Inspect the actual API response and map the returned fields correctly.
* Add loading, error, and empty states.
* Add a refresh button to fetch the latest records.
* Refresh the table automatically after successfully creating an IMEI record.
* Use the existing API authentication/token pattern if the endpoint requires authentication.

## 5. API Service

Create or update an IMEI API service with functions similar to:

```javascript
createImei(payload)
getImeiRecords()
```

Suggested implementation structure:

```javascript
export const createImei = async ({ imei, mcuId }) => {
  const formData = new FormData();

  formData.append("imei", imei);
  formData.append("mcu_id", mcuId);

  return apiClient.post("/post_imei_mcuid", formData);
};

export const getImeiRecords = async () => {
  return apiClient.get("/get_imei_mcuid");
};
```

Adapt this implementation to the project’s current Axios, Fetch API, React Query, TypeScript, or state-management pattern.

## 6. Table Requirements

The IMEI records table should contain columns based on the real API response, including where available:

* IMEI
* MCU ID
* Date created
* Status
* Actions

Only display fields that actually exist in the API response. Do not implement edit or delete actions unless corresponding endpoints already exist.

## 7. Code Quality

* Reuse existing form, table, input, button, toast, and layout components.
* Keep API calls separate from presentation components.
* Add TypeScript interfaces if the project uses TypeScript.
* Avoid using `any`.
* Do not expose authentication tokens in console logs.
* Do not modify unrelated functionality.
* Handle API errors safely, including validation and network errors.
* Fix any linting or TypeScript errors introduced by this work.

After completing the implementation, provide a summary containing:

1. Files created
2. Files modified
3. Sidebar and route changes
4. API functions added
5. Form validation added
6. Actual IMEI response structure discovered
7. Any details that still require API confirmation

import { getApiErrorMessage } from '../utils/apiErrors';
import { readStoredAdminToken } from '../utils/adminSession';

export function createApiError({ data = null, message, status = null }) {
  const error = new Error(message);
  error.data = data;
  error.status = status;

  return error;
}

function getBaseUrl() {
  if (import.meta.env.DEV) {
    return '/ota-api';
  }

  const baseUrl = import.meta.env.VITE_API_BASE_URL?.trim();

  if (!baseUrl) {
    throw createApiError({
      message: 'VITE_API_BASE_URL is not configured.',
    });
  }

  return baseUrl.replace(/\/+$/, '');
}

async function parseResponseBody(response) {
  const rawBody = await response.text();
  const trimmedBody = rawBody.trim();

  if (!trimmedBody) {
    return null;
  }

  try {
    return JSON.parse(trimmedBody);
  } catch {
    return trimmedBody;
  }
}

async function request(path, options = {}) {
  const headers = new Headers(options.headers ?? {});
  const token = readStoredAdminToken();

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${getBaseUrl()}${path}`, {
    ...options,
    headers,
  });
  const data = await parseResponseBody(response);

  if (!response.ok) {
    throw createApiError({
      data,
      message: getApiErrorMessage(
        {
          data,
          statusText: response.statusText,
        },
        `Request failed with status ${response.status}.`
      ),
      status: response.status,
    });
  }

  return data;
}

const apiClient = {
  get(path, options = {}) {
    return request(path, {
      ...options,
      method: 'GET',
    });
  },
  post(path, body, options = {}) {
    return request(path, {
      ...options,
      body,
      method: 'POST',
    });
  },
};

export default apiClient;

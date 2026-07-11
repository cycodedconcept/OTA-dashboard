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

function parseRawBody(rawBody) {
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

async function parseResponseBody(response) {
  const contentType = response.headers.get('content-type')?.toLowerCase() ?? '';

  if (
    contentType &&
    !contentType.includes('application/json') &&
    !contentType.startsWith('text/') &&
    !contentType.includes('application/xml') &&
    !contentType.includes('application/javascript')
  ) {
    return response.blob();
  }

  return parseRawBody(await response.text());
}

function getRequestHeaders(customHeaders = {}) {
  const headers = new Headers(customHeaders);
  const token = readStoredAdminToken();

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  return headers;
}

function buildUrl(path) {
  return `${getBaseUrl()}${path}`;
}

async function request(path, options = {}) {
  const headers = getRequestHeaders(options.headers ?? {});

  const response = await fetch(buildUrl(path), {
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

  return options.includeMeta
    ? {
        data,
        headers: response.headers,
        status: response.status,
      }
    : data;
}

function upload(path, body, options = {}) {
  const headers = getRequestHeaders(options.headers ?? {});

  return new Promise((resolve, reject) => {
    const requestInstance = new XMLHttpRequest();

    requestInstance.open(options.method ?? 'POST', buildUrl(path));

    headers.forEach((value, key) => {
      requestInstance.setRequestHeader(key, value);
    });

    if (typeof options.onUploadProgress === 'function') {
      requestInstance.upload.addEventListener('progress', (event) => {
        options.onUploadProgress({
          lengthComputable: event.lengthComputable,
          loaded: event.loaded,
          percent: event.lengthComputable
            ? Math.round((event.loaded / event.total) * 100)
            : null,
          total: event.total,
        });
      });
    }

    requestInstance.addEventListener('error', () => {
      reject(
        createApiError({
          message: 'Network request failed.',
          status: requestInstance.status || null,
        })
      );
    });

    requestInstance.addEventListener('load', () => {
      const data = parseRawBody(requestInstance.responseText);

      if (requestInstance.status < 200 || requestInstance.status >= 300) {
        reject(
          createApiError({
            data,
            message: getApiErrorMessage(
              {
                data,
                statusText: requestInstance.statusText,
              },
              `Request failed with status ${requestInstance.status}.`
            ),
            status: requestInstance.status,
          })
        );

        return;
      }

      resolve(
        options.includeMeta
          ? {
              data,
              headers: requestInstance.getAllResponseHeaders(),
              status: requestInstance.status,
            }
          : data
      );
    });

    requestInstance.send(body);
  });
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
  upload(path, body, options = {}) {
    return upload(path, body, options);
  },
};

export default apiClient;

export const ADMIN_TOKEN_STORAGE_KEY = 'admin_token';
export const ADMIN_PROFILE_STORAGE_KEY = 'admin_profile';

function isBrowser() {
  return typeof window !== 'undefined';
}

function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readStorageItem(key) {
  if (!isBrowser()) {
    return null;
  }

  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorageItem(key, value) {
  if (!isBrowser()) {
    return;
  }

  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Ignore storage write failures so the UI can keep working in restricted browsers.
  }
}

function removeStorageItem(key) {
  if (!isBrowser()) {
    return;
  }

  try {
    window.localStorage.removeItem(key);
  } catch {
    // Ignore storage removal failures.
  }
}

function findToken(value, visited = new Set()) {
  if (!value || typeof value !== 'object') {
    return null;
  }

  if (visited.has(value)) {
    return null;
  }

  visited.add(value);

  for (const [key, nestedValue] of Object.entries(value)) {
    if (
      ['token', 'access_token', 'accessToken', 'bearer_token', 'bearerToken'].includes(
        key
      ) &&
      typeof nestedValue === 'string' &&
      nestedValue.trim()
    ) {
      return nestedValue.trim();
    }

    if (isPlainObject(nestedValue) || Array.isArray(nestedValue)) {
      const foundToken = findToken(nestedValue, visited);

      if (foundToken) {
        return foundToken;
      }
    }
  }

  return null;
}

function looksLikeAdmin(value) {
  if (!isPlainObject(value)) {
    return false;
  }

  const hasIdentityField =
    'id' in value ||
    'admin_id' in value ||
    'email' in value ||
    'name' in value ||
    'user_role' in value ||
    'role' in value;

  return hasIdentityField;
}

function findAdmin(value, visited = new Set()) {
  if (!value || typeof value !== 'object') {
    return null;
  }

  if (visited.has(value)) {
    return null;
  }

  visited.add(value);

  for (const key of ['admin', 'user']) {
    const candidate = value[key];

    if (looksLikeAdmin(candidate)) {
      return candidate;
    }
  }

  if (looksLikeAdmin(value)) {
    return value;
  }

  for (const nestedValue of Object.values(value)) {
    if (isPlainObject(nestedValue) || Array.isArray(nestedValue)) {
      const foundAdmin = findAdmin(nestedValue, visited);

      if (foundAdmin) {
        return foundAdmin;
      }
    }
  }

  return null;
}

export function readStoredAdminToken() {
  const token = readStorageItem(ADMIN_TOKEN_STORAGE_KEY);

  return token?.trim() ? token.trim() : null;
}

export function readStoredAdmin() {
  const rawAdmin = readStorageItem(ADMIN_PROFILE_STORAGE_KEY);

  if (!rawAdmin) {
    return null;
  }

  try {
    const parsedAdmin = JSON.parse(rawAdmin);

    return looksLikeAdmin(parsedAdmin) ? parsedAdmin : null;
  } catch {
    return null;
  }
}

export function persistAdminSession({ admin, token }) {
  if (typeof token === 'string' && token.trim()) {
    writeStorageItem(ADMIN_TOKEN_STORAGE_KEY, token.trim());
  } else {
    removeStorageItem(ADMIN_TOKEN_STORAGE_KEY);
  }

  if (looksLikeAdmin(admin)) {
    writeStorageItem(ADMIN_PROFILE_STORAGE_KEY, JSON.stringify(admin));
  } else {
    removeStorageItem(ADMIN_PROFILE_STORAGE_KEY);
  }
}

export function clearAdminSession() {
  removeStorageItem(ADMIN_TOKEN_STORAGE_KEY);
  removeStorageItem(ADMIN_PROFILE_STORAGE_KEY);
}

export function extractAdminSession(payload) {
  return {
    admin: findAdmin(payload),
    token: findToken(payload),
  };
}

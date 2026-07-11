export function hasValue(value) {
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }

  return value !== undefined && value !== null && String(value).trim().length > 0;
}

export function isValidEmail(value) {
  if (!hasValue(value)) {
    return false;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim());
}

export function isValidImei(value) {
  if (!hasValue(value)) {
    return false;
  }

  return /^\d+$/.test(String(value).trim());
}

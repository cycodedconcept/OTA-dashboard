function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function findArrayDeep(value, visited = new Set()) {
  if (Array.isArray(value)) {
    return value;
  }

  if (!isPlainObject(value) || visited.has(value)) {
    return null;
  }

  visited.add(value);

  for (const nestedValue of Object.values(value)) {
    const foundArray = findArrayDeep(nestedValue, visited);

    if (foundArray) {
      return foundArray;
    }
  }

  return null;
}

export function extractCollection(payload, preferredKeys = []) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (!isPlainObject(payload)) {
    return [];
  }

  for (const key of preferredKeys) {
    if (Array.isArray(payload[key])) {
      return payload[key];
    }
  }

  for (const key of ['data', 'items', 'result', 'records']) {
    if (Array.isArray(payload[key])) {
      return payload[key];
    }
  }

  return findArrayDeep(payload) ?? [];
}

export function pickFirstDefined(source, keys) {
  if (!source || typeof source !== 'object') {
    return null;
  }

  for (const key of keys) {
    const value = source[key];

    if (value !== undefined && value !== null && `${value}`.trim() !== '') {
      return value;
    }
  }

  return null;
}

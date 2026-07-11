function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function findValueDeep(source, keys, visited = new Set()) {
  if (!isPlainObject(source) || visited.has(source)) {
    return null;
  }

  visited.add(source);

  for (const key of keys) {
    const value = source[key];

    if (value !== undefined && value !== null && `${value}`.trim() !== '') {
      return value;
    }
  }

  for (const nestedValue of Object.values(source)) {
    if (!isPlainObject(nestedValue)) {
      continue;
    }

    const foundValue = findValueDeep(nestedValue, keys, visited);

    if (foundValue !== null) {
      return foundValue;
    }
  }

  return null;
}

function toPositiveInteger(value) {
  const normalizedValue = Number.parseInt(value, 10);

  return Number.isInteger(normalizedValue) && normalizedValue > 0
    ? normalizedValue
    : null;
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

export function extractPagination(payload, fallbackPage = 1) {
  const currentPage =
    toPositiveInteger(
      findValueDeep(payload, ['current_page', 'currentPage', 'page'])
    ) ?? fallbackPage;
  const lastPage =
    toPositiveInteger(
      findValueDeep(payload, [
        'last_page',
        'lastPage',
        'total_pages',
        'totalPages',
        'pages',
        'page_count',
        'pageCount',
      ])
    ) ?? currentPage;
  const perPage = toPositiveInteger(
    findValueDeep(payload, ['per_page', 'perPage', 'page_size', 'pageSize', 'limit'])
  );
  const total = toPositiveInteger(
    findValueDeep(payload, ['total', 'total_count', 'totalCount', 'count'])
  );

  return {
    currentPage,
    lastPage: Math.max(currentPage, lastPage),
    perPage,
    total,
  };
}

export function isLikelyHtmlString(value) {
  return typeof value === 'string' && /<\/?[a-z][\s\S]*>/i.test(value);
}

export function getApiFieldErrors(error) {
  const data = error?.data ?? error?.response?.data ?? error;

  if (data?.errors && typeof data.errors === 'object') {
    return data.errors;
  }

  return {};
}

export function getApiFieldError(error, field) {
  const value = getApiFieldErrors(error)[field];

  if (Array.isArray(value)) {
    return value[0] ?? '';
  }

  return typeof value === 'string' ? value : '';
}

export function getApiErrorMessage(error, fallback = 'Something went wrong.') {
  const data = error?.data ?? error?.response?.data ?? error;
  const directMessage =
    data?.message ||
    data?.error ||
    error?.message ||
    error?.response?.statusText ||
    error?.statusText;

  if (typeof directMessage === 'string') {
    const trimmedMessage = directMessage.trim();

    if (trimmedMessage && !isLikelyHtmlString(trimmedMessage)) {
      return trimmedMessage;
    }
  }

  if (typeof data === 'string' && data.trim() && !isLikelyHtmlString(data)) {
    return data.trim();
  }

  return fallback;
}

export function getApiSuccessMessage(payload, fallback) {
  if (typeof payload?.message === 'string' && payload.message.trim()) {
    return payload.message.trim();
  }

  return fallback;
}

export function toSerializableApiError(
  error,
  fallback = 'Something went wrong.'
) {
  const data = error?.data ?? error?.response?.data ?? null;

  return {
    data,
    error: data?.error ?? null,
    errors: getApiFieldErrors(error),
    message: getApiErrorMessage(error, fallback),
    status: error?.status ?? error?.response?.status ?? null,
  };
}

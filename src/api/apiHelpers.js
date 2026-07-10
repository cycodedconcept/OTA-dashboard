import { getApiErrorMessage, isLikelyHtmlString } from '../utils/apiErrors';
import { hasValue } from '../utils/formValidation';
import { createApiError } from './apiClient';

export function appendRequiredFormField(formData, key, value, label) {
  if (!hasValue(value)) {
    throw createApiError({
      message: `${label} is required.`,
    });
  }

  formData.append(key, String(value));
}

export function throwIfApiReportedError(data, fallbackMessage) {
  if (isLikelyHtmlString(data)) {
    throw createApiError({
      data,
      message: fallbackMessage,
    });
  }

  if (
    data &&
    typeof data === 'object' &&
    !Array.isArray(data) &&
    (data.success === false || hasValue(data.error))
  ) {
    throw createApiError({
      data,
      message: getApiErrorMessage(data, fallbackMessage),
    });
  }

  return data;
}

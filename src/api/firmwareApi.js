import apiClient, { createApiError } from './apiClient';
import {
  appendRequiredFormField,
  throwIfApiReportedError,
} from './apiHelpers';

function appendRequiredFiles(formData, files) {
  if (!Array.isArray(files) || files.length === 0) {
    throw createApiError({
      message: 'At least one firmware file is required.',
    });
  }

  files.forEach((file) => {
    formData.append('files[]', file);
  });
}

function appendRequiredDeviceIds(formData, deviceIds) {
  if (!Array.isArray(deviceIds) || deviceIds.length === 0) {
    throw createApiError({
      message: 'At least one device ID is required.',
    });
  }

  deviceIds.forEach((deviceId) => {
    if (!String(deviceId ?? '').trim()) {
      return;
    }

    formData.append('device_id[]', String(deviceId).trim());
  });

  if (!formData.getAll('device_id[]').length) {
    throw createApiError({
      message: 'At least one device ID is required.',
    });
  }
}

function parseFilenameFromHeader(headerValue) {
  if (typeof headerValue !== 'string' || !headerValue.trim()) {
    return null;
  }

  const utf8Match = headerValue.match(/filename\*=UTF-8''([^;]+)/i);

  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1]).trim();
    } catch {
      return utf8Match[1].trim();
    }
  }

  const basicMatch = headerValue.match(/filename="?([^"]+)"?/i);

  return basicMatch?.[1]?.trim() ?? null;
}

export async function createFirmwareApi(payload) {
  const formData = new FormData();

  appendRequiredFormField(formData, 'device_id', payload.device_id, 'Device ID');
  appendRequiredFormField(formData, 'project_id', payload.project_id, 'Project ID');

  const response = await apiClient.post('/getfirmware_file', formData, {
    includeMeta: true,
  });
  const data = throwIfApiReportedError(
    response.data,
    'Unable to create firmware.'
  );

  if (data instanceof Blob) {
    return {
      file: data,
      filename: parseFilenameFromHeader(
        response.headers.get('content-disposition')
      ),
      message: 'Firmware file is ready.',
    };
  }

  return data;
}

export async function uploadFirmwareApi(payload, onUploadProgress) {
  const formData = new FormData();

  appendRequiredFiles(formData, payload.files);
  appendRequiredFormField(formData, 'project_id', payload.project_id, 'Project ID');
  appendRequiredDeviceIds(formData, payload.deviceIds);
  appendRequiredFormField(formData, 'version', payload.version, 'Version');
  appendRequiredFormField(formData, 'CRC', payload.CRC, 'CRC');

  const data = await apiClient.upload('/upload_firmwarefile', formData, {
    onUploadProgress,
  });

  return throwIfApiReportedError(data, 'Unable to upload firmware.');
}

export async function getOtaDevicesApi(page = 1) {
  const normalizedPage = Number.parseInt(page, 10);
  const nextPage = Number.isInteger(normalizedPage) && normalizedPage > 0
    ? normalizedPage
    : 1;
  const params = new URLSearchParams({
    page: String(nextPage),
  });
  const data = await apiClient.get(`/ota_devices?${params.toString()}`);

  return throwIfApiReportedError(data, 'Unable to retrieve OTA devices.');
}

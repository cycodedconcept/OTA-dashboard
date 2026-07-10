import apiClient from './apiClient';
import {
  appendRequiredFormField,
  throwIfApiReportedError,
} from './apiHelpers';

export async function registerDeviceApi(payload) {
  const formData = new FormData();

  appendRequiredFormField(formData, 'project_id', payload.project_id, 'Project');
  appendRequiredFormField(formData, 'device_id', payload.device_id, 'Device ID');

  const data = await apiClient.post('/register_device', formData);

  return throwIfApiReportedError(data, 'Unable to register device.');
}

export async function updateDeviceApi(payload) {
  const formData = new FormData();

  appendRequiredFormField(formData, 'device_id', payload.device_id, 'Device ID');
  appendRequiredFormField(formData, 'id', payload.id, 'Device record ID');

  const data = await apiClient.post('/update_device', formData);

  return throwIfApiReportedError(data, 'Unable to update device.');
}

export async function getAllDevicesApi() {
  const data = await apiClient.get('/getall_devices');

  return throwIfApiReportedError(data, 'Unable to retrieve devices.');
}

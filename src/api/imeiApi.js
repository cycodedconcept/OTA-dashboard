import apiClient from './apiClient';
import {
  appendRequiredFormField,
  throwIfApiReportedError,
} from './apiHelpers';

export async function createImeiApi(payload) {
  const formData = new FormData();

  appendRequiredFormField(formData, 'imei', payload.imei?.trim(), 'IMEI');
  appendRequiredFormField(formData, 'mcu_id', payload.mcu_id?.trim(), 'MCU ID');

  const data = await apiClient.post('/post_imei_mcuid', formData);

  return throwIfApiReportedError(data, 'Unable to create IMEI record.');
}

export async function getImeiRecordsApi(page = 1) {
  const normalizedPage = Number.parseInt(page, 10);
  const nextPage =
    Number.isInteger(normalizedPage) && normalizedPage > 0 ? normalizedPage : 1;
  const params = new URLSearchParams({
    page: String(nextPage),
  });
  const data = await apiClient.get(`/get_imei_mcuid?${params.toString()}`);

  return throwIfApiReportedError(data, 'Unable to retrieve IMEI records.');
}

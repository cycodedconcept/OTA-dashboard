import apiClient from './apiClient';
import {
  appendRequiredFormField,
  throwIfApiReportedError,
} from './apiHelpers';

export async function registerAdminApi(payload) {
  const formData = new FormData();

  appendRequiredFormField(formData, 'name', payload.name, 'Name');
  appendRequiredFormField(formData, 'email', payload.email, 'Email');
  appendRequiredFormField(formData, 'password', payload.password, 'Password');
  appendRequiredFormField(formData, 'user_role', payload.user_role, 'User role');

  const data = await apiClient.post('/register_admin', formData);

  return throwIfApiReportedError(data, 'Unable to register admin.');
}

export async function loginAdminApi(payload) {
  const formData = new FormData();

  appendRequiredFormField(formData, 'email', payload.email, 'Email');
  appendRequiredFormField(formData, 'password', payload.password, 'Password');

  const data = await apiClient.post('/login_admin', formData);

  return throwIfApiReportedError(data, 'Unable to log in.');
}

export async function updateAdminPasswordApi(payload) {
  const formData = new FormData();

  appendRequiredFormField(formData, 'password', payload.password, 'Password');
  appendRequiredFormField(formData, 'admin_id', payload.admin_id, 'Admin ID');

  const data = await apiClient.post('/update_password', formData);

  return throwIfApiReportedError(data, 'Unable to update password.');
}

export async function assignAdminPrivilegesApi(payload) {
  const formData = new FormData();

  appendRequiredFormField(formData, 'role', payload.role, 'Role');
  appendRequiredFormField(formData, 'admin_id', payload.admin_id, 'Admin ID');

  const data = await apiClient.post('/assign_priviledges', formData);

  return throwIfApiReportedError(data, 'Unable to assign privileges.');
}

import apiClient from './apiClient';
import {
  appendRequiredFormField,
  throwIfApiReportedError,
} from './apiHelpers';

export async function createProjectApi(payload) {
  const formData = new FormData();
  const projectName = payload.project_name ?? payload.create_project;

  appendRequiredFormField(
    formData,
    'project_name',
    projectName,
    'Project name'
  );
  formData.append('create_project', String(projectName));

  const data = await apiClient.post('/create_project', formData);

  return throwIfApiReportedError(data, 'Unable to create project.');
}

export async function getProjectsApi() {
  const data = await apiClient.get('/getproject');

  return throwIfApiReportedError(data, 'Unable to retrieve projects.');
}

export async function updateProjectApi(payload) {
  const formData = new FormData();

  appendRequiredFormField(
    formData,
    'project_id',
    payload.project_id,
    'Project ID'
  );
  appendRequiredFormField(
    formData,
    'project_name',
    payload.project_name,
    'Project name'
  );

  const data = await apiClient.post('/updateproject', formData);

  return throwIfApiReportedError(data, 'Unable to update project.');
}

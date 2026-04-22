import axiosInstance from './axiosInstance';

export const getAllDoctors = () =>
  axiosInstance.get('/admin/doctors');

export const onboardDoctor = (doctorData) =>
  axiosInstance.post('/admin/doctors', doctorData);

export const deactivateDoctor = (doctorId) =>
  axiosInstance.put(`/admin/doctors/${doctorId}/deactivate`);

export const getAllDepartments = () =>
  axiosInstance.get('/admin/departments');

export const addDepartment = (departmentData) =>
  axiosInstance.post('/admin/departments', departmentData);

export const getAuditLogs = () =>
  axiosInstance.get('/admin/audit');

export const overrideQueue = (queueData) =>
  axiosInstance.put('/admin/queue/override', queueData);
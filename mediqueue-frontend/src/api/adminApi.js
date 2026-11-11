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

export const getAllUsers = () =>
  axiosInstance.get('/users');

/** Create a user of any role with the same fields as self-registration. */
export const createUser = (userData) =>
  axiosInstance.post('/users', userData);

/** status: ACTIVE | SUSPENDED | DEACTIVATED | PENDING_APPROVAL */
export const updateUserStatus = (userId, status) =>
  axiosInstance.patch(`/users/${userId}/status`, { status });

import axiosInstance from './axiosInstance'
import { ENDPOINTS } from './endpoints'

export const getAllDoctors = () => axiosInstance.get('/admin/doctors')

export const onboardDoctor = doctorData => axiosInstance.post('/admin/doctors', doctorData)

/** { departmentId, specialization, qualification, consultationFee } */
export const updateDoctor = (doctorId, details) => axiosInstance.put(`/admin/doctors/${doctorId}`, details)

export const deactivateDoctor = doctorId => axiosInstance.put(`/admin/doctors/${doctorId}/deactivate`)

export const getAllDepartments = () => axiosInstance.get('/admin/departments')

export const addDepartment = departmentData => axiosInstance.post('/admin/departments', departmentData)

/** Slot length, working hours/days, booking window and cancel/reschedule cutoff. */
export const updateSlotSettings = settings => axiosInstance.put('/admin/settings/slots', settings)

/** Audit log; params: { action, from, to, q, limit } (all optional). */
export const getAuditLogs = (params = {}) => axiosInstance.get(ENDPOINTS.ADMIN_AUDIT(params))

export const getAdminDashboard = () => axiosInstance.get(ENDPOINTS.ADMIN_DASHBOARD)

/** New temporary password for a user; they must change it at next login. */
export const resetUserPassword = userId => axiosInstance.post(ENDPOINTS.USER_RESET_PASSWORD(userId))

export const getAllUsers = () => axiosInstance.get('/users')

/** Create a user of any role; the response is { user, temporaryPassword }. */
export const createUser = userData => axiosInstance.post('/users', userData)

/** status: ACTIVE | SUSPENDED | DEACTIVATED */
export const updateUserStatus = (userId, status) => axiosInstance.patch(`/users/${userId}/status`, { status })

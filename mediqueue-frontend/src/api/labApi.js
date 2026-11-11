import axiosInstance from './axiosInstance'
import { ENDPOINTS } from './endpoints'

/** Lab technician: find appointments by appointment ID, patient ID or patient name. */
export const searchLabAppointments = (q) => axiosInstance.get(ENDPOINTS.LAB_SEARCH(q))

/** formData: appointmentId, reportType, file, remarks (optional). */
export const uploadLabReport = (formData) =>
  axiosInstance.post(ENDPOINTS.LAB_UPLOAD, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

export const getLabReportsByAppointment = (appointmentId) =>
  axiosInstance.get(ENDPOINTS.LAB_BY_APPOINTMENT(appointmentId))

export const getLabReportsByPatient = (patientId) =>
  axiosInstance.get(ENDPOINTS.LAB_BY_PATIENT(patientId))

export const getAllLabReports = () => axiosInstance.get(ENDPOINTS.LAB_ALL)

/** Same checks as the server, so a wrong file is caught before uploading. */
export const LAB_MAX_BYTES = 10 * 1024 * 1024
export function checkLabFile(file) {
  if (!file) return 'Choose a file to upload.'
  const ext = (file.name.split('.').pop() || '').toLowerCase()
  if (!['pdf', 'png', 'jpg', 'jpeg'].includes(ext)) return 'Only PDF, PNG and JPEG files can be uploaded.'
  if (file.size === 0) return 'The file is empty.'
  if (file.size > LAB_MAX_BYTES) return 'The file is too large (maximum 10 MB).'
  return ''
}

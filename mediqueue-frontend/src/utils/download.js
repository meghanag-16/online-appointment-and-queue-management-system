import axiosInstance from '../api/axiosInstance'
import { ENDPOINTS } from '../api/endpoints'

/**
 * Downloads a lab report through the API client (so the login token is sent) and saves it
 * under its original file name.
 */
export async function downloadLabReport(report) {
  const res = await axiosInstance.get(ENDPOINTS.LAB_DOWNLOAD(report.reportId), { responseType: 'blob' })
  const url = URL.createObjectURL(res.data)
  const a = document.createElement('a')
  a.href = url
  a.download = report.fileName || `report-${report.reportId}`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function formatFileSize(bytes) {
  if (bytes == null) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

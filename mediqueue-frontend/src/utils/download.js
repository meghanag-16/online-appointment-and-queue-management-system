import axiosInstance from '../api/axiosInstance'
import { ENDPOINTS } from '../api/endpoints'

/**
 * Downloads a lab report through the API client (so the login token is sent) and saves it
 * under its original file name.
 */
export async function downloadLabReport(report) {
  let res
  try {
    res = await axiosInstance.get(ENDPOINTS.LAB_DOWNLOAD(report.reportId), { responseType: 'blob' })
  } catch (err) {
    // With responseType 'blob' the JSON error body arrives as a Blob; read it so the real reason is shown.
    const body = err.response?.data
    if (body && typeof body.text === 'function') {
      try { err.response.data = JSON.parse(await body.text()) } catch { /* not JSON: keep the generic message */ }
    }
    throw err
  }
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

import axiosInstance from './axiosInstance'
import { ENDPOINTS } from './endpoints'

/** { issueType, description, appointmentId?, billId? } */
export const raiseComplaint = (complaintData) => axiosInstance.post(ENDPOINTS.COMPLAINTS, complaintData)

export const getMyComplaints = () => axiosInstance.get(ENDPOINTS.COMPLAINTS_MINE)

export const getAllComplaints = (status = '') => axiosInstance.get(ENDPOINTS.COMPLAINTS_ALL(status))

/** status: UNDER_REVIEW | RESOLVED; a note is required to resolve. */
export const updateComplaintStatus = (complaintId, status, note) =>
  axiosInstance.patch(ENDPOINTS.COMPLAINT_STATUS(complaintId), { status, note })

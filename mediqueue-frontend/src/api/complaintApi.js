import axiosInstance from './axiosInstance';

export const raiseComplaint = (complaintData) =>
  axiosInstance.post('/complaints', complaintData);

export const getAllComplaints = () =>
  axiosInstance.get('/complaints/all');

export const getComplaintById = (complaintId) =>
  axiosInstance.get(`/complaints/${complaintId}`);

export const resolveComplaint = (complaintId, resolution) =>
  axiosInstance.put(`/complaints/${complaintId}/resolve`, { resolution });
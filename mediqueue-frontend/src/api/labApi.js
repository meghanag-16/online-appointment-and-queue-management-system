import axiosInstance from './axiosInstance';

export const uploadLabReport = (formData) =>
  axiosInstance.post('/lab/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const getLabReportsByAppointment = (appointmentId) =>
  axiosInstance.get(`/lab/appointment/${appointmentId}`);

export const getAllLabReports = () =>
  axiosInstance.get('/lab/all');
import axiosInstance from './axiosInstance';

export const getNotificationsByUser = (userId) =>
  axiosInstance.get(`/notifications/user/${userId}`);

export const markNotificationAsRead = (notificationId) =>
  axiosInstance.put(`/notifications/${notificationId}/read`);

export const getAllNotifications = () =>
  axiosInstance.get('/notifications/all');
import axiosInstance from './axiosInstance'
import { ENDPOINTS } from './endpoints'

/** The logged-in user's latest notifications: { unreadCount, items }. */
export const getMyNotifications = (limit = 20) => axiosInstance.get(ENDPOINTS.NOTIFICATIONS_MINE(limit))

export const markNotificationAsRead = id => axiosInstance.patch(ENDPOINTS.NOTIFICATION_READ(id))

export const markAllNotificationsRead = () => axiosInstance.patch(ENDPOINTS.NOTIFICATIONS_READ_ALL)

/** Administrator: { userId } or { role }, plus message. */
export const sendAlert = payload => axiosInstance.post(ENDPOINTS.NOTIFICATION_ALERT, payload)

/** Administrator: send due appointment reminders now. */
export const runReminders = () => axiosInstance.post(ENDPOINTS.REMINDERS_RUN)

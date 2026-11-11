import axiosInstance from './axiosInstance'
import { ENDPOINTS } from './endpoints'

// Auth calls go through the shared axiosInstance (same base URL, token and error handling
// as every other request) instead of a separate axios client pointing at localhost:8080.

export const loginUser = data => axiosInstance.post(ENDPOINTS.LOGIN, data)

export const registerUser = data => axiosInstance.post(ENDPOINTS.REGISTER, data)

export const getCurrentUser = () => axiosInstance.get(ENDPOINTS.ME)

/** Public list of departments, used by the doctor fields of the sign-up form. */
export const getPublicDepartments = () => axiosInstance.get(ENDPOINTS.DEPARTMENTS)

/**
 * Maps each role to its default landing page after login.
 */
export const ROLE_HOME = {
  PATIENT:        '/patient/dashboard',
  DOCTOR:         '/doctor/dashboard',
  LAB_TECHNICIAN: '/lab/dashboard',
  RECEPTIONIST:   '/receptionist/dashboard',
  ADMINISTRATOR:  '/admin/dashboard',
}

/**
 * Returns the home route for a given role string.
 */
export function getHomeForRole(role) {
  return ROLE_HOME[role] || '/login'
}

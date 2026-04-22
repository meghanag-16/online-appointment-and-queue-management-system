export const ENDPOINTS = {
  // Auth
  REGISTER: '/auth/register',
  LOGIN:    '/auth/login',

  // Appointments
  APPOINTMENTS:            '/appointments',
  APPOINTMENT_BY_ID:       (id)  => `/appointments/${id}`,
  APPOINTMENTS_BY_PATIENT: (pid) => `/appointments/patient/${pid}`,
  APPOINTMENTS_BY_DOCTOR:  (did) => `/appointments/doctor/${did}`,
  APPOINTMENTS_ALL:        (date) => date ? `/appointments/all?date=${date}` : '/appointments/all',
  APPOINTMENTS_STATS:      '/appointments/stats',
  CANCEL_APPOINTMENT:      (id)  => `/appointments/${id}/cancel`,
  UPDATE_STATUS:           (id)  => `/appointments/${id}/status`,

  // Billing
  GENERATE_BILL:    (apptId, type) => `/billing/generate/${apptId}?billingType=${type}`,
  BILL_BY_APPT:     (apptId)       => `/billing/appointment/${apptId}`,
  BILL_BY_PATIENT:  (pid)          => `/billing/patient/${pid}`,
  UPDATE_PAYMENT:   (billId)       => `/billing/${billId}/payment`,

  // Doctors
  DOCTORS:        '/doctors',
  DOCTOR_BY_ID:   (id) => `/doctors/${id}`,
  DOCTORS_SEARCH: (q)  => `/doctors/search?q=${encodeURIComponent(q)}`,
  DOCTOR_SLOTS:   (id) => `/doctors/${id}/slots`,

  // Departments
  DEPARTMENTS: '/departments',
}

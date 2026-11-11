export const ENDPOINTS = {
  // Auth
  REGISTER: '/auth/register',
  LOGIN:    '/auth/login',
  ME:       '/auth/me',
  ME_PASSWORD: '/auth/me/password',

  // Appointments
  APPOINTMENTS:            '/appointments',
  APPOINTMENT_BY_ID:       (id)  => `/appointments/${id}`,
  APPOINTMENTS_BY_PATIENT: (pid) => `/appointments/patient/${pid}`,
  APPOINTMENTS_BY_DOCTOR:  (did) => `/appointments/doctor/${did}`,
  APPOINTMENTS_ALL:        (date) => date ? `/appointments/all?date=${date}` : '/appointments/all',
  APPOINTMENTS_STATS:      '/appointments/stats',
  CANCEL_APPOINTMENT:      (id)  => `/appointments/${id}/cancel`,
  UPDATE_STATUS:           (id)  => `/appointments/${id}/status`,
  RESCHEDULE_APPOINTMENT:  (id)  => `/appointments/${id}/reschedule`,

  // Billing
  GENERATE_BILL:    (apptId, type) => `/billing/generate/${apptId}?billingType=${type}`,
  BILL_BY_APPT:     (apptId)       => `/billing/appointment/${apptId}`,
  BILL_BY_PATIENT:  (pid)          => `/billing/patient/${pid}`,
  UPDATE_PAYMENT:   (billId)       => `/billing/${billId}/payment`,

  // Doctors
  DOCTORS:        '/doctors',
  DOCTOR_BY_ID:   (id) => `/doctors/${id}`,
  DOCTORS_SEARCH: (q = '', departmentId = '', date = '') => {
    const p = new URLSearchParams()
    if (q) p.set('q', q)
    if (departmentId) p.set('departmentId', departmentId)
    if (date) p.set('date', date)
    const qs = p.toString()
    return qs ? `/doctors/search?${qs}` : '/doctors/search'
  },
  DOCTOR_SLOTS:   (id, date) => date ? `/doctors/${id}/slots?date=${date}` : `/doctors/${id}/slots`,

  // Patients (front desk picker)
  PATIENT_SEARCH: (q) => `/patient/search?q=${encodeURIComponent(q)}`,

  // Slot settings
  SLOT_SETTINGS: '/settings/slots',

  // Departments (public list, used by the sign-up form)
  DEPARTMENTS: '/departments',

  // Users (administrator)
  USERS:            '/users',
  USER_STATUS:      (id) => `/users/${id}/status`,
}

export const ENDPOINTS = {
  // Auth
  REGISTER: '/auth/register',
  LOGIN: '/auth/login',
  ME: '/auth/me',
  ME_PASSWORD: '/auth/me/password',

  // Appointments
  APPOINTMENTS: '/appointments',
  APPOINTMENTS_BY_PATIENT: pid => `/appointments/patient/${pid}`,
  APPOINTMENTS_BY_DOCTOR: did => `/appointments/doctor/${did}`,
  APPOINTMENTS_ALL: date => (date ? `/appointments/all?date=${date}` : '/appointments/all'),
  APPOINTMENTS_STATS: '/appointments/stats',
  CANCEL_APPOINTMENT: id => `/appointments/${id}/cancel`,
  UPDATE_STATUS: id => `/appointments/${id}/status`,
  RESCHEDULE_APPOINTMENT: id => `/appointments/${id}/reschedule`,
  APPOINTMENT_PRIORITY: id => `/appointments/${id}/priority`,

  // Billing
  BILL_BY_PATIENT: pid => `/billing/patient/${pid}`,
  UPDATE_PAYMENT: billId => `/billing/${billId}/payment`,
  BILLS_ALL: (status = '', q = '') => {
    const p = new URLSearchParams()
    if (status) p.set('status', status)
    if (q) p.set('q', q)
    const qs = p.toString()
    return qs ? `/billing/all?${qs}` : '/billing/all'
  },

  // Lab reports
  LAB_SEARCH: q => `/lab/appointments?q=${encodeURIComponent(q)}`,
  LAB_UPLOAD: '/lab/upload',
  LAB_BY_APPOINTMENT: aid => `/lab/appointment/${aid}`,
  LAB_BY_PATIENT: pid => `/lab/patient/${pid}`,
  LAB_ALL: '/lab/all',
  LAB_DOWNLOAD: rid => `/lab/reports/${rid}/download`,

  // Notifications (every user: their own)
  NOTIFICATIONS_MINE: (limit = 20) => `/notifications/mine?limit=${limit}`,
  NOTIFICATION_READ: id => `/notifications/${id}/read`,
  NOTIFICATIONS_READ_ALL: '/notifications/mine/read-all',
  NOTIFICATION_ALERT: '/notifications/alert',
  REMINDERS_RUN: '/notifications/reminders/run',

  // Complaints
  COMPLAINTS: '/complaints',
  COMPLAINTS_MINE: '/complaints/mine',
  COMPLAINTS_ALL: (status = '') => (status ? `/complaints/all?status=${status}` : '/complaints/all'),
  COMPLAINT_STATUS: id => `/complaints/${id}/status`,

  // Doctors
  DOCTORS_SEARCH: (q = '', departmentId = '', date = '') => {
    const p = new URLSearchParams()
    if (q) p.set('q', q)
    if (departmentId) p.set('departmentId', departmentId)
    if (date) p.set('date', date)
    const qs = p.toString()
    return qs ? `/doctors/search?${qs}` : '/doctors/search'
  },
  DOCTOR_SLOTS: (id, date) => (date ? `/doctors/${id}/slots?date=${date}` : `/doctors/${id}/slots`),

  // Virtual queue
  QUEUE: (doctorId, date) => (date ? `/queue/doctor/${doctorId}?date=${date}` : `/queue/doctor/${doctorId}`),
  QUEUE_CALL_NEXT: doctorId => `/queue/doctor/${doctorId}/call-next`,
  QUEUE_START: queueId => `/queue/entries/${queueId}/start`,
  QUEUE_FINISH: queueId => `/queue/entries/${queueId}/finish`,
  QUEUE_NO_SHOW: queueId => `/queue/entries/${queueId}/no-show`,
  QUEUE_POSITION: queueId => `/queue/entries/${queueId}/position`,

  // Clinical
  PATIENT_HISTORY: pid => `/patient/history/${pid}`,
  PATIENT_RECORDS: pid => `/patient/records/${pid}`,
  PRESCRIPTIONS: '/prescriptions',
  PRESCRIPTIONS_BY_PATIENT: pid => `/prescriptions/patient/${pid}`,
  PRESCRIPTIONS_BY_DOCTOR: did => `/prescriptions/doctor/${did}`,

  // Patients (front desk picker)
  PATIENT_SEARCH: q => `/patient/search?q=${encodeURIComponent(q)}`,

  // Slot settings
  SLOT_SETTINGS: '/settings/slots',

  // Departments (public list, used by the sign-up form)
  DEPARTMENTS: '/departments',

  // Users (administrator)
  USER_RESET_PASSWORD: id => `/users/${id}/reset-password`,
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_AUDIT: (params = {}) => {
    const p = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => {
      if (v) p.set(k, v)
    })
    const qs = p.toString()
    return qs ? `/admin/audit?${qs}` : '/admin/audit'
  },
}

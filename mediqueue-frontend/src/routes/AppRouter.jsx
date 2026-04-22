import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getHomeForRole } from '../utils/roleRoutes'

// Auth pages
import LoginPage    from '../pages/auth/LoginPage'
import RegisterPage from '../pages/auth/RegisterPage'

// Patient pages
import PatientDashboard    from '../pages/patient/PatientDashboard'
import PatientAppointments from '../pages/patient/PatientAppointments'
import BookAppointment     from '../pages/patient/BookAppointment'
import PatientDoctorSearch from '../pages/patient/PatientDoctorSearch'
import PatientBilling      from '../pages/patient/PatientBilling'
import PatientRecords      from '../pages/patient/PatientRecords'
import PatientComplaints   from '../pages/patient/PatientComplaints'

// Doctor pages
import DoctorDashboard    from '../pages/doctor/DoctorDashboard'
import DoctorAppointments from '../pages/doctor/DoctorAppointments'
import DoctorQueue        from '../pages/doctor/DoctorQueue'
import DoctorPrescriptions from '../pages/doctor/DoctorPrescriptions'

// Lab Technician pages
import LabDashboard from '../pages/labtechnician/LabDashboard'
import LabReports   from '../pages/labtechnician/LabReports'

// Receptionist pages
import ReceptionistDashboard    from '../pages/receptionist/ReceptionistDashboard'
import ReceptionistAppointments from '../pages/receptionist/ReceptionistAppointments'

// Admin pages
import AdminDashboard  from '../pages/admin/AdminDashboard'
import AdminUsers      from '../pages/admin/AdminUsers'
import AdminDoctors    from '../pages/admin/AdminDoctors'
import AdminDepartments from '../pages/admin/AdminDepartments'
import AdminComplaints  from '../pages/admin/AdminComplaints'

// Shared
import NotFound      from '../pages/shared/NotFound'
import Unauthorized  from '../pages/shared/Unauthorized'

/** Redirects to login if not authenticated, or to Unauthorized if role not allowed */
function PrivateRoute({ children, allowedRoles }) {
  const { user, isAuthenticated } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/unauthorized" replace />
  }
  return children
}

export default function AppRouter() {
  const { user, isAuthenticated } = useAuth()

  return (
    <BrowserRouter>
      <Routes>
        {/* Root redirect */}
        <Route
          path="/"
          element={
            isAuthenticated
              ? <Navigate to={getHomeForRole(user?.role)} replace />
              : <Navigate to="/login" replace />
          }
        />

        {/* Auth */}
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Patient */}
        <Route path="/patient/dashboard"   element={<PrivateRoute allowedRoles={['PATIENT']}><PatientDashboard /></PrivateRoute>} />
        <Route path="/patient/appointments" element={<PrivateRoute allowedRoles={['PATIENT']}><PatientAppointments /></PrivateRoute>} />
        <Route path="/patient/book"         element={<PrivateRoute allowedRoles={['PATIENT']}><BookAppointment /></PrivateRoute>} />
        <Route path="/patient/doctors"      element={<PrivateRoute allowedRoles={['PATIENT']}><PatientDoctorSearch /></PrivateRoute>} />
        <Route path="/patient/billing"      element={<PrivateRoute allowedRoles={['PATIENT']}><PatientBilling /></PrivateRoute>} />
        <Route path="/patient/records"      element={<PrivateRoute allowedRoles={['PATIENT']}><PatientRecords /></PrivateRoute>} />
        <Route path="/patient/complaints"   element={<PrivateRoute allowedRoles={['PATIENT']}><PatientComplaints /></PrivateRoute>} />

        {/* Doctor */}
        <Route path="/doctor/dashboard"     element={<PrivateRoute allowedRoles={['DOCTOR']}><DoctorDashboard /></PrivateRoute>} />
        <Route path="/doctor/appointments"  element={<PrivateRoute allowedRoles={['DOCTOR']}><DoctorAppointments /></PrivateRoute>} />
        <Route path="/doctor/queue"         element={<PrivateRoute allowedRoles={['DOCTOR']}><DoctorQueue /></PrivateRoute>} />
        <Route path="/doctor/prescriptions" element={<PrivateRoute allowedRoles={['DOCTOR']}><DoctorPrescriptions /></PrivateRoute>} />

        {/* Lab Technician */}
        <Route path="/lab/dashboard" element={<PrivateRoute allowedRoles={['LAB_TECHNICIAN']}><LabDashboard /></PrivateRoute>} />
        <Route path="/lab/reports"   element={<PrivateRoute allowedRoles={['LAB_TECHNICIAN']}><LabReports /></PrivateRoute>} />

        {/* Receptionist */}
        <Route path="/receptionist/dashboard"    element={<PrivateRoute allowedRoles={['RECEPTIONIST']}><ReceptionistDashboard /></PrivateRoute>} />
        <Route path="/receptionist/appointments" element={<PrivateRoute allowedRoles={['RECEPTIONIST']}><ReceptionistAppointments /></PrivateRoute>} />

        {/* Admin */}
        <Route path="/admin/dashboard"   element={<PrivateRoute allowedRoles={['ADMINISTRATOR']}><AdminDashboard /></PrivateRoute>} />
        <Route path="/admin/users"       element={<PrivateRoute allowedRoles={['ADMINISTRATOR']}><AdminUsers /></PrivateRoute>} />
        <Route path="/admin/doctors"     element={<PrivateRoute allowedRoles={['ADMINISTRATOR']}><AdminDoctors /></PrivateRoute>} />
        <Route path="/admin/departments" element={<PrivateRoute allowedRoles={['ADMINISTRATOR']}><AdminDepartments /></PrivateRoute>} />
        <Route path="/admin/complaints"  element={<PrivateRoute allowedRoles={['ADMINISTRATOR']}><AdminComplaints /></PrivateRoute>} />

        {/* Shared */}
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="*"             element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}

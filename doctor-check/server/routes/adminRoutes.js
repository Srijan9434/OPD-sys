import { Router } from 'express'
import { protect, authorize } from '../middleware/auth.js'
import {
  getAdminDashboard,
  getAdminAnalytics,
  getLiveQueue,
  getPatients,
  getPatientDetails,
  createPatient,
  togglePatientStatus,
  getDoctors,
  createDoctor,
  updateDoctor,
  toggleDoctorStatus,
  getAppointments,
  adminCancelAppointment,
  adminRescheduleAppointment,
  getAdminSpecialities,
  createSpeciality,
  updateSpeciality,
  deleteSpeciality,
} from '../controllers/adminController.js'

const router = Router()

// Strict admin authorization: all endpoints require a valid JWT and role === 'admin'
router.use(protect, authorize('admin'))

// Overview & Operations
router.get('/dashboard', getAdminDashboard)
router.get('/analytics', getAdminAnalytics)
router.get('/queue', getLiveQueue)

// Patients
router.get('/patients', getPatients)
router.post('/patients', createPatient)
router.get('/patients/:id', getPatientDetails)
router.put('/patients/:id/status', togglePatientStatus)

// Doctors
router.get('/doctors', getDoctors)
router.post('/doctors', createDoctor)
router.put('/doctors/:id', updateDoctor)
router.put('/doctors/:id/status', toggleDoctorStatus)

// Appointments
router.get('/appointments', getAppointments)
router.put('/appointments/:id/cancel', adminCancelAppointment)
router.put('/appointments/:id/reschedule', adminRescheduleAppointment)

// Specialities
router.get('/specialities', getAdminSpecialities)
router.post('/specialities', createSpeciality)
router.put('/specialities/:id', updateSpeciality)
router.delete('/specialities/:id', deleteSpeciality)

export default router

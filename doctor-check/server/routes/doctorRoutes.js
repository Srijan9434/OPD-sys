import express from 'express'
import { protect, authorize } from '../middleware/auth.js'
import {
  getDoctorDashboard,
  getDoctorAppointments,
  updateAppointmentStatus,
  addPrescription,
  markPaymentPaid,
  updateAvailability,
  getPatientHistory,
  triggerEmergencyLeave,
} from '../controllers/doctorController.js'

const router = express.Router()

// All routes require doctor role authorization
router.use(protect, authorize('doctor'))

router.get('/dashboard', getDoctorDashboard)
router.get('/appointments', getDoctorAppointments)
router.put('/appointments/:id/status', updateAppointmentStatus)
router.post('/appointments/:id/prescription', addPrescription)
router.put('/appointments/:id/payment', markPaymentPaid)
router.put('/availability', updateAvailability)
router.get('/patients/:patientId/history', getPatientHistory)
router.post('/emergency-leave', triggerEmergencyLeave)

export default router

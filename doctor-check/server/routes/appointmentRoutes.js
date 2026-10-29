import { Router } from 'express'
import { protect } from '../middleware/auth.js'
import {
  bookAppointment,
  getMyAppointments,
  cancelAppointment,
  rescheduleAppointment,
  getBookedSlots,
  getAppointmentPrescription,
} from '../controllers/appointmentController.js'

const router = Router()

// Public booked slots lookup for interactive slot pickers
router.get('/booked-slots/:doctorId', getBookedSlots)

// All patient appointment operations require authentication
router.use(protect)

router.post('/', bookAppointment)
router.get('/my', getMyAppointments)
router.get('/:id/prescription', getAppointmentPrescription)
router.put('/:id/cancel', cancelAppointment)
router.put('/:id/reschedule', rescheduleAppointment)

export default router

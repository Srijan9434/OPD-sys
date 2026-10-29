import mongoose from 'mongoose'
import Appointment from '../models/Appointments.js'
import Doctor from '../models/Doctor.js'

// POST /api/appointments
export const bookAppointment = async (req, res) => {
  try {
    const { doctorId, doctor: docParam, date, slot, reason, paymentMode } = req.body
    const targetDocId = doctorId || docParam

    if (!targetDocId) {
      return res.status(400).json({ success: false, message: 'Doctor ID is required' })
    }

    if (!mongoose.isValidObjectId(targetDocId)) {
      return res.status(400).json({ success: false, message: 'Invalid doctor ID format' })
    }

    if (!date || !slot) {
      return res.status(400).json({ success: false, message: 'Appointment date and slot are required' })
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ success: false, message: 'Date must be in YYYY-MM-DD format' })
    }

    const todayStr = new Date().toISOString().split('T')[0]
    if (date < todayStr) {
      return res.status(400).json({ success: false, message: 'Cannot book appointments for past dates' })
    }

    const doc = await Doctor.findById(targetDocId)
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Doctor not found' })
    }

    if (!doc.available) {
      return res.status(400).json({ success: false, message: 'Doctor is currently not available for bookings' })
    }

    if (Array.isArray(doc.slots) && doc.slots.length > 0 && !doc.slots.includes(slot)) {
      return res.status(400).json({
        success: false,
        message: `Invalid slot. Available slots are: ${doc.slots.join(', ')}`,
      })
    }

    // Check duplicate booking for the same doctor, date and slot
    const existingSlotBooking = await Appointment.findOne({
      doctor: doc._id,
      date,
      slot,
      status: { $nin: ['cancelled', 'rejected', 'doctor-unavailable'] },
    })

    if (existingSlotBooking) {
      return res.status(409).json({
        success: false,
        message: 'This slot is already booked for this doctor. Please choose a different slot or date.',
      })
    }

    // Prevent patient from double booking the exact same time slot with any doctor
    const patientConflict = await Appointment.findOne({
      patient: req.user._id,
      date,
      slot,
      status: { $nin: ['cancelled', 'rejected', 'doctor-unavailable'] },
    })

    if (patientConflict) {
      return res.status(409).json({
        success: false,
        message: 'You already have an appointment scheduled for this date and time slot.',
      })
    }

    const validPaymentModes = ['cash', 'card', 'online']
    const selectedMode = validPaymentModes.includes(paymentMode) ? paymentMode : 'cash'

    const appointment = await Appointment.create({
      patient: req.user._id,
      doctor: doc._id,
      date,
      slot,
      reason: reason ? String(reason).trim() : '',
      status: 'pending',
      payment: {
        mode: selectedMode,
        status: 'pending',
        amount: doc.fee || 0,
      },
    })

    const populated = await Appointment.findById(appointment._id)
      .populate('doctor', 'name speciality degree experience fee image about slots')
      .populate('patient', 'name email phone')

    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully',
      data: populated,
    })
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'This slot has just been booked by another patient. Please choose a different slot.',
      })
    }
    res.status(500).json({ success: false, message: err.message })
  }
}

// GET /api/appointments/booked-slots/:doctorId
export const getBookedSlots = async (req, res) => {
  try {
    const { doctorId } = req.params
    const { date } = req.query

    if (!doctorId || !date) {
      return res.status(400).json({ success: false, message: 'Doctor ID and date (YYYY-MM-DD) are required' })
    }

    const appointments = await Appointment.find({
      doctor: doctorId,
      date,
      status: { $nin: ['cancelled', 'rejected', 'doctor-unavailable'] },
    }).select('slot')

    res.json({
      success: true,
      bookedSlots: appointments.map((a) => a.slot),
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// GET /api/appointments/:id/prescription
export const getAppointmentPrescription = async (req, res) => {
  try {
    const { id } = req.params
    const appointment = await Appointment.findById(id)
      .populate('doctor', 'name speciality degree experience fee')
      .populate('patient', 'name email phone age gender')

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' })
    }

    const isPatient = appointment.patient?._id?.toString() === req.user._id.toString()
    const isDoctor = req.user.role === 'doctor'
    const isAdmin = req.user.role === 'admin'

    if (!isPatient && !isDoctor && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Access denied to this prescription' })
    }

    res.json({
      success: true,
      data: {
        appointmentId: appointment._id,
        date: appointment.date,
        slot: appointment.slot,
        doctor: appointment.doctor,
        patient: appointment.patient,
        status: appointment.status,
        prescription: appointment.prescription,
      },
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// GET /api/appointments/my
export const getMyAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({ patient: req.user._id })
      .populate('doctor', 'name speciality degree experience fee image about slots')
      .sort({ date: -1, slot: -1, createdAt: -1 })

    res.json({
      success: true,
      count: appointments.length,
      data: appointments,
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// PUT /api/appointments/:id/cancel
export const cancelAppointment = async (req, res) => {
  try {
    const { id } = req.params

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid appointment ID format' })
    }

    const appointment = await Appointment.findById(id)
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' })
    }

    // Ownership check: patient themselves or admin
    if (appointment.patient.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to cancel this appointment' })
    }

    if (['cancelled', 'rejected', 'completed'].includes(appointment.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel an appointment that is already ${appointment.status}`,
      })
    }

    appointment.status = 'cancelled'
    appointment.cancelledAt = new Date()
    appointment.cancelReason = req.body?.reason ? String(req.body.reason).trim() : 'Cancelled by patient'

    await appointment.save()

    const populated = await Appointment.findById(appointment._id)
      .populate('doctor', 'name speciality degree experience fee image about')

    res.json({
      success: true,
      message: 'Appointment cancelled successfully',
      data: populated,
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// PUT /api/appointments/:id/reschedule
export const rescheduleAppointment = async (req, res) => {
  try {
    const { id } = req.params

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid appointment ID format' })
    }

    const appointment = await Appointment.findById(id)
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' })
    }

    // Ownership check: patient themselves or admin
    if (appointment.patient.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to reschedule this appointment' })
    }

    if (['cancelled', 'rejected', 'completed'].includes(appointment.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot reschedule an appointment that is ${appointment.status}`,
      })
    }

    const { date, slot } = req.body

    if (!date || !slot) {
      return res.status(400).json({ success: false, message: 'New appointment date and slot are required' })
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ success: false, message: 'Date must be in YYYY-MM-DD format' })
    }

    const todayStr = new Date().toISOString().split('T')[0]
    if (date < todayStr) {
      return res.status(400).json({ success: false, message: 'Cannot reschedule to a past date' })
    }

    const doc = await Doctor.findById(appointment.doctor)
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Associated doctor not found' })
    }

    if (!doc.available) {
      return res.status(400).json({ success: false, message: 'Doctor is currently not available for bookings' })
    }

    if (Array.isArray(doc.slots) && doc.slots.length > 0 && !doc.slots.includes(slot)) {
      return res.status(400).json({
        success: false,
        message: `Invalid slot. Available slots are: ${doc.slots.join(', ')}`,
      })
    }

    // Check conflict with other appointments for the doctor
    const conflict = await Appointment.findOne({
      _id: { $ne: appointment._id },
      doctor: appointment.doctor,
      date,
      slot,
      status: { $in: ['pending', 'confirmed'] },
    })

    if (conflict) {
      return res.status(409).json({
        success: false,
        message: 'The requested slot is already booked for this doctor. Please choose a different slot.',
      })
    }

    // Update appointment
    appointment.rescheduledFrom = {
      date: appointment.date,
      slot: appointment.slot,
    }
    appointment.date = date
    appointment.slot = slot
    appointment.status = 'pending'

    await appointment.save()

    const populated = await Appointment.findById(appointment._id)
      .populate('doctor', 'name speciality degree experience fee image about')

    res.json({
      success: true,
      message: 'Appointment rescheduled successfully',
      data: populated,
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

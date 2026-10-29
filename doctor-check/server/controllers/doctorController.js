import Appointment from '../models/Appointments.js'
import Doctor from '../models/Doctor.js'
import User from '../models/User.js'

// Helper to safely load or mock sendEmail if not yet implemented by Srijan
const sendEmailSafely = async (options) => {
  try {
    const { default: sendEmail } = await import('../utils/sendEmail.js')
    return await sendEmail(options)
  } catch (err) {
    console.log(`[Email Notification] (simulated - sendEmail.js pending): To: ${options.to}, Subject: ${options.subject}`)
    return true
  }
}

// Helper to get doctor profile for logged-in user
const getDoctorForUser = async (userId) => {
  return await Doctor.findOne({ user: userId })
}

// 1. GET /api/doctor/dashboard
export const getDoctorDashboard = async (req, res) => {
  try {
    const doctor = await getDoctorForUser(req.user._id)
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found' })
    }

    const todayStr = new Date().toISOString().split('T')[0]

    // Fetch all doctor appointments
    const appointments = await Appointment.find({ doctor: doctor._id })
      .populate('patient', 'name email phone gender image')
      .sort({ date: 1, slot: 1 })

    const totalAppointments = appointments.length
    const completedAppointments = appointments.filter((a) => a.status === 'completed').length
    const pendingAppointments = appointments.filter((a) => a.status === 'pending' || a.status === 'confirmed').length
    
    // Earnings from paid appointments
    const totalEarnings = appointments
      .filter((a) => a.payment && a.payment.status === 'paid')
      .reduce((acc, curr) => acc + (curr.payment.amount || doctor.fee || 0), 0)

    // Today's appointments queue
    const todayAppointments = appointments.filter((a) => a.date === todayStr)

    res.json({
      success: true,
      data: {
        doctor,
        stats: {
          totalAppointments,
          completedAppointments,
          pendingAppointments,
          totalEarnings,
          todayCount: todayAppointments.length,
        },
        todayAppointments,
        recentAppointments: appointments.slice(0, 10),
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// 2. GET /api/doctor/appointments
export const getDoctorAppointments = async (req, res) => {
  try {
    const doctor = await getDoctorForUser(req.user._id)
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found' })
    }

    const { status, date } = req.query
    const query = { doctor: doctor._id }

    if (status) query.status = status
    if (date) query.date = date

    const appointments = await Appointment.find(query)
      .populate('patient', 'name email phone gender image')
      .sort({ date: -1, createdAt: -1 })

    res.json({ success: true, data: appointments })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// 3. PUT /api/doctor/appointments/:id/status (confirmed | rejected | completed)
export const updateAppointmentStatus = async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body

    const allowed = ['confirmed', 'rejected', 'completed', 'cancelled', 'waiting', 'in-consultation']
    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, message: `Invalid status. Allowed: ${allowed.join(', ')}` })
    }

    const doctor = await getDoctorForUser(req.user._id)
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found' })
    }

    const appointment = await Appointment.findOne({ _id: id, doctor: doctor._id }).populate('patient', 'name email')
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' })
    }

    appointment.status = status
    if (status === 'rejected' || status === 'cancelled') {
      appointment.cancelledAt = new Date()
      if (req.body.cancelReason) {
        appointment.cancelReason = req.body.cancelReason
      }
    }

    await appointment.save()

    res.json({ success: true, data: appointment, message: `Appointment status updated to ${status}` })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// 4. POST /api/doctor/appointments/:id/prescription
export const addPrescription = async (req, res) => {
  try {
    const { id } = req.params
    const { symptoms, diagnosis, treatment, medicines, notes, followUpDate } = req.body

    const doctor = await getDoctorForUser(req.user._id)
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found' })
    }

    const appointment = await Appointment.findOne({ _id: id, doctor: doctor._id })
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' })
    }

    // Save full prescription / consultation record into appointment schema
    appointment.prescription = {
      symptoms: symptoms ? String(symptoms).trim() : '',
      diagnosis: diagnosis ? String(diagnosis).trim() : '',
      treatment: treatment ? String(treatment).trim() : '',
      medicines: Array.isArray(medicines) ? medicines : [],
      notes: notes ? String(notes).trim() : '',
      followUpDate: followUpDate ? String(followUpDate).trim() : '',
      createdAt: new Date(),
    }
    appointment.status = 'completed'

    await appointment.save()

    const populated = await Appointment.findById(appointment._id)
      .populate('patient', 'name email phone age gender')
      .populate('doctor', 'name speciality fee')

    res.json({ success: true, data: populated, message: 'Prescription & consultation saved successfully' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// 5. PUT /api/doctor/appointments/:id/payment (mark cash as paid)
export const markPaymentPaid = async (req, res) => {
  try {
    const { id } = req.params

    const doctor = await getDoctorForUser(req.user._id)
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found' })
    }

    const appointment = await Appointment.findOne({ _id: id, doctor: doctor._id })
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' })
    }

    appointment.payment = {
      ...appointment.payment,
      mode: appointment.payment?.mode || 'cash',
      status: 'paid',
      amount: appointment.payment?.amount || doctor.fee,
      paidAt: new Date(),
    }

    await appointment.save()

    res.json({ success: true, data: appointment, message: 'Payment marked as paid' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// 6. PUT /api/doctor/availability
export const updateAvailability = async (req, res) => {
  try {
    const { available, slots, fee, about } = req.body

    const doctor = await getDoctorForUser(req.user._id)
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found' })
    }

    if (available !== undefined) doctor.available = available
    if (slots && Array.isArray(slots)) doctor.slots = slots
    if (fee !== undefined) doctor.fee = fee
    if (about !== undefined) doctor.about = about

    await doctor.save()

    res.json({ success: true, data: doctor, message: 'Doctor settings updated successfully' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// 7. GET /api/doctor/patients/:patientId/history
export const getPatientHistory = async (req, res) => {
  try {
    const { patientId } = req.params

    const doctor = await getDoctorForUser(req.user._id)
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found' })
    }

    const patient = await User.findById(patientId).select('-password')
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' })
    }

    // Past appointments for this doctor + patient
    const appointments = await Appointment.find({ patient: patientId, doctor: doctor._id })
      .sort({ date: -1, createdAt: -1 })

    res.json({
      success: true,
      data: {
        patient,
        appointments,
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// 8. POST /api/doctor/emergency-leave
export const triggerEmergencyLeave = async (req, res) => {
  try {
    const { startDate, endDate, reason } = req.body

    if (!startDate) {
      return res.status(400).json({ success: false, message: 'Start date is required' })
    }

    const doctor = await getDoctorForUser(req.user._id)
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found' })
    }

    // Determine query date range
    const dateQuery = endDate
      ? { $gte: startDate, $lte: endDate }
      : startDate

    // Find affected upcoming appointments
    const affectedAppointments = await Appointment.find({
      doctor: doctor._id,
      date: dateQuery,
      status: { $in: ['pending', 'confirmed'] },
    }).populate('patient', 'name email')

    // Mark doctor unavailable
    doctor.available = false
    await doctor.save()

    // Update affected appointments to 'doctor-unavailable'
    const updatedAppointments = []
    for (const apt of affectedAppointments) {
      apt.status = 'doctor-unavailable'
      apt.cancelledAt = new Date()
      apt.cancelReason = reason || 'Doctor Emergency Leave'
      await apt.save()
      updatedAppointments.push(apt)

      // Send email alert to patient
      if (apt.patient?.email) {
        await sendEmailSafely({
          to: apt.patient.email,
          subject: 'IMPORTANT: Doctor Emergency Leave - Appointment Cancelled',
          html: `
            <h2>Appointment Notice</h2>
            <p>Dear ${apt.patient.name},</p>
            <p>Dr. ${doctor.name} is on emergency leave on <strong>${apt.date}</strong> at <strong>${apt.slot}</strong>.</p>
            <p>Your appointment has been marked as <strong>doctor-unavailable</strong>. Please log in to your account to reschedule or book another slot.</p>
            <p>Reason: ${reason || 'Doctor emergency'}</p>
            <br/>
            <p>Best regards,<br/>OPD Health Team</p>
          `,
        })
      }
    }

    res.json({
      success: true,
      message: `Emergency leave activated. ${affectedAppointments.length} appointment(s) updated and notified.`,
      affectedCount: affectedAppointments.length,
      data: updatedAppointments,
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

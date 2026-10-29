import bcrypt from 'bcryptjs'
import mongoose from 'mongoose'
import User from '../models/User.js'
import Doctor from '../models/Doctor.js'
import Appointment from '../models/Appointments.js'
import Speciality from '../models/Speciality.js'

// GET /api/admin/dashboard
export const getAdminDashboard = async (req, res) => {
  try {
    const todayStr = new Date().toISOString().split('T')[0]

    const [
      totalPatients,
      totalDoctors,
      totalAppointments,
      todayAppointments,
      pendingAppointments,
      confirmedAppointments,
      completedAppointments,
      cancelledAppointments,
      waitingQueue,
      inConsultation,
      recentAppointments,
      specialitiesCount,
    ] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      Doctor.countDocuments(),
      Appointment.countDocuments(),
      Appointment.countDocuments({ date: todayStr }),
      Appointment.countDocuments({ status: 'pending' }),
      Appointment.countDocuments({ status: 'confirmed' }),
      Appointment.countDocuments({ status: 'completed' }),
      Appointment.countDocuments({ status: 'cancelled' }),
      Appointment.countDocuments({ date: todayStr, status: 'waiting' }),
      Appointment.countDocuments({ date: todayStr, status: 'in-consultation' }),
      Appointment.find()
        .populate('patient', 'name email phone')
        .populate('doctor', 'name speciality fee')
        .sort({ createdAt: -1 })
        .limit(6)
        .lean(),
      Speciality.countDocuments({ isActive: true }),
    ])

    // Calculate revenue collected vs pending
    const revenueAgg = await Appointment.aggregate([
      {
        $group: {
          _id: '$payment.status',
          totalAmount: { $sum: '$payment.amount' },
          count: { $sum: 1 },
        },
      },
    ])

    let totalRevenue = 0
    let pendingRevenue = 0
    revenueAgg.forEach((r) => {
      if (r._id === 'paid') totalRevenue = r.totalAmount
      else pendingRevenue += r.totalAmount
    })

    res.json({
      success: true,
      data: {
        stats: {
          totalPatients,
          totalDoctors,
          totalAppointments,
          todayAppointments,
          pendingAppointments,
          confirmedAppointments,
          completedAppointments,
          cancelledAppointments,
          waitingQueue,
          inConsultation,
          totalRevenue,
          pendingRevenue,
          specialitiesCount,
        },
        recentAppointments,
      },
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// GET /api/admin/patients
export const getPatients = async (req, res) => {
  try {
    const { q } = req.query
    const filter = { role: 'user' }

    if (q && q.trim()) {
      const term = q.trim()
      filter.$or = [
        { name: { $regex: term, $options: 'i' } },
        { email: { $regex: term, $options: 'i' } },
        { phone: { $regex: term, $options: 'i' } },
      ]
    }

    const patients = await User.find(filter)
      .select('-password -resetPasswordToken -resetPasswordExpires')
      .sort({ createdAt: -1 })
      .lean()

    res.json({
      success: true,
      count: patients.length,
      data: patients,
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// GET /api/admin/patients/:id
export const getPatientDetails = async (req, res) => {
  try {
    const { id } = req.params
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid patient ID format' })
    }

    const patient = await User.findById(id).select('-password -resetPasswordToken -resetPasswordExpires').lean()
    if (!patient || patient.role !== 'user') {
      return res.status(404).json({ success: false, message: 'Patient not found' })
    }

    const appointments = await Appointment.find({ patient: id })
      .populate('doctor', 'name speciality fee')
      .sort({ date: -1, slot: -1 })
      .lean()

    res.json({
      success: true,
      data: {
        patient,
        appointments,
      },
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// POST /api/admin/patients
export const createPatient = async (req, res) => {
  try {
    const { name, email, password, phone, age, gender } = req.body
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required' })
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' })
    }

    const normalizedEmail = String(email).trim().toLowerCase()
    const existing = await User.findOne({ email: normalizedEmail })
    if (existing) {
      return res.status(409).json({ success: false, message: 'User with this email already exists' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const patient = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      phone: phone ? String(phone).trim() : '',
      age: age ? Number(age) : undefined,
      gender: gender || '',
      role: 'user',
    })

    const cleanUser = patient.toObject()
    delete cleanUser.password

    res.status(201).json({
      success: true,
      message: 'Patient registered successfully',
      data: cleanUser,
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// PUT /api/admin/patients/:id/status
export const togglePatientStatus = async (req, res) => {
  try {
    const { id } = req.params
    const patient = await User.findById(id)
    if (!patient || patient.role !== 'user') {
      return res.status(404).json({ success: false, message: 'Patient not found' })
    }

    patient.isBlocked = !patient.isBlocked
    await patient.save()

    res.json({
      success: true,
      message: `Patient account ${patient.isBlocked ? 'deactivated' : 'activated'} successfully`,
      data: { isBlocked: patient.isBlocked },
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// GET /api/admin/doctors
export const getDoctors = async (req, res) => {
  try {
    const { q, speciality } = req.query
    const filter = {}

    if (speciality && speciality !== 'All') {
      filter.speciality = { $regex: `^${speciality.trim()}$`, $options: 'i' }
    }

    if (q && q.trim()) {
      const term = q.trim()
      filter.$or = [
        { name: { $regex: term, $options: 'i' } },
        { speciality: { $regex: term, $options: 'i' } },
      ]
    }

    const doctors = await Doctor.find(filter)
      .populate('user', 'name email phone isBlocked')
      .sort({ createdAt: -1 })
      .lean()

    res.json({
      success: true,
      count: doctors.length,
      data: doctors,
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// POST /api/admin/doctors
export const createDoctor = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      speciality,
      degree,
      experience,
      fee,
      about,
      slots,
      image,
    } = req.body

    if (!name || !email || !password || !speciality || fee === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, password, speciality, and fee are required',
      })
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' })
    }

    const normalizedEmail = String(email).trim().toLowerCase()
    const existing = await User.findOne({ email: normalizedEmail })
    if (existing) {
      return res.status(409).json({ success: false, message: 'User with this email already exists' })
    }

    const defaultSlots = [
      '8:00 am',
      '8:30 am',
      '9:00 am',
      '9:30 am',
      '10:00 am',
      '10:30 am',
      '11:00 am',
      '11:30 am',
    ]

    const parsedSlots = Array.isArray(slots) && slots.length > 0 ? slots : defaultSlots

    const hashedPassword = await bcrypt.hash(password, 10)
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      phone: phone ? String(phone).trim() : '',
      role: 'doctor',
    })

    const doctor = await Doctor.create({
      user: user._id,
      name: name.trim(),
      speciality: speciality.trim(),
      degree: degree ? degree.trim() : 'MBBS',
      experience: experience ? String(experience).trim() : '1 Year',
      fee: Number(fee) || 500,
      available: true,
      image: image ? String(image).trim() : '',
      about: about ? String(about).trim() : '',
      slots: parsedSlots,
    })

    const populated = await Doctor.findById(doctor._id).populate('user', 'name email phone isBlocked')

    res.status(201).json({
      success: true,
      message: 'Doctor account and profile created successfully',
      data: populated,
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// PUT /api/admin/doctors/:id
export const updateDoctor = async (req, res) => {
  try {
    const { id } = req.params
    const { name, speciality, degree, experience, fee, about, slots, available, image, phone } = req.body

    const doctor = await Doctor.findById(id)
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found' })
    }

    if (name) doctor.name = name.trim()
    if (speciality) doctor.speciality = speciality.trim()
    if (degree) doctor.degree = degree.trim()
    if (experience) doctor.experience = String(experience).trim()
    if (fee !== undefined) doctor.fee = Number(fee)
    if (about !== undefined) doctor.about = about.trim()
    if (available !== undefined) doctor.available = Boolean(available)
    if (image !== undefined) doctor.image = image.trim()
    if (Array.isArray(slots) && slots.length > 0) doctor.slots = slots

    await doctor.save()

    // Sync user account name and phone
    if (name || phone) {
      await User.findByIdAndUpdate(doctor.user, {
        ...(name && { name: name.trim() }),
        ...(phone && { phone: String(phone).trim() }),
      })
    }

    const updated = await Doctor.findById(id).populate('user', 'name email phone isBlocked')
    res.json({
      success: true,
      message: 'Doctor updated successfully',
      data: updated,
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// PUT /api/admin/doctors/:id/status
export const toggleDoctorStatus = async (req, res) => {
  try {
    const { id } = req.params
    const doctor = await Doctor.findById(id)
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' })
    }

    const user = await User.findById(doctor.user)
    if (user) {
      user.isBlocked = !user.isBlocked
      await user.save()
    }

    doctor.available = !user?.isBlocked
    await doctor.save()

    res.json({
      success: true,
      message: `Doctor ${user?.isBlocked ? 'deactivated' : 'activated'} successfully`,
      data: { isBlocked: user?.isBlocked, available: doctor.available },
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// GET /api/admin/appointments
export const getAppointments = async (req, res) => {
  try {
    const { status, date, doctorId, q } = req.query
    const filter = {}

    if (status && status !== 'all') {
      filter.status = status
    }

    if (date) {
      filter.date = date
    }

    if (doctorId && mongoose.isValidObjectId(doctorId)) {
      filter.doctor = doctorId
    }

    let appointments = await Appointment.find(filter)
      .populate('patient', 'name email phone')
      .populate('doctor', 'name speciality fee')
      .sort({ date: -1, slot: -1, createdAt: -1 })
      .lean()

    if (q && q.trim()) {
      const term = q.trim().toLowerCase()
      appointments = appointments.filter((apt) => {
        const patientName = apt.patient?.name?.toLowerCase() || ''
        const doctorName = apt.doctor?.name?.toLowerCase() || ''
        const reason = apt.reason?.toLowerCase() || ''
        return patientName.includes(term) || doctorName.includes(term) || reason.includes(term)
      })
    }

    res.json({
      success: true,
      count: appointments.length,
      data: appointments,
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// PUT /api/admin/appointments/:id/cancel
export const adminCancelAppointment = async (req, res) => {
  try {
    const { id } = req.params
    const { reason } = req.body

    const appointment = await Appointment.findById(id)
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' })
    }

    appointment.status = 'cancelled'
    appointment.cancelledAt = new Date()
    appointment.cancelReason = reason ? String(reason).trim() : 'Cancelled by administrator'

    await appointment.save()

    const updated = await Appointment.findById(id)
      .populate('patient', 'name email phone')
      .populate('doctor', 'name speciality fee')

    res.json({
      success: true,
      message: 'Appointment cancelled by admin',
      data: updated,
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// PUT /api/admin/appointments/:id/reschedule
export const adminRescheduleAppointment = async (req, res) => {
  try {
    const { id } = req.params
    const { date, slot } = req.body

    if (!date || !slot) {
      return res.status(400).json({ success: false, message: 'Date and slot are required' })
    }

    const appointment = await Appointment.findById(id)
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' })
    }

    // Check conflict
    const conflict = await Appointment.findOne({
      _id: { $ne: appointment._id },
      doctor: appointment.doctor,
      date,
      slot,
      status: { $nin: ['cancelled', 'rejected', 'doctor-unavailable'] },
    })

    if (conflict) {
      return res.status(409).json({ success: false, message: 'The requested slot is already booked.' })
    }

    appointment.rescheduledFrom = { date: appointment.date, slot: appointment.slot }
    appointment.date = date
    appointment.slot = slot
    appointment.status = 'confirmed'

    await appointment.save()

    const updated = await Appointment.findById(id)
      .populate('patient', 'name email phone')
      .populate('doctor', 'name speciality fee')

    res.json({
      success: true,
      message: 'Appointment rescheduled by admin',
      data: updated,
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// Speciality Management
// GET /api/admin/specialities
export const getAdminSpecialities = async (req, res) => {
  try {
    const count = await Speciality.countDocuments()
    if (count === 0) {
      const DEFAULT_SPECIALITIES = [
        { name: 'General physician', description: 'Primary healthcare and common medical conditions', icon: '🩺' },
        { name: 'Gynecologist', description: 'Women health, pregnancy, and reproductive medicine', icon: '⚕️' },
        { name: 'Dermatologist', description: 'Skin, hair, and nail health specialists', icon: '✨' },
        { name: 'Pediatricians', description: 'Infant, child, and adolescent medical care', icon: '👶' },
        { name: 'Neurologist', description: 'Brain, spinal cord, and nervous system disorders', icon: '🧠' },
        { name: 'Gastroenterologist', description: 'Digestive tract, liver, and stomach disorders', icon: '🥗' },
        { name: 'Cardiology', description: 'Heart and cardiovascular system care', icon: '❤️' },
        { name: 'Orthopaedics', description: 'Bones, joints, ligaments, and muscular conditions', icon: '🦴' },
      ]
      await Speciality.insertMany(DEFAULT_SPECIALITIES)
    }

    const specialities = await Speciality.find().sort({ name: 1 }).lean()

    // Add count of doctors in each speciality
    const enhanced = await Promise.all(
      specialities.map(async (spec) => {
        const doctorCount = await Doctor.countDocuments({
          speciality: { $regex: `^${spec.name}$`, $options: 'i' },
        })
        return { ...spec, doctorCount }
      })
    )

    res.json({
      success: true,
      count: enhanced.length,
      data: enhanced,
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// POST /api/admin/specialities
export const createSpeciality = async (req, res) => {
  try {
    const { name, description, icon } = req.body
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Speciality name is required' })
    }

    const existing = await Speciality.findOne({ name: { $regex: `^${name.trim()}$`, $options: 'i' } })
    if (existing) {
      return res.status(409).json({ success: false, message: 'Speciality already exists' })
    }

    const spec = await Speciality.create({
      name: name.trim(),
      description: description ? description.trim() : '',
      icon: icon ? icon.trim() : '🩺',
      isActive: true,
    })

    res.status(201).json({
      success: true,
      message: 'Speciality created successfully',
      data: spec,
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// PUT /api/admin/specialities/:id
export const updateSpeciality = async (req, res) => {
  try {
    const { id } = req.params
    const { name, description, icon, isActive } = req.body

    const spec = await Speciality.findById(id)
    if (!spec) {
      return res.status(404).json({ success: false, message: 'Speciality not found' })
    }

    if (name) spec.name = name.trim()
    if (description !== undefined) spec.description = description.trim()
    if (icon) spec.icon = icon.trim()
    if (isActive !== undefined) spec.isActive = Boolean(isActive)

    await spec.save()

    res.json({
      success: true,
      message: 'Speciality updated successfully',
      data: spec,
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// DELETE /api/admin/specialities/:id (Safe toggle or deletion)
export const deleteSpeciality = async (req, res) => {
  try {
    const { id } = req.params
    const spec = await Speciality.findById(id)
    if (!spec) {
      return res.status(404).json({ success: false, message: 'Speciality not found' })
    }

    // Check if doctors are assigned to this speciality
    const doctorsCount = await Doctor.countDocuments({
      speciality: { $regex: `^${spec.name}$`, $options: 'i' },
    })

    if (doctorsCount > 0) {
      // Reversibly deactivate rather than deleting
      spec.isActive = false
      await spec.save()
      return res.json({
        success: true,
        message: `Speciality has ${doctorsCount} active doctor(s) and was deactivated instead of deleted.`,
        data: spec,
      })
    }

    await Speciality.findByIdAndDelete(id)
    res.json({
      success: true,
      message: 'Speciality deleted successfully',
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// GET /api/admin/queue (Live Patient Queue & Operations)
export const getLiveQueue = async (req, res) => {
  try {
    const todayStr = new Date().toISOString().split('T')[0]
    const appointments = await Appointment.find({ date: todayStr })
      .populate('patient', 'name email phone age gender')
      .populate('doctor', 'name speciality fee')
      .sort({ slot: 1, createdAt: 1 })
      .lean()

    const summary = {
      totalToday: appointments.length,
      waiting: appointments.filter((a) => a.status === 'waiting').length,
      inConsultation: appointments.filter((a) => a.status === 'in-consultation').length,
      completed: appointments.filter((a) => a.status === 'completed').length,
      pending: appointments.filter((a) => a.status === 'pending').length,
      confirmed: appointments.filter((a) => a.status === 'confirmed').length,
      cancelled: appointments.filter((a) => a.status === 'cancelled').length,
    }

    res.json({
      success: true,
      date: todayStr,
      summary,
      queue: appointments,
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// GET /api/admin/analytics (Detailed Revenue & Operational Metrics)
export const getAdminAnalytics = async (req, res) => {
  try {
    // 1. Revenue by status
    const paymentStatusAgg = await Appointment.aggregate([
      {
        $group: {
          _id: '$payment.status',
          totalAmount: { $sum: '$payment.amount' },
          count: { $sum: 1 },
        },
      },
    ])

    // 2. Revenue by doctor
    const revenueByDoctorAgg = await Appointment.aggregate([
      { $match: { 'payment.status': 'paid' } },
      {
        $group: {
          _id: '$doctor',
          totalRevenue: { $sum: '$payment.amount' },
          paidAppointments: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'doctors',
          localField: '_id',
          foreignField: '_id',
          as: 'doctorInfo',
        },
      },
      { $unwind: '$doctorInfo' },
      {
        $project: {
          _id: 1,
          doctorName: '$doctorInfo.name',
          speciality: '$doctorInfo.speciality',
          totalRevenue: 1,
          paidAppointments: 1,
        },
      },
      { $sort: { totalRevenue: -1 } },
    ])

    // 3. Appointments by status
    const statusCounts = await Appointment.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ])

    // 4. Doctors on emergency leave
    const doctorsOnLeave = await Doctor.find({ available: false })
      .populate('user', 'name email phone')
      .lean()

    res.json({
      success: true,
      data: {
        paymentBreakdown: paymentStatusAgg,
        revenueByDoctor: revenueByDoctorAgg,
        statusCounts,
        doctorsOnLeave,
      },
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

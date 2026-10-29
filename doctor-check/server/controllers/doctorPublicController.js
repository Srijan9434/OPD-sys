import mongoose from 'mongoose'
import Doctor from '../models/Doctor.js'

// GET /api/doctors
// Optional query params: ?speciality=Cardiologist&available=true
export const getDoctors = async (req, res) => {
  try {
    const query = {}

    if (req.query.speciality) {
      query.speciality = new RegExp(`^${req.query.speciality.trim()}$`, 'i')
    }

    if (req.query.available !== undefined) {
      query.available = req.query.available === 'true'
    }

    const doctors = await Doctor.find(query).sort({ name: 1 })

    res.json({
      success: true,
      count: doctors.length,
      data: doctors,
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// GET /api/doctors/:id
export const getDoctorById = async (req, res) => {
  try {
    const { id } = req.params

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid doctor ID format' })
    }

    const doctor = await Doctor.findById(id)
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' })
    }

    res.json({
      success: true,
      data: doctor,
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

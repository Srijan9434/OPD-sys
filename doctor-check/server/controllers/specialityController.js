import Speciality from '../models/Speciality.js'

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

export const getActiveSpecialities = async (req, res) => {
  try {
    const count = await Speciality.countDocuments()
    if (count === 0) {
      await Speciality.insertMany(DEFAULT_SPECIALITIES)
    }

    const specialities = await Speciality.find({ isActive: true }).sort({ name: 1 }).lean()
    res.json({
      success: true,
      count: specialities.length,
      data: specialities,
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

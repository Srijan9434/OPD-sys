import mongoose from 'mongoose'

const doctorSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    name: { type: String, required: true },
    speciality: { type: String, required: true },
    degree: { type: String, default: 'MBBS' },
    experience: { type: String, default: '' },
    fee: { type: Number, required: true },
    available: { type: Boolean, default: true },
    image: { type: String, default: '' },
    about: { type: String, default: '' },
    slots: {
      type: [String],
      default: ['8:00 am', '8:30 am', '9:00 am', '9:30 am', '10:00 am', '10:30 am', '11:00 am', '11:30 am'],
    },
  },
  { timestamps: true }
)

export default mongoose.model('Doctor', doctorSchema)
import mongoose from 'mongoose'

const specialitySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Speciality name is required'],
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    icon: {
      type: String,
      default: '🩺',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
)

export default mongoose.model('Speciality', specialitySchema)

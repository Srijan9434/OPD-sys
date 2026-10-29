import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },
    role: { type: String, enum: ['user', 'doctor', 'admin'], default: 'user' },
    phone: { type: String, default: '' },
    age: Number,
    gender: { type: String, enum: ['Male', 'Female', 'Other', ''], default: '' },
    isBlocked: { type: Boolean, default: false },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
  },
  { timestamps: true }
)

export default mongoose.model('User', userSchema)
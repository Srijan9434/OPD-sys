import mongoose from 'mongoose'

const appointmentSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
    date: { type: String, required: true }, // "YYYY-MM-DD"
    slot: { type: String, required: true }, // "9:00 am"
    reason: { type: String, default: '' },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'waiting', 'in-consultation', 'completed', 'cancelled', 'rejected', 'doctor-unavailable'],
      default: 'pending',
    },
    payment: {
      mode: { type: String, enum: ['cash', 'card', 'online'], default: 'cash' },
      status: { type: String, enum: ['pending', 'paid'], default: 'pending' },
      amount: Number,
      transactionId: String,
      paidAt: Date,
    },
    prescription: {
      symptoms: String,
      diagnosis: String,
      treatment: String,
      medicines: [
        {
          name: String,
          dosage: String,
          frequency: String,
          duration: String,
          instructions: String,
        },
      ],
      notes: String,
      followUpDate: String,
      createdAt: Date,
    },
    rescheduledFrom: { date: String, slot: String },
    cancelledAt: Date,
    cancelReason: String,
  },
  { timestamps: true }
)

appointmentSchema.index(
  { doctor: 1, date: 1, slot: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $nin: ['cancelled', 'rejected', 'doctor-unavailable'] },
    },
  }
)

export default mongoose.model('Appointment', appointmentSchema)
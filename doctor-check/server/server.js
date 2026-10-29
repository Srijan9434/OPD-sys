import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import connectDB from './config/db.js'
import authRoutes from './routes/authRoutes.js'
import doctorRoutes from './routes/doctorRoutes.js'
import doctorPublicRoutes from './routes/doctorPublicRoutes.js'
import appointmentRoutes from './routes/appointmentRoutes.js'
import adminRoutes from './routes/adminRoutes.js'
import specialityRoutes from './routes/specialityRoutes.js'

const app = express()

const defaultOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
]

const envOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean)

const clientUrlOrigin = process.env.CLIENT_URL ? [process.env.CLIENT_URL.trim()] : []
const allowedOrigins = [...new Set([...defaultOrigins, ...envOrigins, ...clientUrlOrigin])]

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true)
      }
      return callback(new Error(`CORS blocked for origin: ${origin}`))
    },
    credentials: true,
  })
)

app.use(express.json())

app.get('/', (req, res) => {
  res.json({ success: true, message: 'OPD API running' })
})

app.use('/api/auth', authRoutes)
app.use('/api/doctor', doctorRoutes)
app.use('/api/doctors', doctorPublicRoutes)
app.use('/api/appointments', appointmentRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/specialities', specialityRoutes)

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' })
})

const PORT = process.env.PORT || 5000

export { app }

if (process.env.NODE_ENV !== 'test') {
  connectDB().then(() => {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
  })
}
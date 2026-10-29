import 'dotenv/config'
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import User from '../models/User.js'

const run = async () => {
  const args = process.argv.slice(2)
  const getArg = (flag) => {
    const idx = args.indexOf(flag)
    return idx !== -1 && args[idx + 1] ? args[idx + 1] : null
  }

  const name = getArg('--name') || process.env.ADMIN_NAME || 'System Administrator'
  const email = getArg('--email') || process.env.ADMIN_EMAIL || 'admin@opd.local'
  const password = getArg('--password') || process.env.ADMIN_PASSWORD || 'Admin@123456'

  if (!email || !password) {
    console.error('Error: Email and password are required.')
    console.log('Usage: node scripts/createAdmin.js --name "Admin Name" --email "admin@opd.local" --password "yourpassword"')
    process.exit(1)
  }

  if (password.length < 6) {
    console.error('Error: Password must be at least 6 characters.')
    process.exit(1)
  }

  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/opd'
  await mongoose.connect(mongoUri)
  console.log('Connected to MongoDB:', mongoUri)

  const normalizedEmail = email.trim().toLowerCase()
  const existing = await User.findOne({ email: normalizedEmail })

  if (existing) {
    if (existing.role === 'admin') {
      console.log(`Admin account with email "${normalizedEmail}" already exists. ID: ${existing._id}`)
    } else {
      console.error(`User with email "${normalizedEmail}" already exists with role "${existing.role}". Will not overwrite.`)
    }
    await mongoose.disconnect()
    process.exit(0)
  }

  const hashedPassword = await bcrypt.hash(password, 10)
  const admin = await User.create({
    name,
    email: normalizedEmail,
    password: hashedPassword,
    role: 'admin',
    phone: '1800-OPD-ADMIN',
  })

  console.log(`✓ Admin account created successfully!`)
  console.log(`  Name:  ${admin.name}`)
  console.log(`  Email: ${admin.email}`)
  console.log(`  Role:  ${admin.role}`)
  console.log(`  ID:    ${admin._id}`)

  await mongoose.disconnect()
  process.exit(0)
}

run().catch((err) => {
  console.error('Failed to create admin:', err.message)
  process.exit(1)
})

import 'dotenv/config'
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import User from '../models/User.js'

/**
 * Secure Admin Password Reset Utility
 * Allows resetting the password for an EXISTING administrator account without deleting records.
 *
 * Usage:
 *   node scripts/resetAdminPassword.js --email "admin@opd.local" --new-password "YourNewSecurePassword123"
 */
const run = async () => {
  const args = process.argv.slice(2)
  const getArg = (flag) => {
    const idx = args.indexOf(flag)
    return idx !== -1 && args[idx + 1] ? args[idx + 1] : null
  }

  const email = getArg('--email') || 'admin@opd.local'
  const newPassword = getArg('--new-password') || getArg('--password')

  if (!email || !newPassword) {
    console.error('Error: Both --email and --new-password are required.')
    console.log('Usage: node scripts/resetAdminPassword.js --email "admin@opd.local" --new-password "SecurePass123"')
    process.exit(1)
  }

  if (newPassword.length < 6) {
    console.error('Error: Password must be at least 6 characters.')
    process.exit(1)
  }

  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/opd'
  await mongoose.connect(mongoUri)

  const normalizedEmail = email.trim().toLowerCase()
  const user = await User.findOne({ email: normalizedEmail })

  if (!user) {
    console.error(`Error: No account found with email "${normalizedEmail}".`)
    await mongoose.disconnect()
    process.exit(1)
  }

  if (user.role !== 'admin') {
    console.error(`Security Refusal: Account "${normalizedEmail}" has role "${user.role}".`)
    console.error(`This tool strictly resets administrator passwords and will not elevate other roles.`)
    await mongoose.disconnect()
    process.exit(1)
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10)
  user.password = hashedPassword
  await user.save()

  console.log(`✓ Admin password updated successfully!`)
  console.log(`  Email: ${user.email}`)
  console.log(`  Role:  ${user.role}`)
  console.log(`  ID:    ${user._id}`)
  console.log(`  Status: Password has been re-hashed with bcrypt.`)

  await mongoose.disconnect()
  process.exit(0)
}

run().catch((err) => {
  console.error('Failed to reset admin password:', err.message)
  process.exit(1)
})

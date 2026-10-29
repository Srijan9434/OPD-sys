import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' })

const userData = (u) => ({
  _id: u._id,
  name: u.name,
  email: u.email,
  role: u.role,
  phone: u.phone,
  age: u.age,
  gender: u.gender,
})

export const register = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email and password are required' })
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' })
    }

    const exists = await User.findOne({ email: String(email).toLowerCase() })
    if (exists) {
      return res.status(409).json({ success: false, message: 'Email already registered' })
    }

    const hashed = await bcrypt.hash(password, 10)
    // role is always "user" here; doctors and admins are created by the admin
    const user = await User.create({ name, email, password: hashed, phone })

    res.status(201).json({ success: true, data: { token: signToken(user._id), user: userData(user) } })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

export const login = async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' })
    }

    const user = await User.findOne({ email: String(email).toLowerCase() }).select('+password')
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' })
    }
    if (user.isBlocked) {
      return res.status(403).json({ success: false, message: 'Your account has been blocked' })
    }

    res.json({ success: true, data: { token: signToken(user._id), user: userData(user) } })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

export const getMe = (req, res) => {
  res.json({ success: true, data: userData(req.user) })
}
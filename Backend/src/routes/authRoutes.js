// routes/authRoutes.js
import express from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { supabaseAdmin } from '../../lib/supabaseAdmin.js'

const router = express.Router()

const JWT_SECRET = process.env.JWT_SECRET || 'SECRET_KEY'
const JWT_EXPIRES_IN = '7d'
const OTP_EXPIRES_MIN = 10

// In-memory OTP store (email -> { otp, expiresAt, userId })
const otpStore = new Map()

// Helper to generate 6-digit OTP
function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// ================= SIGNUP =================
router.post('/signup', async (req, res) => {
  const { name, email, password, confirmPassword, phone, address } = req.body

  if (!name || !email || !password || !phone || !address) {
    return res.status(400).json({ success: false, error: 'All fields are required' })
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ success: false, error: 'Passwords do not match' })
  }

  try {
    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      return res.status(409).json({ success: false, error: 'Email already registered' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const { data, error } = await supabaseAdmin
      .from('users')
      .insert([{
        name,
        email,
        phone,
        address,
        password_hash: hashedPassword,
        verified: false,
        avatar: name.split(' ')[0].toUpperCase(),
      }])
      .select()
      .single()

    if (error) throw error

    // Generate token for immediate login after signup
    const token = jwt.sign({ id: data.id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })

    const { password_hash, ...userWithoutPassword } = data

    res.status(201).json({ 
      success: true, 
      message: 'User created successfully', 
      token, 
      user: userWithoutPassword 
    })
  } catch (error) {
    console.error('Signup error:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// ================= LOGIN (STEP 1: Credentials) =================
router.post('/login', async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email and password required' })
  }

  try {
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (error || !user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' })
    }

    const isMatch = await bcrypt.compare(password, user.password_hash)
    if (!isMatch) {
      // Fallback for plain text passwords if they exist (for transition)
      if (password !== user.password_hash) {
        return res.status(401).json({ success: false, error: 'Invalid credentials' })
      }
    }

    // Generate OTP
    const otp = generateOtp()
    const expiresAt = Date.now() + OTP_EXPIRES_MIN * 60 * 1000
    otpStore.set(email.toLowerCase(), { otp, expiresAt, userId: user.id })

    console.log(`[OTP] For ${email}: ${otp}`)

    // In dev mode, we return the OTP to the frontend so it can be shown in toast
    res.json({ 
      success: true, 
      message: 'OTP sent to your email', 
      email, 
      _devOtp: otp 
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ success: false, error: 'Login failed' })
  }
})

// ================= VERIFY OTP (STEP 2) =================
router.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body

  if (!email || !otp) {
    return res.status(400).json({ success: false, error: 'Email and OTP required' })
  }

  const record = otpStore.get(email.toLowerCase())

  if (!record) {
    return res.status(400).json({ success: false, error: 'No OTP found. Please login again.' })
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(email.toLowerCase())
    return res.status(400).json({ success: false, error: 'OTP expired' })
  }

  if (record.otp !== otp.toString().trim()) {
    return res.status(400).json({ success: false, error: 'Incorrect OTP' })
  }

  // OTP valid - consume it
  otpStore.delete(email.toLowerCase())

  try {
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', record.userId)
      .single()

    if (error || !user) throw new Error('User not found')

    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
    const { password_hash, ...userWithoutPassword } = user

    res.json({ 
      success: true, 
      message: 'Login successful', 
      token, 
      user: userWithoutPassword 
    })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// ================= RESEND OTP =================
router.post('/resend-otp', async (req, res) => {
  const { email } = req.body
  if (!email) return res.status(400).json({ success: false, error: 'Email required' })

  try {
    const { data: user } = await supabaseAdmin.from('users').select('id').eq('email', email).single()
    if (!user) return res.status(404).json({ success: false, error: 'User not found' })

    const otp = generateOtp()
    const expiresAt = Date.now() + OTP_EXPIRES_MIN * 60 * 1000
    otpStore.set(email.toLowerCase(), { otp, expiresAt, userId: user.id })

    res.json({ success: true, message: 'New code sent', _devOtp: otp })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to resend OTP' })
  }
})

export default router

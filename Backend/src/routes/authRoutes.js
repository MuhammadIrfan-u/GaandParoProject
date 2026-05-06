// routes/authRoutes.js
import express from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { supabaseAdmin } from '../../lib/supabaseAdmin.js'

const router = express.Router()

// ================= SIGNUP =================
router.post('/signup', async (req, res) => {
  const { name, email, password, confirmPassword, phone, address } = req.body

  if (password !== confirmPassword) {
    return res.status(400).json({ error: 'Passwords do not match' })
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
      verified: false
    }])
    .select()

  if (error) return res.status(400).json({ error: error.message })

  // OPTIONAL: send verification email here

  res.json({ message: 'User created', user: data[0] })
})


// ================= LOGIN =================
router.post('/login', async (req, res) => {
  const { email, password } = req.body

  const { data: user, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('email', email)
    .single()

  if (error || !user) {
    return res.status(400).json({ error: 'User not found' })
  }

  const isMatch = await bcrypt.compare(password, user.password_hash)

  if (!isMatch) {
    return res.status(400).json({ error: 'Invalid credentials' })
  }

  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'SECRET_KEY', { expiresIn: '7d' })

  res.json({ message: 'Login successful', token, user })
})


// ================= FORGOT PASSWORD =================
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body

  const { data: user } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('email', email)
    .single()

  if (!user) {
    return res.status(400).json({ error: 'User not found' })
  }

  const token = crypto.randomBytes(32).toString('hex')
  const expires = new Date(Date.now() + 3600000) // 1 hour

  await supabaseAdmin
    .from('users')
    .update({
      reset_password_token: token,
      reset_password_expires: expires
    })
    .eq('id', user.id)

  // 👉 Send email (use nodemailer)
  console.log(`Reset link: http://localhost:5173/reset-password/${token}`)

  res.json({ message: 'Reset link sent to email' })
})


// ================= RESET PASSWORD =================
router.post('/reset-password/:token', async (req, res) => {
  const { token } = req.params
  const { password } = req.body

  const { data: user } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('reset_password_token', token)
    .single()

  if (!user || new Date(user.reset_password_expires) < new Date()) {
    return res.status(400).json({ error: 'Invalid or expired token' })
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  await supabaseAdmin
    .from('users')
    .update({
      password_hash: hashedPassword,
      reset_password_token: null,
      reset_password_expires: null
    })
    .eq('id', user.id)

  res.json({ message: 'Password reset successful' })
})

export default router
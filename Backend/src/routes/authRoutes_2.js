import express from 'express';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import { supabase } from '../supabaseClient.js';

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = '7d';
const OTP_EXPIRES_MIN = parseInt(process.env.OTP_EXPIRES_MINUTES || '10');

// ─── In-memory OTP store ──────────────────────────────────────────────────────
// Map<email, { otp, expiresAt, userId }>
// Fine for single-process dev. For multi-instance prod, move to Redis/Supabase.
const otpStore = new Map();

// ─── Email transporter ────────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Generate a 6-digit numeric OTP */
function generateOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

/** Send OTP email */
async function sendOtpEmail(toEmail, otp, userName) {
    const expiresText = `${OTP_EXPIRES_MIN} minutes`;

    await transporter.sendMail({
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: toEmail,
        subject: 'Your NeighborHub Login Code',
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #f9fafb; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #4f46e5; margin: 0; font-size: 24px;">NeighborHub</h1>
          <p style="color: #6b7280; margin: 4px 0 0;">Verified Neighbourhood Community</p>
        </div>

        <div style="background: white; border-radius: 12px; padding: 24px; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <p style="color: #374151; margin: 0 0 8px;">Hi ${userName || 'there'},</p>
          <p style="color: #6b7280; margin: 0 0 24px; font-size: 14px;">
            Use the code below to complete your login. It expires in <strong>${expiresText}</strong>.
          </p>

          <div style="background: #f3f4f6; border-radius: 8px; padding: 20px; margin: 0 0 24px;">
            <span style="font-size: 40px; font-weight: bold; letter-spacing: 12px; color: #4f46e5;">${otp}</span>
          </div>

          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            If you didn't request this code, you can safely ignore this email.
          </p>
        </div>

        <p style="color: #9ca3af; font-size: 11px; text-align: center; margin-top: 16px;">
          © ${new Date().getFullYear()} NeighborHub. Do not reply to this email.
        </p>
      </div>
    `,
    });
}

/** Sign a JWT for a verified user */
function signToken(user) {
    return jwt.sign(
        { userId: user.id, email: user.email, isAdmin: user.is_admin || false },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/auth/signup
 * Register a new user. Returns JWT immediately (no OTP on signup).
 * Body: { name, email, phone, address, password }
 */
router.post('/signup', async (req, res) => {
    try {
        const { name, email, phone, address, password } = req.body;

        if (!name || !email || !phone || !address || !password) {
            return res.status(400).json({
                error: 'Missing required fields: name, email, phone, address, password',
                code: 'MISSING_FIELDS',
            });
        }

        const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('email', email)
            .single();

        if (existingUser) {
            return res.status(409).json({ error: 'Email already registered', code: 'EMAIL_EXISTS' });
        }

        const { data: newUser, error: insertError } = await supabase
            .from('users')
            .insert([{
                name,
                email,
                phone,
                address,
                password_hash: password,
                verified: false,
                avatar: name.split(' ')[0].toUpperCase(),
            }])
            .select()
            .single();

        if (insertError) {
            console.error('Signup insert error:', insertError);
            return res.status(500).json({ error: 'Failed to create user', code: 'INSERT_ERROR', details: insertError.message });
        }

        const { password_hash, ...userWithoutPassword } = newUser;
        const token = signToken(newUser);

        return res.status(201).json({
            success: true,
            message: 'User created successfully',
            token,
            user: userWithoutPassword,
        });
    } catch (error) {
        console.error('Signup error:', error);
        return res.status(500).json({ error: 'Signup failed', code: 'SIGNUP_ERROR', details: error.message });
    }
});

/**
 * POST /api/auth/login
 * Step 1: Validate email + password, then send OTP to email.
 * Body: { email, password }
 * Response: { success, message, email } — NO token yet
 */
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password required', code: 'MISSING_CREDENTIALS' });
        }

        // Fetch user
        const { data: user, error: selectError } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        if (selectError || !user) {
            return res.status(401).json({ error: 'Invalid credentials', code: 'INVALID_CREDENTIALS' });
        }

        if (user.password_hash !== password) {
            return res.status(401).json({ error: 'Invalid credentials', code: 'INVALID_CREDENTIALS' });
        }

        // Generate OTP
        const otp = generateOtp();
        const expiresAt = Date.now() + OTP_EXPIRES_MIN * 60 * 1000;

        otpStore.set(email.toLowerCase(), { otp, expiresAt, userId: user.id });

        console.log(`[OTP] Generated for ${email}: ${otp} (expires in ${OTP_EXPIRES_MIN}m)`);

        // Send email
        try {
            await sendOtpEmail(email, otp, user.name);
            console.log(`[OTP] Email sent to ${email}`);
        } catch (emailErr) {
            console.error('[OTP] Email send failed:', emailErr.message);
            // In dev: still return the OTP in the response so you can test without email
            if (process.env.NODE_ENV !== 'production') {
                return res.json({
                    success: true,
                    message: `OTP generated (email failed — dev mode). OTP: ${otp}`,
                    email,
                    _devOtp: otp, // remove in production
                });
            }
            return res.status(500).json({ error: 'Failed to send OTP email', code: 'EMAIL_ERROR' });
        }

        return res.json({
            success: true,
            message: `A 6-digit code has been sent to ${email}`,
            email,
        });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ error: 'Login failed', code: 'LOGIN_ERROR', details: error.message });
    }
});

/**
 * POST /api/auth/verify-otp
 * Step 2: Verify the OTP and return JWT + user data.
 * Body: { email, otp }
 * Response: { success, token, user }
 */
router.post('/verify-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ error: 'Email and OTP required', code: 'MISSING_FIELDS' });
        }

        const record = otpStore.get(email.toLowerCase());

        if (!record) {
            return res.status(400).json({ error: 'No OTP found for this email. Please login again.', code: 'OTP_NOT_FOUND' });
        }

        if (Date.now() > record.expiresAt) {
            otpStore.delete(email.toLowerCase());
            return res.status(400).json({ error: `OTP expired. Please login again.`, code: 'OTP_EXPIRED' });
        }

        if (record.otp !== otp.toString().trim()) {
            return res.status(400).json({ error: 'Incorrect OTP. Please try again.', code: 'OTP_INVALID' });
        }

        // OTP valid — consume it
        otpStore.delete(email.toLowerCase());

        // Fetch full user
        const { data: user, error: fetchErr } = await supabase
            .from('users')
            .select('*')
            .eq('id', record.userId)
            .single();

        if (fetchErr || !user) {
            return res.status(500).json({ error: 'Failed to fetch user after OTP verification', code: 'USER_FETCH_ERROR' });
        }

        const { password_hash, ...userWithoutPassword } = user;
        const token = signToken(user);

        console.log(`[OTP] Verified for ${email} — issuing JWT`);

        return res.json({
            success: true,
            message: 'Login successful',
            token,
            user: userWithoutPassword,
        });
    } catch (error) {
        console.error('OTP verify error:', error);
        return res.status(500).json({ error: 'OTP verification failed', code: 'VERIFY_ERROR', details: error.message });
    }
});

/**
 * POST /api/auth/resend-otp
 * Resend a fresh OTP to the same email (user must have already attempted login).
 * Body: { email }
 */
router.post('/resend-otp', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: 'Email required', code: 'MISSING_EMAIL' });

        // Verify user exists
        const { data: user } = await supabase.from('users').select('id, name').eq('email', email).single();
        if (!user) return res.status(404).json({ error: 'No account found for this email', code: 'USER_NOT_FOUND' });

        const otp = generateOtp();
        const expiresAt = Date.now() + OTP_EXPIRES_MIN * 60 * 1000;
        otpStore.set(email.toLowerCase(), { otp, expiresAt, userId: user.id });

        console.log(`[OTP] Resent for ${email}: ${otp}`);

        try {
            await sendOtpEmail(email, otp, user.name);
        } catch (emailErr) {
            console.error('[OTP] Resend email failed:', emailErr.message);
            if (process.env.NODE_ENV !== 'production') {
                return res.json({ success: true, message: 'OTP resent (dev mode)', _devOtp: otp });
            }
            return res.status(500).json({ error: 'Failed to resend OTP', code: 'EMAIL_ERROR' });
        }

        return res.json({ success: true, message: `New code sent to ${email}` });
    } catch (error) {
        console.error('Resend OTP error:', error);
        return res.status(500).json({ error: 'Failed to resend OTP', code: 'RESEND_ERROR' });
    }
});

/**
 * GET /api/auth/user/:userId
 */
router.get('/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { data: user, error } = await supabase.from('users').select('*').eq('id', userId).single();

        if (error || !user) return res.status(404).json({ error: 'User not found', code: 'NOT_FOUND' });

        const { password_hash, ...userWithoutPassword } = user;
        return res.status(200).json({ success: true, user: userWithoutPassword });
    } catch (error) {
        console.error('Get user error:', error);
        return res.status(500).json({ error: 'Failed to fetch user', code: 'FETCH_ERROR' });
    }
});

export default router;

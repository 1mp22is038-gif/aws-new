const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../../db');
const { generateOTP, sendOTP } = require('../services/otpService');

const register = async (req, res, next) => {
    try {
        console.log("Register API hit:", req.body);
        const { name, phone, email, password } = req.body;
        if (!name || !phone || !email || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const { rows: existingRows } = await db.query('SELECT * FROM "User" WHERE email = $1', [email]);
        if (existingRows.length > 0) return res.status(400).json({ error: 'Email already exists' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const { rows: insertRows } = await db.query(
            'INSERT INTO "User" (name, phone, email, password, "isVerified") VALUES ($1, $2, $3, $4, true) RETURNING id',
            [name, phone, email, hashedPassword]
        );
        const user = insertRows[0];

        res.status(201).json({ 
            message: 'User created successfully! You can now login.', 
            userId: user.id
        });
    } catch (e) {
        next(e);
    }
};

const verify = async (req, res, next) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) return res.status(400).json({ error: 'Email and OTP required' });

        const { rows: userRows } = await db.query('SELECT * FROM "User" WHERE email = $1', [email]);
        if (userRows.length === 0) return res.status(404).json({ error: 'User not found' });
        
        const user = userRows[0];
        if (user.isVerified) return res.status(400).json({ error: 'User is already verified' });

        if (user.otp !== otp || new Date() > new Date(user.otpExpiresAt)) {
            return res.status(400).json({ error: 'Invalid or expired OTP' });
        }

        await db.query(
            'UPDATE "User" SET "isVerified" = true, otp = null, "otpExpiresAt" = null WHERE id = $1',
            [user.id]
        );

        res.status(200).json({ message: 'Email successfully verified!' });
    } catch (e) {
        next(e);
    }
};

const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

        const { rows: userRows } = await db.query('SELECT * FROM "User" WHERE email = $1', [email]);
        if (userRows.length === 0) return res.status(404).json({ error: 'Account not found. Please click Sign Up.' });

        const user = userRows[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

        const token = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.status(200).json({ message: 'Login successful', token });
    } catch (e) {
        next(e);
    }
};

module.exports = { register, verify, login };

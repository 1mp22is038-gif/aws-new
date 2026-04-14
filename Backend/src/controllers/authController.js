const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../../db');

const register = async (req, res, next) => {
    try {
        console.log("--- [DEBUG] Register Attempt Started ---");
        const { name, phone, email, password } = req.body;
        if (!name || !phone || !email || !password) {
            console.log("--- [DEBUG] Register Failed: Missing Fields ---");
            return res.status(400).json({ error: 'All fields are required' });
        }

        console.log("--- [DEBUG] DB Query: Checking existing email ---");
        const { rows: existingRows } = await db.query('SELECT * FROM "User" WHERE email = $1', [email]);
        if (existingRows.length > 0) {
            console.log("--- [DEBUG] Register Failed: Email exists ---");
            return res.status(400).json({ error: 'Email already exists' });
        }

        console.log("--- [DEBUG] Bcrypt: Hashing password ---");
        const hashedPassword = await bcrypt.hash(password, 10);
        
        console.log("--- [DEBUG] DB Query: Inserting new user ---");
        const { rows: insertRows } = await db.query(
            'INSERT INTO "User" (name, phone, email, password, "isVerified") VALUES ($1, $2, $3, $4, true) RETURNING id',
            [name, phone, email, hashedPassword]
        );
        const user = insertRows[0];

        console.log("--- [DEBUG] Register Success: User ID", user.id, "---");
        res.status(201).json({ 
            message: 'User created successfully! You can now login.', 
            userId: user.id
        });
    } catch (e) {
        console.error("--- [DEBUG] Register EXCEPTION: ---");
        console.error(e);
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

module.exports = { register, login };

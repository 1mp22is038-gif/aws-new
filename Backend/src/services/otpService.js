/**
 * OTP Service
 * Handles the generation and dispatch of One-Time Passwords depending on the environment.
 */

const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

const sendOTP = async (email, otp) => {
    if (process.env.NODE_ENV === 'production') {
        // TODO: Integrate AWS SES or SNS here for production readiness
        console.log(`[AWS SES Placeholder] Sending OTP to ${email}...`);
    } else {
        // Local Development mock
        console.log(`\n==========================================`);
        console.log(`🔑 OTP generated for ${email}: ${otp}`);
        console.log(`==========================================\n`);
    }
};

module.exports = {
    generateOTP,
    sendOTP
};

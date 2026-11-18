
const path = require('path');
const dotenv = require('dotenv');

// Load .env explicitly from backend folder

dotenv.config({
    path: path.resolve(__dirname, '../.env'),
    override: true
});

const nodemailer = require('nodemailer');

const emailUser = process.env.EMAIL_USER?.trim();
const emailPass = process.env.EMAIL_PASS?.replace(/\s/g, '');

console.log("========== EMAIL DEBUG ==========");
console.log("Email User:", emailUser);
console.log("Password Loaded:", !!emailPass);
console.log("Password Length:", emailPass?.length);
console.log("=================================");

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: emailUser,
        pass: emailPass
    }
});

// Test Gmail authentication
transporter.verify()
    .then(() => {
        console.log("✅ Gmail SMTP authentication successful!");
    })
    .catch((error) => {
        console.error("❌ Gmail SMTP authentication failed:", error.message);
    });

module.exports = transporter;

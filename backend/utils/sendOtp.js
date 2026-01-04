const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: true, // STARTTLS (port 587)
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

/**
 * Send OTP Email
 * @param {string} toEmail - Recipient's email address
 * @param {string} otp - OTP Code
 */
async function sendOtpEmail(toEmail, otp) {
    try {
        const info = await transporter.sendMail({
            from: `"Shipet App" <info@sparrow.host>`,
            to: toEmail,
            subject: "Your Shipet OTP Code",
            text: `Your OTP code is: ${otp}`,
            html: `
        <div style="font-family: Arial, sans-serif; padding: 10px;">
          <h2>🔐 Shipet OTP Verification</h2>
          <p>Your One-Time Password (OTP) is:</p>
          <h1 style="color: #4CAF50;">${otp}</h1>
          <p>This OTP will expire shortly. Do not share it with anyone.</p>
        </div>
      `,
        });

        console.log("OTP Email sent:", info.messageId);
    } catch (error) {
        console.error("OTP Email sending error:", error);
    }
}

module.exports = { sendOtpEmail };

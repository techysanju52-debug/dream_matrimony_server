const nodemailer = require('nodemailer');

const sendOTP = async (email, otp, name = 'User') => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD
      }
    });

    console.log("email : ", otp);

    const mailOptions = {
      from: process.env.EMAIL,
      to: email,
      subject: 'Dream Matrimony | Verification Code',
      text: `Dear ${name}, your otp is ${otp}. It will expire in 10 minutes.`
    };

    await transporter.sendMail(mailOptions);
    console.log('Message sent successfully to:', email);
    return { success: true, message: "verification email sent" };

  } catch (error) {
    console.error("Error sending verification email : ", error);
    return { success: false, message: "failed to send verification email" };
  }
};

module.exports = { sendOTP };

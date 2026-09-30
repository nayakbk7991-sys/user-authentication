const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

const verifyEmailConnection = async () => {

    try {

        await transporter.verify();

        console.log(
            "Email service connected successfully."
        );

    } catch (error) {

        console.error(
            "Email service connection failed:",
            error.message
        );

    }

};

const sendVerificationEmail = async (
    recipientEmail,
    recipientName,
    verificationOTP
) => {

    await transporter.sendMail({

        from:
            `"User Authentication" <${process.env.EMAIL_USER}>`,

        to:
            recipientEmail,

        subject:
            "Verify your email address",

        text: `Hello ${recipientName},

Welcome to User Authentication.

Your email verification code is:

${verificationOTP}

This code will expire in 10 minutes.

If you did not create an account, you can safely ignore this email.

User Authentication`

    });

};

const sendPasswordResetEmail = async (
    recipientEmail,
    recipientName,
    passwordResetOTP
) => {

    await transporter.sendMail({

        from:
            `"User Authentication" <${process.env.EMAIL_USER}>`,

        to:
            recipientEmail,

        subject:
            "Reset your password",

        text: `Hello ${recipientName},

We received a request to reset your password.

Your password reset code is:

${passwordResetOTP}

This code will expire in 10 minutes.

If you did not request a password reset, you can safely ignore this email.

User Authentication`

    });

};

module.exports = {
    sendVerificationEmail,
    sendPasswordResetEmail,
    verifyEmailConnection
};
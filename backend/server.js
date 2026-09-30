require("dotenv").config();

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const connectDatabase =
    require("./config/database");

const {
    sendVerificationEmail,
    sendPasswordResetEmail,
    verifyEmailConnection
} = require("./config/email");

const {
    redisClient,
    connectRedis
} = require("./config/redis");

const User =
    require("./models/User");

const authenticateToken =
    require("./middleware/authMiddleware");

const validatePassword =
    require("./utils/passwordValidation");

const {
    generateRefreshToken
} = require("./utils/tokenUtils");

const {
    createRefreshTokenSession,
    getRefreshTokenSession,
    deleteRefreshTokenSession,
    deleteAllUserSessions
} = require(
    "./utils/refreshTokenStore"
);

const app = express();

const PORT = 5000;

const ACCESS_TOKEN_EXPIRES_IN =
    "15m";

const REFRESH_TOKEN_COOKIE_NAME =
    "refreshToken";

const REFRESH_TOKEN_COOKIE_MAX_AGE =
    7 * 24 * 60 * 60 * 1000;

const OTP_REQUEST_LIMIT = 3;

const OTP_REQUEST_WINDOW_SECONDS =
    10 * 60;

const LOGIN_EMAIL_LIMIT = 5;

const LOGIN_IP_LIMIT = 20;

const LOGIN_WINDOW_SECONDS =
    10 * 60;

app.use(
    cors({
        origin:
            "http://localhost:5173",
        credentials: true
    })
);

app.use(
    express.json()
);

app.use(
    cookieParser()
);

const generateOTP = () => {
    return crypto
        .randomInt(
            100000,
            1000000
        )
        .toString();
};

const generatePasswordResetToken = () => {
    return crypto
        .randomBytes(32)
        .toString("hex");
};

const getClientIp = (req) => {
    return (
        req.ip ||
        req.socket.remoteAddress ||
        "unknown"
    );
};

const createAccessToken = (
    userId
) => {
    return jwt.sign(
        {
            userId
        },
        process.env.JWT_SECRET,
        {
            expiresIn:
                ACCESS_TOKEN_EXPIRES_IN
        }
    );
};

const setRefreshTokenCookie = (
    res,
    refreshToken
) => {
    res.cookie(
        REFRESH_TOKEN_COOKIE_NAME,
        refreshToken,
        {
            httpOnly: true,
            secure: false,
            sameSite: "lax",
            maxAge:
                REFRESH_TOKEN_COOKIE_MAX_AGE,
            path: "/api/auth"
        }
    );
};

const clearRefreshTokenCookie = (
    res
) => {
    res.clearCookie(
        REFRESH_TOKEN_COOKIE_NAME,
        {
            httpOnly: true,
            secure: false,
            sameSite: "lax",
            path: "/api/auth"
        }
    );
};

app.get(
    "/",
    (req, res) => {
        res.json({
            message:
                "User Authentication API is running."
        });
    }
);

app.post(
    "/api/auth/register",
    async (req, res) => {
        try {

            const {
                fullName,
                email,
                password
            } = req.body;

            if (
                !fullName ||
                !email ||
                !password
            ) {
                return res.status(400).json({
                    message:
                        "Full name, email and password are required."
                });
            }

            const normalizedEmail =
                email
                    .trim()
                    .toLowerCase();

            const passwordValidation =
                validatePassword(
                    password
                );

            if (
                !passwordValidation.valid
            ) {
                return res.status(400).json({
                    message:
                        passwordValidation.message
                });
            }

            const existingUser =
                await User.findOne({
                    email:
                        normalizedEmail
                });

            if (existingUser) {

                if (
                    existingUser.isEmailVerified
                ) {
                    return res.status(409).json({
                        message:
                            "An account with this email already exists."
                    });
                }

                const hashedPassword =
                    await bcrypt.hash(
                        password,
                        12
                    );

                const verificationOTP =
                    generateOTP();

                existingUser.fullName =
                    fullName.trim();

                existingUser.password =
                    hashedPassword;

                existingUser.verificationOTP =
                    verificationOTP;

                existingUser.verificationOTPExpires =
                    new Date(
                        Date.now() +
                        10 * 60 * 1000
                    );

                await existingUser.save();

                await sendVerificationEmail(
                    existingUser.email,
                    existingUser.fullName,
                    verificationOTP
                );

                return res.status(200).json({
                    message:
                        "Registration information updated. A new verification code has been sent.",
                    email:
                        existingUser.email
                });
            }

            const hashedPassword =
                await bcrypt.hash(
                    password,
                    12
                );

            const verificationOTP =
                generateOTP();

            const user =
                await User.create({
                    fullName:
                        fullName.trim(),
                    email:
                        normalizedEmail,
                    password:
                        hashedPassword,
                    isEmailVerified:
                        false,
                    verificationOTP,
                    verificationOTPExpires:
                        new Date(
                            Date.now() +
                            10 * 60 * 1000
                        )
                });

            await sendVerificationEmail(
                user.email,
                user.fullName,
                verificationOTP
            );

            return res.status(201).json({
                message:
                    "Registration successful. Please verify your email.",
                email:
                    user.email
            });

        } catch (error) {

            console.error(
                "Registration error:",
                error
            );

            return res.status(500).json({
                message:
                    "Unable to register user."
            });
        }
    }
);

app.post(
    "/api/auth/verify-email",
    async (req, res) => {
        try {

            const {
                email,
                otp
            } = req.body;

            if (
                !email ||
                !otp
            ) {
                return res.status(400).json({
                    message:
                        "Email and verification code are required."
                });
            }

            const normalizedEmail =
                email
                    .trim()
                    .toLowerCase();

            const user =
                await User.findOne({
                    email:
                        normalizedEmail
                });

            if (!user) {
                return res.status(400).json({
                    message:
                        "Invalid verification request."
                });
            }

            if (
                user.isEmailVerified
            ) {
                return res.status(400).json({
                    message:
                        "Email is already verified."
                });
            }

            if (
                !user.verificationOTP ||
                !user.verificationOTPExpires
            ) {
                return res.status(400).json({
                    message:
                        "Verification code is invalid or expired."
                });
            }

            if (
                user.verificationOTP !==
                otp
            ) {
                return res.status(400).json({
                    message:
                        "Invalid verification code."
                });
            }

            if (
                user.verificationOTPExpires <
                new Date()
            ) {

                user.verificationOTP =
                    null;

                user.verificationOTPExpires =
                    null;

                await user.save();

                return res.status(400).json({
                    message:
                        "Verification code has expired."
                });
            }

            user.isEmailVerified =
                true;

            user.verificationOTP =
                null;

            user.verificationOTPExpires =
                null;

            await user.save();

            return res.status(200).json({
                message:
                    "Email verified successfully."
            });

        } catch (error) {

            console.error(
                "Email verification error:",
                error
            );

            return res.status(500).json({
                message:
                    "Unable to verify email."
            });
        }
    }
);

app.post(
    "/api/auth/resend-verification",
    async (req, res) => {
        try {

            const {
                email
            } = req.body;

            if (!email) {
                return res.status(400).json({
                    message:
                        "Email is required."
                });
            }

            const normalizedEmail =
                email
                    .trim()
                    .toLowerCase();

            const rateLimitKey =
                `auth:otp-resend:${normalizedEmail}`;

            const currentCount =
                await redisClient.incr(
                    rateLimitKey
                );

            if (
                currentCount === 1
            ) {
                await redisClient.expire(
                    rateLimitKey,
                    OTP_REQUEST_WINDOW_SECONDS
                );
            }

            if (
                currentCount >
                OTP_REQUEST_LIMIT
            ) {
                return res.status(429).json({
                    message:
                        "Too many verification code requests. Please try again later."
                });
            }

            const user =
                await User.findOne({
                    email:
                        normalizedEmail
                });

            if (!user) {
                return res.status(200).json({
                    message:
                        "If an account exists with this email, a verification code has been sent."
                });
            }

            if (
                user.isEmailVerified
            ) {
                return res.status(400).json({
                    message:
                        "Email is already verified."
                });
            }

            const verificationOTP =
                generateOTP();

            user.verificationOTP =
                verificationOTP;

            user.verificationOTPExpires =
                new Date(
                    Date.now() +
                    10 * 60 * 1000
                );

            await user.save();

            await sendVerificationEmail(
                user.email,
                user.fullName,
                verificationOTP
            );

            return res.status(200).json({
                message:
                    "A new verification code has been sent."
            });

        } catch (error) {

            console.error(
                "Resend verification error:",
                error
            );

            return res.status(500).json({
                message:
                    "Unable to resend verification code."
            });
        }
    }
);

app.post(
    "/api/auth/login",
    async (req, res) => {
        try {

            const {
                email,
                password
            } = req.body;

            if (
                !email ||
                !password
            ) {
                return res.status(400).json({
                    message:
                        "Email and password are required."
                });
            }

            const normalizedEmail =
                email
                    .trim()
                    .toLowerCase();

            const clientIp =
                getClientIp(req);

            const emailRateLimitKey =
                `auth:login:email:${normalizedEmail}`;

            const ipRateLimitKey =
                `auth:login:ip:${clientIp}`;

            const emailAttempts =
                await redisClient.incr(
                    emailRateLimitKey
                );

            if (
                emailAttempts === 1
            ) {
                await redisClient.expire(
                    emailRateLimitKey,
                    LOGIN_WINDOW_SECONDS
                );
            }

            if (
                emailAttempts >
                LOGIN_EMAIL_LIMIT
            ) {
                return res.status(429).json({
                    message:
                        "Too many login attempts. Please try again later."
                });
            }

            const ipAttempts =
                await redisClient.incr(
                    ipRateLimitKey
                );

            if (
                ipAttempts === 1
            ) {
                await redisClient.expire(
                    ipRateLimitKey,
                    LOGIN_WINDOW_SECONDS
                );
            }

            if (
                ipAttempts >
                LOGIN_IP_LIMIT
            ) {
                return res.status(429).json({
                    message:
                        "Too many login attempts. Please try again later."
                });
            }

            const user =
                await User.findOne({
                    email:
                        normalizedEmail
                });

            if (!user) {
                return res.status(401).json({
                    message:
                        "Invalid email or password."
                });
            }

            const passwordMatches =
                await bcrypt.compare(
                    password,
                    user.password
                );

            if (!passwordMatches) {
                return res.status(401).json({
                    message:
                        "Invalid email or password."
                });
            }

            if (
                !user.isEmailVerified
            ) {
                return res.status(403).json({
                    message:
                        "Please verify your email before logging in."
                });
            }

            const accessToken =
                createAccessToken(
                    user._id.toString()
                );

            const refreshToken =
                generateRefreshToken();

            await createRefreshTokenSession(
                refreshToken,
                user._id.toString()
            );

            setRefreshTokenCookie(
                res,
                refreshToken
            );

            return res.status(200).json({
                message:
                    "Login successful.",
                token:
                    accessToken,
                user: {
                    id:
                        user._id,
                    fullName:
                        user.fullName,
                    email:
                        user.email,
                    isEmailVerified:
                        user.isEmailVerified
                }
            });

        } catch (error) {

            console.error(
                "Login error:",
                error
            );

            return res.status(500).json({
                message:
                    "Unable to log in."
            });
        }
    }
);

app.get(
    "/api/auth/me",
    authenticateToken,
    async (req, res) => {
        try {

            const user =
                await User.findById(
                    req.user.userId
                ).select(
                    "-password -verificationOTP -verificationOTPExpires -passwordResetOTP -passwordResetOTPExpires -passwordResetToken -passwordResetTokenExpires"
                );

            if (!user) {
                return res.status(404).json({
                    message:
                        "User not found."
                });
            }

            return res.status(200).json({
                user
            });

        } catch (error) {

            console.error(
                "Get current user error:",
                error
            );

            return res.status(500).json({
                message:
                    "Unable to retrieve user information."
            });
        }
    }
);

app.post(
    "/api/auth/refresh",
    async (req, res) => {
        try {

            const oldRefreshToken =
                req.cookies[
                    REFRESH_TOKEN_COOKIE_NAME
                ];

            if (!oldRefreshToken) {
                return res.status(401).json({
                    message:
                        "Refresh token not found."
                });
            }

            const refreshSession =
                await getRefreshTokenSession(
                    oldRefreshToken
                );

            if (!refreshSession) {

                clearRefreshTokenCookie(
                    res
                );

                return res.status(401).json({
                    message:
                        "Invalid or expired refresh token."
                });
            }

            const user =
                await User.findById(
                    refreshSession.data.userId
                );

            if (!user) {

                await deleteRefreshTokenSession(
                    oldRefreshToken
                );

                clearRefreshTokenCookie(
                    res
                );

                return res.status(401).json({
                    message:
                        "User account no longer exists."
                });
            }

            if (
                !user.isEmailVerified
            ) {

                await deleteRefreshTokenSession(
                    oldRefreshToken
                );

                clearRefreshTokenCookie(
                    res
                );

                return res.status(403).json({
                    message:
                        "Email verification is required."
                });
            }

            await deleteRefreshTokenSession(
                oldRefreshToken
            );

            const newAccessToken =
                createAccessToken(
                    user._id.toString()
                );

            const newRefreshToken =
                generateRefreshToken();

            await createRefreshTokenSession(
                newRefreshToken,
                user._id.toString()
            );

            setRefreshTokenCookie(
                res,
                newRefreshToken
            );

            return res.status(200).json({
                message:
                    "Authentication refreshed successfully.",
                token:
                    newAccessToken
            });

        } catch (error) {

            console.error(
                "Refresh token error:",
                error
            );

            return res.status(500).json({
                message:
                    "Unable to refresh authentication."
            });
        }
    }
);

app.post(
    "/api/auth/logout",
    async (req, res) => {
        try {

            const refreshToken =
                req.cookies[
                    REFRESH_TOKEN_COOKIE_NAME
                ];

            if (refreshToken) {

                await deleteRefreshTokenSession(
                    refreshToken
                );
            }

            clearRefreshTokenCookie(
                res
            );

            return res.status(200).json({
                message:
                    "Logout successful."
            });

        } catch (error) {

            console.error(
                "Logout error:",
                error
            );

            clearRefreshTokenCookie(
                res
            );

            return res.status(200).json({
                message:
                    "Logout successful."
            });
        }
    }
);

app.post(
    "/api/auth/logout-all",
    authenticateToken,
    async (req, res) => {
        try {

            const userId =
                req.user.userId;

            await deleteAllUserSessions(
                userId
            );

            clearRefreshTokenCookie(
                res
            );

            return res.status(200).json({
                message:
                    "Logged out from all devices successfully."
            });

        } catch (error) {

            console.error(
                "Logout all devices error:",
                error
            );

            return res.status(500).json({
                message:
                    "Unable to log out from all devices."
            });
        }
    }
);

app.post(
    "/api/auth/forgot-password",
    async (req, res) => {
        try {

            const {
                email
            } = req.body;

            if (!email) {
                return res.status(400).json({
                    message:
                        "Email is required."
                });
            }

            const normalizedEmail =
                email
                    .trim()
                    .toLowerCase();

            const rateLimitKey =
                `auth:password-reset:${normalizedEmail}`;

            const currentCount =
                await redisClient.incr(
                    rateLimitKey
                );

            if (
                currentCount === 1
            ) {
                await redisClient.expire(
                    rateLimitKey,
                    OTP_REQUEST_WINDOW_SECONDS
                );
            }

            if (
                currentCount >
                OTP_REQUEST_LIMIT
            ) {
                return res.status(429).json({
                    message:
                        "Too many password reset requests. Please try again later."
                });
            }

            const user =
                await User.findOne({
                    email:
                        normalizedEmail
                });

            if (!user) {
                return res.status(200).json({
                    message:
                        "If an account exists with this email, a password reset code has been sent."
                });
            }

            const passwordResetOTP =
                generateOTP();

            user.passwordResetOTP =
                passwordResetOTP;

            user.passwordResetOTPExpires =
                new Date(
                    Date.now() +
                    10 * 60 * 1000
                );

            user.passwordResetToken =
                null;

            user.passwordResetTokenExpires =
                null;

            await user.save();

            await sendPasswordResetEmail(
                user.email,
                user.fullName,
                passwordResetOTP
            );

            return res.status(200).json({
                message:
                    "If an account exists with this email, a password reset code has been sent."
            });

        } catch (error) {

            console.error(
                "Forgot password error:",
                error
            );

            return res.status(500).json({
                message:
                    "Unable to process password reset request."
            });
        }
    }
);

app.post(
    "/api/auth/verify-reset-otp",
    async (req, res) => {
        try {

            const {
                email,
                otp
            } = req.body;

            if (
                !email ||
                !otp
            ) {
                return res.status(400).json({
                    message:
                        "Email and reset code are required."
                });
            }

            const normalizedEmail =
                email
                    .trim()
                    .toLowerCase();

            const user =
                await User.findOne({
                    email:
                        normalizedEmail
                });

            if (!user) {
                return res.status(400).json({
                    message:
                        "Invalid password reset request."
                });
            }

            if (
                !user.passwordResetOTP ||
                !user.passwordResetOTPExpires
            ) {
                return res.status(400).json({
                    message:
                        "Password reset code is invalid or expired."
                });
            }

            if (
                user.passwordResetOTP !==
                otp
            ) {
                return res.status(400).json({
                    message:
                        "Invalid password reset code."
                });
            }

            if (
                user.passwordResetOTPExpires <
                new Date()
            ) {

                user.passwordResetOTP =
                    null;

                user.passwordResetOTPExpires =
                    null;

                await user.save();

                return res.status(400).json({
                    message:
                        "Password reset code has expired."
                });
            }

            const resetToken =
                generatePasswordResetToken();

            user.passwordResetToken =
                resetToken;

            user.passwordResetTokenExpires =
                new Date(
                    Date.now() +
                    10 * 60 * 1000
                );

            user.passwordResetOTP =
                null;

            user.passwordResetOTPExpires =
                null;

            await user.save();

            return res.status(200).json({
                message:
                    "Password reset code verified successfully.",
                resetToken
            });

        } catch (error) {

            console.error(
                "Verify reset OTP error:",
                error
            );

            return res.status(500).json({
                message:
                    "Unable to verify password reset code."
            });
        }
    }
);

app.post(
    "/api/auth/reset-password",
    async (req, res) => {
        try {

            const {
                email,
                resetToken,
                newPassword
            } = req.body;

            if (
                !email ||
                !resetToken ||
                !newPassword
            ) {
                return res.status(400).json({
                    message:
                        "Email, reset token and new password are required."
                });
            }

            const normalizedEmail =
                email
                    .trim()
                    .toLowerCase();

            const passwordValidation =
                validatePassword(
                    newPassword
                );

            if (
                !passwordValidation.valid
            ) {
                return res.status(400).json({
                    message:
                        passwordValidation.message
                });
            }

            const user =
                await User.findOne({
                    email:
                        normalizedEmail
                });

            if (!user) {
                return res.status(400).json({
                    message:
                        "Invalid password reset request."
                });
            }

            if (
                !user.passwordResetToken ||
                !user.passwordResetTokenExpires
            ) {
                return res.status(400).json({
                    message:
                        "Password reset request is invalid or has expired."
                });
            }

            if (
                user.passwordResetToken !==
                resetToken
            ) {
                return res.status(400).json({
                    message:
                        "Invalid password reset token."
                });
            }

            if (
                user.passwordResetTokenExpires <
                new Date()
            ) {

                user.passwordResetToken =
                    null;

                user.passwordResetTokenExpires =
                    null;

                user.passwordResetOTP =
                    null;

                user.passwordResetOTPExpires =
                    null;

                await user.save();

                return res.status(400).json({
                    message:
                        "Password reset request has expired."
                });
            }

            const hashedPassword =
                await bcrypt.hash(
                    newPassword,
                    12
                );

            user.password =
                hashedPassword;

            user.passwordResetOTP =
                null;

            user.passwordResetOTPExpires =
                null;

            user.passwordResetToken =
                null;

            user.passwordResetTokenExpires =
                null;

            await user.save();

            await deleteAllUserSessions(
                user._id.toString()
            );

            return res.status(200).json({
                message:
                    "Password reset successful. Please log in again."
            });

        } catch (error) {

            console.error(
                "Reset password error:",
                error
            );

            return res.status(500).json({
                message:
                    "Unable to reset password."
            });
        }
    }
);

const startServer = async () => {
    try {

        await connectDatabase();

        await connectRedis();

        await verifyEmailConnection();

        app.listen(
            PORT,
            () => {
                console.log(
                    `Server running on port ${PORT}.`
                );
            }
        );

    } catch (error) {

        console.error(
            "Server startup failed:",
            error
        );

        process.exit(1);
    }
};

startServer();
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        fullName: {
            type: String,
            required: true,
            trim: true
        },

        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true
        },

        password: {
            type: String,
            required: true
        },

        isEmailVerified: {
            type: Boolean,
            default: false
        },

        verificationOTP: {
            type: String,
            default: null
        },

        verificationOTPExpires: {
            type: Date,
            default: null
        },

        passwordResetOTP: {
            type: String,
            default: null
        },

        passwordResetOTPExpires: {
            type: Date,
            default: null
        },

        passwordResetToken: {
            type: String,
            default: null
        },

        passwordResetTokenExpires: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);

const User = mongoose.model("User", userSchema);

module.exports = User;
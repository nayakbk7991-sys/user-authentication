import { useState } from "react";
import {
    Link,
    useLocation,
    useNavigate
} from "react-router-dom";
import "./ResetPassword.css";

function ResetPassword() {

    const location = useLocation();
    const navigate = useNavigate();

    const [email, setEmail] = useState(
        location.state?.email || ""
    );

    const [otp, setOtp] = useState("");
    const [resetToken, setResetToken] = useState("");

    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [showNewPassword, setShowNewPassword] =
        useState(false);

    const [showConfirmPassword, setShowConfirmPassword] =
        useState(false);

    const [otpVerified, setOtpVerified] =
        useState(false);

    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const [loading, setLoading] = useState(false);
    const [verifyingOtp, setVerifyingOtp] =
        useState(false);

    const handleOtpChange = (event) => {

        const value = event.target.value
            .replace(/\D/g, "")
            .slice(0, 6);

        setOtp(value);
        setError("");
        setMessage("");
        setOtpVerified(false);
        setResetToken("");
    };

    const handleVerifyOtp = async () => {

        const normalizedEmail =
            email.trim().toLowerCase();

        setError("");
        setMessage("");

        if (!normalizedEmail) {

            setError(
                "Please enter your email address."
            );

            return;
        }

        if (otp.length !== 6) {

            setError(
                "Please enter the 6-digit reset code."
            );

            return;
        }

        setVerifyingOtp(true);

        try {

            const response = await fetch(
                "http://localhost:5000/api/auth/verify-reset-otp",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        email: normalizedEmail,
                        otp
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {

                setError(
                    data.message ||
                    "Unable to verify the reset code."
                );

                return;
            }

            setResetToken(
                data.resetToken
            );

            setOtpVerified(true);

            setMessage(
                "Reset code verified. You can now create a new password."
            );

        } catch (error) {

            setError(
                "Unable to connect to the server. Please try again."
            );

        } finally {

            setVerifyingOtp(false);

        }
    };

    const handleSubmit = async (event) => {

        event.preventDefault();

        const normalizedEmail =
            email.trim().toLowerCase();

        setError("");
        setMessage("");

        if (!normalizedEmail) {

            setError(
                "Please enter your email address."
            );

            return;
        }

        if (!otpVerified || !resetToken) {

            setError(
                "Please verify the reset code first."
            );

            return;
        }

        if (!newPassword) {

            setError(
                "Please enter a new password."
            );

            return;
        }

        if (newPassword.length < 8) {

            setError(
                "Password must contain at least 8 characters."
            );

            return;
        }

        if (!confirmPassword) {

            setError(
                "Please confirm your new password."
            );

            return;
        }

        if (newPassword !== confirmPassword) {

            setError(
                "Passwords do not match."
            );

            return;
        }

        setLoading(true);

        try {

            const response = await fetch(
                "http://localhost:5000/api/auth/reset-password",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        email: normalizedEmail,
                        resetToken,
                        newPassword
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {

                setError(
                    data.message ||
                    "Unable to reset your password."
                );

                return;
            }

            setMessage(
                "Password reset successfully. Redirecting to Sign In..."
            );

            setTimeout(() => {

                navigate("/login");

            }, 1500);

        } catch (error) {

            setError(
                "Unable to connect to the server. Please try again."
            );

        } finally {

            setLoading(false);

        }
    };

    return (
        <main className="reset-password-page">

            <section className="reset-password-card">

                <div className="reset-password-icon">
                    🔐
                </div>

                <div className="reset-password-header">

                    <h1>
                        Reset your password
                    </h1>

                    <p>
                        Verify the reset code sent to your
                        email and create a new password.
                    </p>

                </div>

                <form
                    className="reset-password-form"
                    onSubmit={handleSubmit}
                >

                    <div className="reset-password-form-group">

                        <label htmlFor="reset-email">
                            Email Address
                        </label>

                        <input
                            id="reset-email"
                            type="email"
                            placeholder="Enter your email address"
                            value={email}
                            onChange={(event) => {

                                setEmail(
                                    event.target.value
                                );

                                setError("");
                                setMessage("");

                            }}
                            disabled={
                                verifyingOtp ||
                                loading ||
                                otpVerified
                            }
                            autoComplete="email"
                        />

                    </div>

                    <div className="reset-password-form-group">

                        <label htmlFor="reset-otp">
                            Reset Code
                        </label>

                        <div className="reset-password-input-row">

                            <input
                                id="reset-otp"
                                type="text"
                                inputMode="numeric"
                                autoComplete="one-time-code"
                                placeholder="Enter 6-digit reset code"
                                value={otp}
                                onChange={handleOtpChange}
                                disabled={
                                    verifyingOtp ||
                                    loading ||
                                    otpVerified
                                }
                                maxLength={6}
                            />

                            <button
                                type="button"
                                className="reset-password-toggle-button"
                                onClick={handleVerifyOtp}
                                disabled={
                                    verifyingOtp ||
                                    loading ||
                                    otpVerified
                                }
                            >
                                {otpVerified
                                    ? "Verified"
                                    : verifyingOtp
                                        ? "Verifying..."
                                        : "Verify Code"}
                            </button>

                        </div>

                    </div>

                    {otpVerified && (

                        <>
                            <div className="reset-password-form-group">

                                <label htmlFor="new-password">
                                    New Password
                                </label>

                                <div className="reset-password-input-row">

                                    <input
                                        id="new-password"
                                        type={
                                            showNewPassword
                                                ? "text"
                                                : "password"
                                        }
                                        placeholder="Enter your new password"
                                        value={newPassword}
                                        onChange={(event) => {

                                            setNewPassword(
                                                event.target.value
                                            );

                                            setError("");
                                            setMessage("");

                                        }}
                                        disabled={loading}
                                        autoComplete="new-password"
                                    />

                                    <button
                                        type="button"
                                        className="reset-password-toggle-button"
                                        onClick={() =>
                                            setShowNewPassword(
                                                (previousValue) =>
                                                    !previousValue
                                            )
                                        }
                                        disabled={loading}
                                    >
                                        {showNewPassword
                                            ? "Hide"
                                            : "Show"}
                                    </button>

                                </div>

                            </div>

                            <div className="reset-password-form-group">

                                <label htmlFor="confirm-new-password">
                                    Confirm New Password
                                </label>

                                <div className="reset-password-input-row">

                                    <input
                                        id="confirm-new-password"
                                        type={
                                            showConfirmPassword
                                                ? "text"
                                                : "password"
                                        }
                                        placeholder="Confirm your new password"
                                        value={confirmPassword}
                                        onChange={(event) => {

                                            setConfirmPassword(
                                                event.target.value
                                            );

                                            setError("");
                                            setMessage("");

                                        }}
                                        disabled={loading}
                                        autoComplete="new-password"
                                    />

                                    <button
                                        type="button"
                                        className="reset-password-toggle-button"
                                        onClick={() =>
                                            setShowConfirmPassword(
                                                (previousValue) =>
                                                    !previousValue
                                            )
                                        }
                                        disabled={loading}
                                    >
                                        {showConfirmPassword
                                            ? "Hide"
                                            : "Show"}
                                    </button>

                                </div>

                            </div>

                            <button
                                type="submit"
                                className="reset-password-button"
                                disabled={loading}
                            >
                                {loading
                                    ? "Resetting Password..."
                                    : "Reset Password"}
                            </button>
                        </>

                    )}

                    {error && (
                        <div className="reset-password-error">
                            {error}
                        </div>
                    )}

                    {message && (
                        <div className="reset-password-success">
                            {message}
                        </div>
                    )}

                </form>

                <div className="reset-password-footer">

                    <span>
                        Remember your password?
                    </span>

                    <Link to="/login">
                        Sign In
                    </Link>

                </div>

            </section>

        </main>
    );
}

export default ResetPassword;
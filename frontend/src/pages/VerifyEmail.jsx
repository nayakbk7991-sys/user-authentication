import { useEffect, useState } from "react";
import {
    Link,
    useLocation,
    useNavigate
} from "react-router-dom";
import "./VerifyEmail.css";

function VerifyEmail() {

    const location = useLocation();
    const navigate = useNavigate();

    const [email, setEmail] = useState(
        location.state?.email || ""
    );

    const [otp, setOtp] = useState("");
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);

    useEffect(() => {

        if (resendCooldown <= 0) {
            return;
        }

        const timer = setInterval(() => {

            setResendCooldown((previousValue) => {

                if (previousValue <= 1) {
                    clearInterval(timer);
                    return 0;
                }

                return previousValue - 1;

            });

        }, 1000);

        return () => clearInterval(timer);

    }, [resendCooldown]);

    const handleEmailChange = (event) => {

        setEmail(event.target.value);
        setError("");
        setMessage("");

    };

    const handleOtpChange = (event) => {

        const value = event.target.value
            .replace(/\D/g, "")
            .slice(0, 6);

        setOtp(value);
        setError("");
        setMessage("");

    };

    const handleResend = async () => {

        const normalizedEmail =
            email.trim().toLowerCase();

        if (!normalizedEmail) {

            setError(
                "Please enter your email address."
            );

            return;
        }

        if (resendCooldown > 0) {
            return;
        }

        setResending(true);
        setError("");
        setMessage("");

        try {

            const response = await fetch(
                "http://localhost:5000/api/auth/resend-verification",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        email: normalizedEmail
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {

                setError(
                    data.message ||
                    "Unable to resend the verification code."
                );

                return;
            }

            setOtp("");

            setMessage(
                "A new verification code has been sent to your email."
            );

            setResendCooldown(60);

        } catch (error) {

            setError(
                "Unable to connect to the server. Please try again."
            );

        } finally {

            setResending(false);

        }
    };

    const handleSubmit = async (event) => {

        event.preventDefault();

        const normalizedEmail =
            email.trim().toLowerCase();

        if (!normalizedEmail) {

            setError(
                "Please enter your email address."
            );

            return;
        }

        if (otp.length !== 6) {

            setError(
                "Please enter the 6-digit verification code."
            );

            return;
        }

        setLoading(true);
        setError("");
        setMessage("");

        try {

            const response = await fetch(
                "http://localhost:5000/api/auth/verify-email",
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
                    "Unable to verify your email address."
                );

                return;
            }

            setMessage(
                "Email verified successfully. Redirecting to Sign In..."
            );

            setTimeout(() => {

                navigate("/login");

            }, 1200);

        } catch (error) {

            setError(
                "Unable to connect to the server. Please try again."
            );

        } finally {

            setLoading(false);

        }
    };

    return (
        <main className="verify-email-page">

            <section className="verify-email-card">

                <div className="verify-email-icon">
                    ✓
                </div>

                <div className="verify-email-header">

                    <h1>
                        Verify your email
                    </h1>

                    <p>
                        Enter your email address to receive a
                        verification code.
                    </p>

                </div>

                <form
                    className="verify-email-form"
                    onSubmit={handleSubmit}
                >

                    <div className="verify-email-form-group">

                        <label htmlFor="verification-email">
                            Email Address
                        </label>

                        <input
                            id="verification-email"
                            type="email"
                            placeholder="Enter your email address"
                            value={email}
                            onChange={handleEmailChange}
                            disabled={loading || resending}
                            autoComplete="email"
                        />

                    </div>

                    <div className="verify-email-form-group">

                        <label htmlFor="verification-otp">
                            Verification Code
                        </label>

                        <input
                            id="verification-otp"
                            type="text"
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            placeholder="Enter 6-digit code"
                            value={otp}
                            onChange={handleOtpChange}
                            disabled={loading || resending}
                            maxLength={6}
                        />

                    </div>

                    {error && (
                        <div className="verify-email-error">
                            {error}
                        </div>
                    )}

                    {message && (
                        <div className="verify-email-success">
                            {message}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="verify-email-button"
                        disabled={
                            loading ||
                            resending
                        }
                    >
                        {loading
                            ? "Verifying..."
                            : "Verify Email"}
                    </button>

                </form>

                <div className="resend-section">

                    <span>
                        Didn't receive the code?
                    </span>

                    <button
                        type="button"
                        className="resend-button"
                        onClick={handleResend}
                        disabled={
                            loading ||
                            resending ||
                            resendCooldown > 0
                        }
                    >
                        {resending
                            ? "Sending..."
                            : resendCooldown > 0
                                ? `Resend code in ${resendCooldown}s`
                                : "Resend code"}
                    </button>

                </div>

                <div className="verify-email-footer">

                    <span>
                        Need to create a new account?
                    </span>

                    <Link to="/register">
                        Register
                    </Link>

                </div>

            </section>

        </main>
    );
}

export default VerifyEmail;
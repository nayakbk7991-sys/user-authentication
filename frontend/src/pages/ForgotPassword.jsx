import { useState } from "react";
import {
    Link,
    useNavigate
} from "react-router-dom";
import "./ForgotPassword.css";

function ForgotPassword() {

    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

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

        setLoading(true);

        try {

            const response = await fetch(
                "http://localhost:5000/api/auth/forgot-password",
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

            const data =
                await response.json();

            if (!response.ok) {

                setError(
                    data.message ||
                    "Unable to process your request."
                );

                return;
            }

            setMessage(
                "If an account exists for this email, a password reset code has been sent."
            );

            setTimeout(() => {

                navigate(
                    "/reset-password",
                    {
                        state: {
                            email: normalizedEmail
                        }
                    }
                );

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
        <main className="forgot-password-page">

            <section className="forgot-password-card">

                <div className="forgot-password-icon">
                    🔑
                </div>

                <div className="forgot-password-header">

                    <h1>
                        Forgot your password?
                    </h1>

                    <p>
                        Enter your email address and we
                        will send you a password reset code.
                    </p>

                </div>

                <form
                    className="forgot-password-form"
                    onSubmit={handleSubmit}
                >

                    <div className="forgot-password-form-group">

                        <label htmlFor="forgot-password-email">
                            Email Address
                        </label>

                        <input
                            id="forgot-password-email"
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
                            disabled={loading}
                            autoComplete="email"
                        />

                    </div>

                    {error && (
                        <div className="forgot-password-error">
                            {error}
                        </div>
                    )}

                    {message && (
                        <div className="forgot-password-success">
                            {message}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="forgot-password-button"
                        disabled={loading}
                    >
                        {loading
                            ? "Sending..."
                            : "Send Reset Code"}
                    </button>

                </form>

                <div className="forgot-password-footer">

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

export default ForgotPassword;
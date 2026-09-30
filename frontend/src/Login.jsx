import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import "./Login.css";

function Login() {

    const navigate = useNavigate();

    const { login } = useAuth();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState({});
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (event) => {

        event.preventDefault();

        const newErrors = {};

        if (!email.trim()) {
            newErrors.email =
                "Email address is required.";
        }

        if (!password) {
            newErrors.password =
                "Password is required.";
        }

        setErrors(newErrors);
        setMessage("");

        if (Object.keys(newErrors).length > 0) {
            return;
        }

        setLoading(true);

        try {

            const response = await fetch(
                "http://localhost:5000/api/auth/login",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        email: email.trim(),
                        password
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {

                setMessage(
                    data.message ||
                    "Unable to sign in."
                );

                return;
            }

            login(
                data.token,
                data.user
            );

            setMessage(
                "Sign in successful."
            );

            setTimeout(() => {

                navigate("/dashboard");

            }, 800);

        } catch (error) {

            setMessage(
                "Unable to connect to the server. Please try again."
            );

        } finally {

            setLoading(false);

        }

    };

    return (
        <main className="login-page">

            <section className="login-card">

                <div className="login-brand">

                    <div className="login-brand-icon">
                        🔐
                    </div>

                    <span>
                        User Authentication
                    </span>

                </div>

                <div className="login-header">

                    <h1>
                        Welcome back
                    </h1>

                    <p>
                        Sign in to securely access your account.
                    </p>

                </div>

                <form
                    className="login-form"
                    onSubmit={handleSubmit}
                >

                    <div className="login-form-group">

                        <label htmlFor="login-email">
                            Email Address
                        </label>

                        <input
                            id="login-email"
                            type="email"
                            placeholder="Enter your email address"
                            value={email}
                            onChange={(event) => {

                                setEmail(
                                    event.target.value
                                );

                                setErrors(
                                    (previousErrors) => ({
                                        ...previousErrors,
                                        email: ""
                                    })
                                );

                                setMessage("");

                            }}
                            disabled={loading}
                            autoComplete="email"
                        />

                        {errors.email && (
                            <span className="login-field-error">
                                {errors.email}
                            </span>
                        )}

                    </div>

                    <div className="login-form-group">

                        <label htmlFor="login-password">
                            Password
                        </label>

                        <div className="login-password-row">

                            <input
                                id="login-password"
                                type={
                                    showPassword
                                        ? "text"
                                        : "password"
                                }
                                placeholder="Enter your password"
                                value={password}
                                onChange={(event) => {

                                    setPassword(
                                        event.target.value
                                    );

                                    setErrors(
                                        (previousErrors) => ({
                                            ...previousErrors,
                                            password: ""
                                        })
                                    );

                                    setMessage("");

                                }}
                                disabled={loading}
                                autoComplete="current-password"
                            />

                            <button
                                type="button"
                                className="login-toggle-button"
                                onClick={() =>
                                    setShowPassword(
                                        (previousValue) =>
                                            !previousValue
                                    )
                                }
                                disabled={loading}
                            >
                                {showPassword
                                    ? "Hide"
                                    : "Show"}
                            </button>

                        </div>

                        {errors.password && (
                            <span className="login-field-error">
                                {errors.password}
                            </span>
                        )}

                    </div>

                    <div className="login-options">

                        <button
                            type="button"
                            className="forgot-password-button"
                            onClick={() =>
                                navigate("/forgot-password")
                            }
                            disabled={loading}
                        >
                            Forgot Password?
                        </button>

                    </div>

                    <button
                        type="submit"
                        className="login-button"
                        disabled={loading}
                    >
                        {loading
                            ? "Signing In..."
                            : "Sign In"}
                    </button>

                    {message && (
                        <div className="login-message">
                            {message}
                        </div>
                    )}

                </form>

            </section>

        </main>
    );
}

export default Login;
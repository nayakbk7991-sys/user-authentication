import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Registration.css";

function Registration() {

    const navigate = useNavigate();

    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [agreeTerms, setAgreeTerms] = useState(false);

    const [errors, setErrors] = useState({});
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (event) => {

        event.preventDefault();

        const newErrors = {};

        if (!fullName.trim()) {

            newErrors.fullName =
                "Full name is required.";

        }

        if (!email.trim()) {

            newErrors.email =
                "Email address is required.";

        }

        if (!password) {

            newErrors.password =
                "Password is required.";

        } else if (password.length < 8) {

            newErrors.password =
                "Password must contain at least 8 characters.";

        }

        if (!confirmPassword) {

            newErrors.confirmPassword =
                "Please confirm your password.";

        } else if (password !== confirmPassword) {

            newErrors.confirmPassword =
                "Passwords do not match.";

        }

        if (!agreeTerms) {

            newErrors.terms =
                "Please accept the terms and conditions.";

        }

        setErrors(newErrors);
        setMessage("");

        if (Object.keys(newErrors).length > 0) {

            return;

        }

        setLoading(true);

        try {

            const response = await fetch(
                "http://localhost:5000/api/auth/register",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        fullName:
                            fullName.trim(),

                        email:
                            email.trim().toLowerCase(),

                        password
                    })
                }
            );

            const data =
                await response.json();

            if (!response.ok) {

                setMessage(
                    data.message ||
                    "Unable to create your account."
                );

                return;

            }

            setMessage(
                "Account created successfully. Redirecting..."
            );

            setTimeout(() => {

                navigate(
                    "/verify-email",
                    {
                        state: {
                            email:
                                email
                                    .trim()
                                    .toLowerCase()
                        }
                    }
                );

            }, 800);

        } catch (error) {

            console.error(
                "Registration request failed:",
                error
            );

            setMessage(
                "Unable to connect to the server. Please try again."
            );

        } finally {

            setLoading(false);

        }

    };

    return (
        <main className="registration-page">

            <section className="registration-card">

                <div className="registration-brand">

                    <div className="registration-brand-icon">
                        🔐
                    </div>

                    <span>
                        User Authentication
                    </span>

                </div>

                <div className="registration-header">

                    <h1>
                        Create your account
                    </h1>

                    <p>
                        Register to get started with your account.
                    </p>

                </div>

                <form
                    className="registration-form"
                    onSubmit={handleSubmit}
                >

                    <div className="registration-form-group">

                        <label htmlFor="registration-name">
                            Full Name
                        </label>

                        <input
                            id="registration-name"
                            type="text"
                            placeholder="Enter your full name"
                            value={fullName}
                            onChange={(event) => {

                                setFullName(
                                    event.target.value
                                );

                                setErrors(
                                    (previousErrors) => ({
                                        ...previousErrors,
                                        fullName: ""
                                    })
                                );

                                setMessage("");

                            }}
                            disabled={loading}
                            autoComplete="name"
                        />

                        {errors.fullName && (
                            <span className="registration-field-error">
                                {errors.fullName}
                            </span>
                        )}

                    </div>

                    <div className="registration-form-group">

                        <label htmlFor="registration-email">
                            Email Address
                        </label>

                        <input
                            id="registration-email"
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
                            <span className="registration-field-error">
                                {errors.email}
                            </span>
                        )}

                    </div>

                    <div className="registration-form-group">

                        <label htmlFor="registration-password">
                            Password
                        </label>

                        <div className="registration-password-row">

                            <input
                                id="registration-password"
                                type={
                                    showPassword
                                        ? "text"
                                        : "password"
                                }
                                placeholder="Create a password"
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
                                autoComplete="new-password"
                            />

                            <button
                                type="button"
                                className="registration-toggle-button"
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
                            <span className="registration-field-error">
                                {errors.password}
                            </span>
                        )}

                    </div>

                    <div className="registration-form-group">

                        <label htmlFor="registration-confirm-password">
                            Confirm Password
                        </label>

                        <div className="registration-password-row">

                            <input
                                id="registration-confirm-password"
                                type={
                                    showConfirmPassword
                                        ? "text"
                                        : "password"
                                }
                                placeholder="Confirm your password"
                                value={confirmPassword}
                                onChange={(event) => {

                                    setConfirmPassword(
                                        event.target.value
                                    );

                                    setErrors(
                                        (previousErrors) => ({
                                            ...previousErrors,
                                            confirmPassword: ""
                                        })
                                    );

                                    setMessage("");

                                }}
                                disabled={loading}
                                autoComplete="new-password"
                            />

                            <button
                                type="button"
                                className="registration-toggle-button"
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

                        {errors.confirmPassword && (
                            <span className="registration-field-error">
                                {errors.confirmPassword}
                            </span>
                        )}

                    </div>

                    <div className="registration-terms">

                        <input
                            id="registration-terms"
                            type="checkbox"
                            checked={agreeTerms}
                            onChange={(event) => {

                                setAgreeTerms(
                                    event.target.checked
                                );

                                setErrors(
                                    (previousErrors) => ({
                                        ...previousErrors,
                                        terms: ""
                                    })
                                );

                            }}
                            disabled={loading}
                        />

                        <label htmlFor="registration-terms">
                            I agree to the terms and conditions.
                        </label>

                    </div>

                    {errors.terms && (
                        <span className="registration-field-error">
                            {errors.terms}
                        </span>
                    )}

                    <button
                        type="submit"
                        className="registration-button"
                        disabled={loading}
                    >
                        {loading
                            ? "Creating Account..."
                            : "Create Account"}
                    </button>

                    {message && (
                        <div className="registration-message">
                            {message}
                        </div>
                    )}

                </form>

                <div className="signin-section">

                    <span>
                        Already have an account?
                    </span>

                    <Link to="/login">
                        Sign In
                    </Link>

                </div>

            </section>

        </main>
    );
}

export default Registration;
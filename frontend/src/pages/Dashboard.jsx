import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../utils/api";
import "./Dashboard.css";

function Dashboard() {

    const navigate = useNavigate();

    const {
        token,
        logout
    } = useAuth();

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");

    useEffect(() => {

        if (!token) {

            navigate("/login", {
                replace: true
            });

            return;
        }

        const fetchUser = async () => {

            try {

                const {
                    response,
                    data
                } = await apiRequest(
                    "/api/auth/me"
                );

                if (!response.ok) {

                    if (response.status !== 401) {

                        setMessage(
                            data.message ||
                            "Unable to load your account."
                        );

                    }

                    return;
                }

                setUser(data.user);

            } catch (error) {

                setMessage(
                    "Unable to connect to the server."
                );

            } finally {

                setLoading(false);

            }

        };

        fetchUser();

    }, [token, navigate]);

    const handleLogout = () => {

        logout();

        navigate("/login", {
            replace: true
        });

    };

    if (loading) {

        return (
            <main className="dashboard-page">

                <section className="dashboard-card">

                    <p>
                        Loading your account...
                    </p>

                </section>

            </main>
        );

    }

    if (message) {

        return (
            <main className="dashboard-page">

                <section className="dashboard-card">

                    <p>
                        {message}
                    </p>

                </section>

            </main>
        );

    }

    return (
        <main className="dashboard-page">

            <section className="dashboard-card">

                <div className="dashboard-header">

                    <div>

                        <span className="dashboard-label">
                            USER DASHBOARD
                        </span>

                        <h1>
                            Welcome, {user?.fullName}
                        </h1>

                        <p>
                            You are successfully authenticated.
                        </p>

                    </div>

                    <button
                        type="button"
                        className="logout-button"
                        onClick={handleLogout}
                    >
                        Logout
                    </button>

                </div>

                <div className="dashboard-user">

                    <div className="dashboard-user-row">

                        <span>
                            Full Name
                        </span>

                        <strong>
                            {user?.fullName}
                        </strong>

                    </div>

                    <div className="dashboard-user-row">

                        <span>
                            Email Address
                        </span>

                        <strong>
                            {user?.email}
                        </strong>

                    </div>

                    <div className="dashboard-user-row">

                        <span>
                            Email Status
                        </span>

                        <strong>
                            {user?.isEmailVerified
                                ? "Verified"
                                : "Not Verified"}
                        </strong>

                    </div>

                </div>

            </section>

        </main>
    );
}

export default Dashboard;
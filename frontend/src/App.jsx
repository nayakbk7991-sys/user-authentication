import {
    BrowserRouter,
    Navigate,
    Route,
    Routes
} from "react-router-dom";

import Registration from "./components/Registration";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./Login";
import VerifyEmail from "./pages/VerifyEmail";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";

function App() {

    return (
        <BrowserRouter>

            <Routes>

                <Route
                    path="/"
                    element={
                        <Navigate
                            to="/register"
                            replace
                        />
                    }
                />

                <Route
                    path="/register"
                    element={<Registration />}
                />

                <Route
                    path="/verify-email"
                    element={<VerifyEmail />}
                />

                <Route
                    path="/login"
                    element={<Login />}
                />

                <Route
                    path="/forgot-password"
                    element={<ForgotPassword />}
                />

                <Route
                    path="/reset-password"
                    element={<ResetPassword />}
                />

                <Route element={<ProtectedRoute />}>

                    <Route
                        path="/dashboard"
                        element={<Dashboard />}
                    />

                </Route>

            </Routes>

        </BrowserRouter>
    );
}

export default App;
import {
    createContext,
    useContext,
    useEffect,
    useState
} from "react";

import {
    apiRequest,
    clearAccessToken,
    getCurrentUser,
    setAccessToken
} from "../utils/api";

const AuthContext =
    createContext(null);

function AuthProvider({ children }) {

    const [token, setToken] =
        useState(null);

    const [user, setUser] =
        useState(null);

    const [loading, setLoading] =
        useState(true);

    useEffect(() => {

        const restoreAuthentication =
            async () => {

                try {

                    const refreshResult =
                        await apiRequest(
                            "/api/auth/refresh",
                            {
                                method: "POST"
                            },
                            false
                        );

                    if (
                        !refreshResult.response ||
                        !refreshResult.response.ok ||
                        !refreshResult.data.token
                    ) {

                        clearAccessToken();

                        setToken(null);
                        setUser(null);

                        return;
                    }

                    const newToken =
                        refreshResult.data.token;

                    setAccessToken(
                        newToken
                    );

                    setToken(
                        newToken
                    );

                    const userResult =
                        await getCurrentUser();

                    if (
                        userResult.response &&
                        userResult.response.ok &&
                        userResult.data.user
                    ) {

                        setUser(
                            userResult.data.user
                        );

                    } else {

                        clearAccessToken();

                        setToken(null);
                        setUser(null);
                    }

                } catch (error) {

                    clearAccessToken();

                    setToken(null);
                    setUser(null);

                } finally {

                    setLoading(false);
                }
            };

        restoreAuthentication();

    }, []);

    const login = (
        newToken,
        newUser
    ) => {

        setAccessToken(
            newToken
        );

        setToken(
            newToken
        );

        setUser(
            newUser
        );
    };

    const logout = async () => {

        try {

            await apiRequest(
                "/api/auth/logout",
                {
                    method: "POST"
                },
                false
            );

        } catch (error) {

        } finally {

            clearAccessToken();

            setToken(null);
            setUser(null);
        }
    };

    const isAuthenticated =
        Boolean(token);

    if (loading) {
        return null;
    }

    return (
        <AuthContext.Provider
            value={{
                token,
                user,
                isAuthenticated,
                login,
                logout
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(
        AuthContext
    );
}

export default AuthProvider;
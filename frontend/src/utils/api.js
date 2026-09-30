const API_BASE_URL =
    "http://localhost:5000";

let accessToken = null;

let isRefreshing = false;

let refreshPromise = null;

export const setAccessToken = (
    newToken
) => {
    accessToken = newToken;
};

export const clearAccessToken = () => {
    accessToken = null;
};

const refreshAccessToken = async () => {

    if (isRefreshing) {
        return refreshPromise;
    }

    isRefreshing = true;

    refreshPromise =
        (async () => {

            try {

                const response =
                    await fetch(
                        `${API_BASE_URL}/api/auth/refresh`,
                        {
                            method: "POST",
                            credentials: "include"
                        }
                    );

                let data = {};

                try {

                    data =
                        await response.json();

                } catch (error) {

                    data = {};
                }

                if (
                    !response.ok
                ) {

                    clearAccessToken();

                    return null;
                }

                if (
                    !data.token
                ) {

                    clearAccessToken();

                    return null;
                }

                setAccessToken(
                    data.token
                );

                return data.token;

            } catch (error) {

                clearAccessToken();

                return null;

            } finally {

                isRefreshing = false;

                refreshPromise = null;
            }
        })();

    return refreshPromise;
};

export const apiRequest = async (
    endpoint,
    options = {},
    retry = true
) => {

    const headers = {
        "Content-Type":
            "application/json",
        ...(options.headers || {})
    };

    if (accessToken) {

        headers.Authorization =
            `Bearer ${accessToken}`;
    }

    try {

        const response =
            await fetch(
                `${API_BASE_URL}${endpoint}`,
                {
                    ...options,
                    headers,
                    credentials:
                        "include"
                }
            );

        let data = {};

        try {

            data =
                await response.json();

        } catch (error) {

            data = {};
        }

        if (
            response.status === 401 &&
            retry
        ) {

            const newAccessToken =
                await refreshAccessToken();

            if (newAccessToken) {

                return apiRequest(
                    endpoint,
                    options,
                    false
                );
            }

            window.location.href =
                "/login";

            return {
                response,
                data
            };
        }

        return {
            response,
            data
        };

    } catch (error) {

        return {
            response: null,
            data: {
                message:
                    "Unable to connect to the server."
            },
            error
        };
    }
};

export const getCurrentUser =
    async () => {

        return apiRequest(
            "/api/auth/me"
        );
    };
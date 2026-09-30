const {
    redisClient
} = require("../config/redis");

const {
    hashRefreshToken
} = require("./tokenUtils");

const REFRESH_TOKEN_TTL_SECONDS =
    7 * 24 * 60 * 60;

const createRefreshTokenSession = async (
    refreshToken,
    userId
) => {

    const hashedRefreshToken =
        hashRefreshToken(
            refreshToken
        );

    const sessionKey =
        `auth:refresh:${hashedRefreshToken}`;

    const sessionData = {
        userId,
        createdAt:
            new Date().toISOString()
    };

    await redisClient.set(
        sessionKey,
        JSON.stringify(sessionData),
        {
            EX:
                REFRESH_TOKEN_TTL_SECONDS
        }
    );

    return sessionKey;

};

const getRefreshTokenSession = async (
    refreshToken
) => {

    const hashedRefreshToken =
        hashRefreshToken(
            refreshToken
        );

    const sessionKey =
        `auth:refresh:${hashedRefreshToken}`;

    const sessionData =
        await redisClient.get(
            sessionKey
        );

    if (!sessionData) {

        return null;

    }

    return {
        sessionKey,
        data:
            JSON.parse(sessionData)
    };

};

const deleteRefreshTokenSession = async (
    refreshToken
) => {

    const hashedRefreshToken =
        hashRefreshToken(
            refreshToken
        );

    const sessionKey =
        `auth:refresh:${hashedRefreshToken}`;

    await redisClient.del(
        sessionKey
    );

};

module.exports = {
    createRefreshTokenSession,
    getRefreshTokenSession,
    deleteRefreshTokenSession
};
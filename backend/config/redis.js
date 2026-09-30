const redis = require("redis");

const redisClient =
    redis.createClient({
        url: "redis://127.0.0.1:6379"
    });

redisClient.on(
    "error",
    (error) => {

        console.error(
            "Redis error:",
            error.message
        );

    }
);

const connectRedis = async () => {

    try {

        await redisClient.connect();

        console.log(
            "Redis connected successfully."
        );

    } catch (error) {

        console.error(
            "Redis connection failed:",
            error.message
        );

        throw error;

    }

};

module.exports = {
    redisClient,
    connectRedis
};
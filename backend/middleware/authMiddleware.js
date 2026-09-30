const jwt = require("jsonwebtoken");

const authenticateToken = (req, res, next) => {

    try {

        const authorizationHeader =
            req.headers.authorization;

        if (!authorizationHeader) {

            return res.status(401).json({
                message:
                    "Authentication required."
            });

        }

        const parts =
            authorizationHeader.split(" ");

        if (
            parts.length !== 2 ||
            parts[0] !== "Bearer"
        ) {

            return res.status(401).json({
                message:
                    "Invalid authentication format."
            });

        }

        const token = parts[1];

        const decoded =
            jwt.verify(
                token,
                process.env.JWT_SECRET
            );

        req.user = {
            userId: decoded.userId
        };

        next();

    } catch (error) {

        return res.status(401).json({
            message:
                "Invalid or expired authentication token."
        });

    }

};

module.exports = authenticateToken;
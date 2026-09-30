const crypto = require("crypto");

const generateRefreshToken = () => {

    return crypto
        .randomBytes(64)
        .toString("hex");

};

const hashRefreshToken = (
    refreshToken
) => {

    return crypto
        .createHash("sha256")
        .update(refreshToken)
        .digest("hex");

};

module.exports = {
    generateRefreshToken,
    hashRefreshToken
};
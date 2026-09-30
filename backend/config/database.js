const mongoose = require("mongoose");

const connectDatabase = async () => {

    try {

        await mongoose.connect(
            "mongodb://127.0.0.1:27017/user_authentication"
        );

        console.log("MongoDB connected successfully.");

    } catch (error) {

        console.error("MongoDB connection failed:", error.message);
        process.exit(1);

    }
};

module.exports = connectDatabase;
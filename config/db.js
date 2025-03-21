const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
    try {
        // Since Mongoose v6, the options "useNewUrlParser" and "useUnifiedTopology"
        // are no longer required as they are now the defaults.
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`❌ MongoDB Connection Failed: ${error}`);
        process.exit(1);
    }
};

module.exports = connectDB;

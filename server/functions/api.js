const serverless = require('serverless-http');
const app = require('../server');
const connectDB = require('../config/db');

let isConnected = false;

module.exports.handler = async (event, context) => {
    // Preserve the connection between function calls
    context.callbackWaitsForEmptyEventLoop = false;

    if (!isConnected) {
        try {
            await connectDB();
            isConnected = true;
        } catch (error) {
            console.error('Database connection failed:', error);
        }
    }

    const handler = serverless(app);
    return await handler(event, context);
};

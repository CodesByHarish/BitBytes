const app = require('./server');
const connectDB = require('./config/db');
const dotenv = require('dotenv');

dotenv.config();

// Connect to database
connectDB();

const PORT = 5000;

app.listen(PORT, () => {
    console.log(`Local server running on port ${PORT}`);
});

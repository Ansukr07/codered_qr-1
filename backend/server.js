const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');

dotenv.config();

connectDB();

const app = express();

app.use(cors());
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/resources', require('./routes/resources'));
app.use('/api/scan', require('./routes/scan'));
app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/volunteers', require('./routes/volunteers'));
app.use('/api/help-requests', require('./routes/helpRequests'));
app.use('/api/announcements', require('./routes/announcements'));
app.use('/api/gamification', require('./routes/gamification'));

// Serve static files for proof uploads
app.use('/uploads', express.static('uploads'));


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

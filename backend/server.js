const express = require('express');
const https = require('https');
const http = require('http');
const dotenv = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const path = require('path');
const fs = require('fs');

// Load .env.local first, then .env as fallback
const envLocalPath = path.join(__dirname, '.env.local');
const envPath = path.join(__dirname, '.env');

if (fs.existsSync(envLocalPath)) {
    dotenv.config({ path: envLocalPath });
    console.log('Loaded .env.local');
} else if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    console.log('Loaded .env');
} else {
    dotenv.config(); // Will show error if not found
}

connectDB();

const app = express();

app.use(cors());
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/otp', require('./routes/otp'));
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
const HTTPS_PORT = process.env.HTTPS_PORT || 5443;

// HTTPS Configuration
const SSL_KEY_PATH = process.env.SSL_KEY_PATH;
const SSL_CERT_PATH = process.env.SSL_CERT_PATH;

// Start HTTP server (always)
const httpServer = http.createServer(app);
httpServer.listen(PORT, () => {
    console.log(`HTTP Server running on port ${PORT}`);
});

// Start HTTPS server if certificates are provided
if (SSL_KEY_PATH && SSL_CERT_PATH) {
    try {
        const key = fs.readFileSync(SSL_KEY_PATH, 'utf8');
        const cert = fs.readFileSync(SSL_CERT_PATH, 'utf8');
        
        const httpsServer = https.createServer({ key, cert }, app);
        httpsServer.listen(HTTPS_PORT, () => {
            console.log(`HTTPS Server running on port ${HTTPS_PORT}`);
            console.log(`✓ SSL/TLS enabled`);
        });
    } catch (error) {
        console.error('⚠️  Failed to start HTTPS server:', error.message);
        console.error('   Make sure SSL_KEY_PATH and SSL_CERT_PATH point to valid certificate files');
        console.error('   Server will continue running on HTTP only');
    }
} else {
    console.log('⚠️  HTTPS not configured. Set SSL_KEY_PATH and SSL_CERT_PATH in .env to enable HTTPS');
}

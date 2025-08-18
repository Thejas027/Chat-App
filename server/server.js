const express = require('express');
const http = require('http');
const dotenv = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/database');
const SocketManager = require('./socket/SocketManager');
const userRoutes = require('./routes/users');

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

const app = express();
// Trust proxy (needed when running behind a reverse proxy/load balancer)
if (process.env.TRUST_PROXY === '1' || process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// CORS configuration (allow common Vite dev ports)
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:5174'
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // allow REST tools or same-origin
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS: Origin ${origin} not allowed`));
  },
  credentials: true, // Allow cookies to be sent
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Middleware
app.use(cors(corsOptions));
// Security headers (keep relaxed CORP for serving images/files)
app.use(helmet({ crossOriginResourcePolicy: false }));
// Gzip responses
app.use(compression());
// HTTP logging
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(cookieParser()); // Parse cookies
// Limit request body size to mitigate abuse
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Routes
// Basic rate limits
const globalLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 500, standardHeaders: true, legacyHeaders: false });
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false });
const writeLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200, standardHeaders: true, legacyHeaders: false });

app.use(globalLimiter);
app.use('/api/auth', authLimiter);
app.use(['/api/messages', '/api/files'], writeLimiter);

app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', userRoutes);
app.use('/api/conversations', require('./routes/conversations'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/files', require('./routes/files'));

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Chat App Backend is running!' });
});

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is healthy',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res, next) => {
  if (res.headersSent) return next();
  res.status(404).json({ success: false, message: 'Not found' });
});

// Basic error handler to avoid leaking stack traces
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const status = err.status || 500;
  const msg = process.env.NODE_ENV === 'production' ? 'Internal Server Error' : (err.message || 'Error');
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.error('Unhandled error:', err);
  }
  res.status(status).json({ success: false, message: msg });
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📍 Server URL: http://localhost:${PORT}`);
  console.log(`📡 Socket.IO server ready for connections`);
});

// Initialize Socket.IO
const socketManager = new SocketManager(server);

// Make socket manager available globally
global.socketManager = socketManager;

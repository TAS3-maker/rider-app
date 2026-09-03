const http = require('http');
const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { Server } = require('socket.io');

const env = require('./config/env');
const { connectDB } = require('./config/db');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { verifyToken } = require('./middleware/auth');
const notificationService = require('./services/notificationService');
const registerChat = require('./sockets/chat');
const registerNotifications = require('./sockets/notifications');

// Routes
const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const universitiesRoutes = require('./routes/universities');
const airportsRoutes = require('./routes/airports');
const destinationsRoutes = require('./routes/destinations');
const ridesRoutes = require('./routes/rides');
const matchingRoutes = require('./routes/matching');
const groupsRoutes = require('./routes/groups');
const chatRoutes = require('./routes/chat');
const notificationsRoutes = require('./routes/notifications');
const ratingsRoutes = require('./routes/ratings');
const faresRoutes = require('./routes/fares');
const calendarRoutes = require('./routes/calendar');
const adminRoutes = require('./routes/admin');

const app = express();
app.set('trust proxy', 1);
app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: false, crossOriginEmbedderPolicy: false }));
app.use(cors()); // requests arrive via the FastAPI proxy on :8001; CORS handled upstream
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'ridepact-backend' }));

// Serve the built admin-web SPA under a publicly-routed /api path (single backend).
const ADMIN_DIST = path.join(__dirname, '..', '..', 'admin-web', 'dist');
app.use('/api/admin-panel', express.static(ADMIN_DIST));
app.use('/api/admin-panel', (req, res, next) => {
  if (req.method !== 'GET') return next();
  res.sendFile(path.join(ADMIN_DIST, 'index.html'));
});

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 200 });
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/universities', universitiesRoutes);
app.use('/api/airports', airportsRoutes);
app.use('/api/destinations', destinationsRoutes);
app.use('/api/rides', ridesRoutes);
app.use('/api/matching', matchingRoutes);
app.use('/api/groups', groupsRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/ratings', ratingsRoutes);
app.use('/api/fares', faresRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/admin', adminRoutes);

app.use('/api', notFound);
app.use(errorHandler);

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' }, path: '/api/socket.io' });
// Authenticate every socket via the JWT passed in the handshake.
io.use((socket, next) => {
  try {
    const token = (socket.handshake.auth && socket.handshake.auth.token) || (socket.handshake.query && socket.handshake.query.token);
    const payload = verifyToken(token);
    socket.userId = payload.sub;
    next();
  } catch (e) {
    next(new Error('unauthorized'));
  }
});
notificationService.setIo(io);
registerChat(io);
registerNotifications(io);

(async () => {
  if (!env.JWT_SECRET || env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET is missing or too weak (need >= 32 chars). Set it in backend/.env');
  }
  await connectDB();
  server.listen(env.NODE_PORT, '127.0.0.1', () =>
    console.log(`[ridepact-backend] listening on 127.0.0.1:${env.NODE_PORT}`)
  );
})().catch((err) => {
  console.error('[fatal]', err);
  process.exit(1);
});

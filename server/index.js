const path = require('path');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const http = require('http');

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/gridchain-ai';
const JWT_SECRET = process.env.JWT_SECRET || 'gridchain-dev-secret';

// ─── Mongoose Schema ────────────────────────────────────────────────────────
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  password: String,
  walletAddress: String,
  address: String,
  utilityAccountNumber: String,
  role: { type: String, default: 'customer' },
  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.model('User', userSchema);
const memoryUsers = [];
let usingMemoryStore = false;

// ─── In-memory utility state per user ──────────────────────────────────────
// utilityStates[userId] = { electricity: true, water: true, gas: true }
const utilityStates = {};
// In-memory consumption history (7-day mock, per user)
const consumptionHistory = {};

function getDefaultStates() {
  return { electricity: true, water: true, gas: true };
}

function getOrInitStates(userId) {
  if (!utilityStates[userId]) utilityStates[userId] = getDefaultStates();
  return utilityStates[userId];
}

function getOrInitHistory(userId) {
  if (!consumptionHistory[userId]) {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    consumptionHistory[userId] = {
      electricity: days.map((d) => ({ day: d, value: +(10 + Math.random() * 10).toFixed(1) })),
      water: days.map((d) => ({ day: d, value: +(100 + Math.random() * 80).toFixed(0) })),
      gas: days.map((d) => ({ day: d, value: +(4 + Math.random() * 6).toFixed(1) })),
    };
  }
  return consumptionHistory[userId];
}

// ─── Auth helpers ────────────────────────────────────────────────────────────
async function findUserByEmail(email) {
  if (mongoose.connection.readyState === 1 && !usingMemoryStore) return User.findOne({ email });
  return memoryUsers.find((u) => u.email === email) || null;
}

async function createUser(payload) {
  if (mongoose.connection.readyState === 1 && !usingMemoryStore) return User.create(payload);
  const user = { ...payload, _id: String(Date.now()) };
  memoryUsers.push(user);
  return user;
}

async function getUserById(id) {
  if (mongoose.connection.readyState === 1 && !usingMemoryStore)
    return User.findById(id).select('-password');
  return memoryUsers.find((u) => u._id === id) || null;
}

async function getAllUsers() {
  if (mongoose.connection.readyState === 1 && !usingMemoryStore)
    return User.find({}).select('-password');
  return memoryUsers.map(({ password: _p, ...rest }) => rest);
}

function verifyToken(req) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) return null;
  try { return jwt.verify(token, JWT_SECRET); } catch { return null; }
}

// ─── Routes ──────────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'GridChain AI API' }));

// Register
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, phone, password, walletAddress, address, utilityAccountNumber, role } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: 'Name, email, and password are required' });

    const existing = await findUserByEmail(email);
    if (existing) return res.status(409).json({ message: 'Email already registered' });

    const hashed = await bcrypt.hash(password, 10);
    const user = await createUser({ name, email, phone, password: hashed, walletAddress, address, utilityAccountNumber, role: role || 'customer' });

    const token = jwt.sign({ id: user._id, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user: { id: user._id, name: user.name, role: user.role, email: user.email } });
  } catch (err) {
    res.status(500).json({ message: 'Registration failed', error: err.message });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await findUserByEmail(email);
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, name: user.name, role: user.role, email: user.email } });
  } catch (err) {
    res.status(500).json({ message: 'Login failed', error: err.message });
  }
});

// Me
app.get('/api/me', async (req, res) => {
  const payload = verifyToken(req);
  if (!payload) return res.status(401).json({ message: 'Invalid token' });
  try {
    const user = await getUserById(payload.id);
    res.json({ user });
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
});

// ─── Customer: get own utility state + consumption ────────────────────────
app.get('/api/user/state', async (req, res) => {
  const payload = verifyToken(req);
  if (!payload) return res.status(401).json({ message: 'Unauthorized' });
  const states = getOrInitStates(payload.id);
  const history = getOrInitHistory(payload.id);
  res.json({
    states,
    history,
    currentUsage: {
      electricity: { value: +(12 + Math.random() * 6).toFixed(1), unit: 'kWh', bill: +(8 + Math.random() * 5).toFixed(2) },
      water:       { value: +(110 + Math.random() * 50).toFixed(0), unit: 'L',   bill: +(3 + Math.random() * 2).toFixed(2) },
      gas:         { value: +(5 + Math.random() * 4).toFixed(1),  unit: 'm³',  bill: +(6 + Math.random() * 4).toFixed(2) },
    },
  });
});

// ─── Customer: toggle own utility ─────────────────────────────────────────
app.post('/api/user/toggle', async (req, res) => {
  const payload = verifyToken(req);
  if (!payload) return res.status(401).json({ message: 'Unauthorized' });
  const { utility } = req.body; // 'electricity' | 'water' | 'gas'
  if (!['electricity', 'water', 'gas'].includes(utility))
    return res.status(400).json({ message: 'Invalid utility' });

  const states = getOrInitStates(payload.id);
  states[utility] = !states[utility];
  // Broadcast to admin room
  io.to('admin').emit('utility-change', { userId: payload.id, utility, state: states[utility] });
  res.json({ utility, state: states[utility] });
});

// ─── Admin: list all users with their utility states ─────────────────────
app.get('/api/admin/users', async (req, res) => {
  const payload = verifyToken(req);
  if (!payload || payload.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  const users = await getAllUsers();
  const result = users.map((u) => ({
    id: u._id,
    name: u.name,
    email: u.email,
    role: u.role,
    address: u.address || '',
    utilityAccountNumber: u.utilityAccountNumber || '',
    states: getOrInitStates(u._id),
  }));
  res.json({ users: result });
});

// ─── Admin: toggle a specific user's utility ─────────────────────────────
app.post('/api/admin/toggle', async (req, res) => {
  const payload = verifyToken(req);
  if (!payload || payload.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  const { userId, utility } = req.body;
  if (!userId || !['electricity', 'water', 'gas'].includes(utility))
    return res.status(400).json({ message: 'Invalid request' });

  const states = getOrInitStates(userId);
  states[utility] = !states[utility];
  io.to(userId).emit('utility-change', { utility, state: states[utility] });
  res.json({ userId, utility, state: states[utility] });
});

// ─── Admin: system summary ────────────────────────────────────────────────
app.get('/api/dashboard-summary', async (_req, res) => {
  const allUsers = await getAllUsers();
  const totalUsers = allUsers.filter((u) => u.role !== 'admin').length;
  res.json({
    metrics: [
      { label: 'Live meters', value: '3.2K', trend: '+14%' },
      { label: 'AI alerts', value: '148', trend: '+9%' },
      { label: 'Blockchain verifications', value: '97.4%', trend: '+2.1%' },
      { label: 'Revenue uplift', value: '$84K', trend: '+11%' },
    ],
    alerts: [
      { id: 1, title: 'Water leak near Aurora District', level: 'high' },
      { id: 2, title: 'Power anomaly detected on feeder 12', level: 'medium' },
      { id: 3, title: 'Gas pressure drop — Zone C', level: 'low' },
    ],
    totalUsers,
  });
});

// ─── Socket.io ────────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  socket.on('join-room', (room) => socket.join(room));
  socket.on('meter-update', (payload) => {
    io.to(payload.room || 'operations').emit('meter-update', payload);
  });
});

// ─── Start ────────────────────────────────────────────────────────────────
(async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Mongo connected');
    usingMemoryStore = false;
  } catch (err) {
    console.error('Mongo connect failed, using memory mode:', err.message);
    usingMemoryStore = true;
  }
  server.listen(PORT, () => console.log(`API listening on ${PORT}`));
})();

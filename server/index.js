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

async function findUserByEmail(email) {
  if (mongoose.connection.readyState === 1 && !usingMemoryStore) {
    return User.findOne({ email });
  }
  return memoryUsers.find((user) => user.email === email) || null;
}

async function createUser(payload) {
  if (mongoose.connection.readyState === 1 && !usingMemoryStore) {
    return User.create(payload);
  }
  const user = { ...payload, _id: String(memoryUsers.length + 1) };
  memoryUsers.push(user);
  return user;
}

async function getUserById(id) {
  if (mongoose.connection.readyState === 1 && !usingMemoryStore) {
    return User.findById(id).select('-password');
  }
  return memoryUsers.find((user) => user._id === id) || null;
}

app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'GridChain AI API' }));

app.post('/api/register', async (req, res) => {
  try {
    const { name, email, phone, password, walletAddress, address, utilityAccountNumber, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    const existing = await findUserByEmail(email);
    if (existing) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await createUser({
      name,
      email,
      phone,
      password: hashed,
      walletAddress,
      address,
      utilityAccountNumber,
      role: role || 'customer',
    });

    const token = jwt.sign({ id: user._id, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user: { id: user._id, name: user.name, role: user.role, email: user.email } });
  } catch (error) {
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, name: user.name, role: user.role, email: user.email } });
  } catch (error) {
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
});

app.get('/api/me', async (req, res) => {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : '';
    if (!token) {
      return res.status(401).json({ message: 'Missing token' });
    }

    const payload = jwt.verify(token, JWT_SECRET);
    const user = await getUserById(payload.id);
    res.json({ user });
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
});

app.get('/api/dashboard-summary', async (_req, res) => {
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
    ],
  });
});

io.on('connection', (socket) => {
  socket.on('join-dashboard', (room) => socket.join(room));
  socket.on('meter-update', (payload) => {
    io.to(payload.room || 'operations').emit('meter-update', payload);
  });
});

(async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Mongo connected');
    usingMemoryStore = false;
  } catch (error) {
    console.error('Mongo connect failed, continuing with memory mode', error.message);
    usingMemoryStore = true;
  }

  server.listen(PORT, () => console.log(`API listening on ${PORT}`));
})();

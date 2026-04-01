require('dotenv').config({ override: true });

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const documentRoutes = require('./routes/documents');
const chatRoutes = require('./routes/chat');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    const allowed = process.env.FRONTEND_URL
      ? [process.env.FRONTEND_URL, 'http://localhost:5173', 'http://localhost:3000']
      : true; // allow all if not set
    if (allowed === true || allowed.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked for origin: ${origin}`));
    }
  },
  credentials: true,
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/chat', chatRoutes);

// Public stats for login page (no auth)
app.get('/api/stats', async (req, res) => {
  try {
    const Document = require('./models/Document');
    const Chat = require('./models/Chat');
    const [totalDocs, totalChats, lastDoc] = await Promise.all([
      Document.countDocuments(),
      Chat.countDocuments(),
      Document.findOne().sort({ createdAt: -1 }).select('createdAt').lean(),
    ]);
    res.json({
      totalDocs,
      totalChats,
      lastActivity: lastDoc?.createdAt || null,
    });
  } catch {
    res.json({ totalDocs: 0, totalChats: 0, lastActivity: null });
  }
});

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'DocuChat API is running' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({ error: err.message || 'Internal server error' });
});

// Connect to MongoDB and start server
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });
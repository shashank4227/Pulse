const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require("socket.io");
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors({
    origin: ["http://localhost:5173", "http://localhost:5174", "http://localhost:3000", process.env.CLIENT_URL],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
}));
app.use(express.json());

const User = require('./models/User');

// Database Connection
mongoose.connect(process.env.MONGO_URI)
.then(async () => {
    console.log('✅ MongoDB Connected');

    // Seed Admin User
    if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
        try {
            const adminEmail = process.env.ADMIN_EMAIL;
            const adminExists = await User.findOne({ email: adminEmail });
            
            if (!adminExists) {
                console.log('🌱 Seeding Admin User...');
                await User.create({
                    username: process.env.ADMIN_USERNAME || 'admin',
                    email: adminEmail,
                    password: process.env.ADMIN_PASSWORD,
                    role: 'admin'
                });
                console.log('✅ Admin User Created (Credentials from ENV)');
            } else {
                console.log('ℹ️ Admin User already exists');
            }
        } catch (seedError) {
            console.error('❌ Failed to seed admin:', seedError);
        }
    }
})
.catch(err => console.error('❌ MongoDB Connection Error:', err));

// Socket.io Setup
const io = new Server(server, {
    cors: {
        origin: ["http://localhost:5173", "http://localhost:5174", "http://localhost:3000", process.env.CLIENT_URL].filter(Boolean),
        methods: ["GET", "POST"],
        credentials: true,
        allowedHeaders: ["*"]
    },
    allowEIO3: true,
    pingTimeout: 60000,
    pingInterval: 25000
});

io.on('connection', (socket) => {
    console.log(`🔌 New client connected: ${socket.id}`);
    
    socket.on('join_tenant', (tenantId) => {
        console.log(`Socket ${socket.id} attempting to join tenant ${tenantId}`);
        if(tenantId) {
            socket.join(tenantId);
            console.log(`✅ Socket ${socket.id} joined tenant ${tenantId}`);
            // Send acknowledgment
            socket.emit('test_event', { message: 'Joined room successfully', tenantId });
            // Also broadcast to room
            io.to(tenantId).emit('test_event', { message: 'New member joined', socketId: socket.id });
        } else {
            console.warn(`⚠️ Socket ${socket.id} tried to join with invalid tenantId`);
        }
    });

    socket.on('disconnect', (reason) => {
        console.log(`❌ Client ${socket.id} disconnected. Reason: ${reason}`);
    });

    socket.on('error', (error) => {
        console.error(`❌ Socket ${socket.id} error:`, error);
    });
});

// Routes
// Socket.io injection middleware (Must be before routes)
app.use((req, res, next) => {
    req.io = io;
    next();
});

// Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/videos', require('./routes/video.routes'));

// Routes (Placeholders)
app.get('/', (req, res) => {
    res.send('Pulse Video App API Running');
});

// Error Handling Middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});

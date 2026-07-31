const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const socketIO = require('socket.io');
const { createClient } = require('redis');

//Load env vars
dotenv.config();

//Initialize Express
const app = express();
const server = http.createServer(app);

//Socket.IO setup
const io = socketIO(server, {
    cors: {
        origin: process.env.CLIENT_URL || "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

//Redis setup
const redisClient = createClient({
    url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`
});
redisClient.connect();

//Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//Import routes
const orderRoutes = require('./src/routes/orderRoutes');
const menuRoutes = require('./src/routes/menuRoutes')
const tableRoutes = require('./src/routes/tableRoutes');

//Use routes
app.use('/api/orders', orderRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/tables', tableRoutes);

//WebSocket handling
io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    socket.on('new-order', (orderData) => {
        io.emit('order-received', orderData);
    });

    socket.on('order-accepted', (orderId) => {
        io.emit('order-status-updated', { orderId, status: 'accepted'});
    });
    
    socket.on('order-ready', (orderId) => {
        io.emit('order-status-updated', { orderId, status: 'ready' });
    });

    socket.on('disconnect', () => {
        console.log('client disconnected:', socket.id);
    });
});

//Database connection
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

//Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Server Error'
    });
});

//start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
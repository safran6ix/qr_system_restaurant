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


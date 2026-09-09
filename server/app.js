const express = require('express');
const cors = require('cors');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS configuration
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));

// API Routes
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: "AdaptIQ API is running"
  });
});

// 404 handler
app.use((req, res, next) => {
  res.status(404);
  const error = new Error(`Not Found - ${req.originalUrl}`);
  next(error);
});

// Centralized error handler
app.use(errorHandler);

module.exports = app;

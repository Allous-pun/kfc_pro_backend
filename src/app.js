const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Import routes
const authRoutes = require('./modules/auth/auth.routes');
const restaurantRoutes = require('./modules/restaurants/restaurants.routes');
const tableRoutes = require('./modules/tables/tables.routes');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/tables', tableRoutes);

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'KFC API is running with MySQL!' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

module.exports = app;

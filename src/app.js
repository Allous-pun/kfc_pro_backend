const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Import routes
const authRoutes = require('./modules/auth/auth.routes');
const userRoutes = require('./modules/users/users.routes');
const customerRoutes = require('./modules/customers/customers.routes');
const loyaltyRoutes = require('./modules/loyalty/loyalty.routes');
const restaurantRoutes = require('./modules/restaurants/restaurants.routes');
const tableRoutes = require('./modules/tables/tables.routes');
const roleRoutes = require('./modules/roles/roles.routes');
const permissionRoutes = require('./modules/permissions/permissions.routes');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/loyalty', loyaltyRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/permissions', permissionRoutes);

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
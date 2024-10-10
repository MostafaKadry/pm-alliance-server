const express = require("express");
require('dotenv').config();
const cors = require("cors");
const session = require("express-session");
const connectDB = require('./config/db');
const jobRoutes = require('./routes/jobRoutes');
const authRoutes = require('./routes/authRoutes'); 
const PORT = process.env.PORT || 5000;

const app = express();

connectDB();

app.use(cors()); 
app.use(express.json());
app.use(session({ secret: process.env.JWT_SECRET, resave: false, saveUninitialized: true }));
app.use('/api', jobRoutes);
app.use('/api/auth', authRoutes);

app.listen(PORT, () => console.log(`app is working on port ${PORT}`));

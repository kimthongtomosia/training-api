require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');

const app = express();

app.use(express.json());

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Import Routes
app.use('/api/auth', require('./routes/authRoutes'));

// Error handling middleware
app.use((err, req, res, next) => {
    res.status(err.status || 500).json({
        status: err.status || 500,
        message: err.message
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

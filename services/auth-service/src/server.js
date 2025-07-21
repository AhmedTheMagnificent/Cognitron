const express = require('express');
require('dotenv').config();
const sequelize = require('./config/database');
const authRoutes = require('./routes/auth.routes');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
    res.send('Auth Service is alive and running!');
});

sequelize.sync().then(() => {
    console.log('Database connected and tables synced.');
    app.listen(PORT, () => {
        console.log(`Auth Service is listening on http://localhost:${PORT}`);
    });
}).catch(err => console.error('Unable to connect to the database:', err));
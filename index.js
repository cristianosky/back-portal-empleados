const express = require('express');
const dotenv = require('dotenv');
const sequelize = require('./config/db');
const User = require('./models/User');
const authRoutes = require('./routes/auth');
const cors = require('cors');
const attendanceRoutes = require('./routes/attendance');

dotenv.config();
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());

app.use(express.json());

// Sincronizar DB
sequelize.sync({ alter: true }).then(() => {
  console.log('🟢 Base de datos sincronizada');
}).catch(err => console.error('🔴 Error al conectar DB:', err));

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/attendance', attendanceRoutes);

app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});

const express = require('express');
const dotenv = require('dotenv');
const sequelize = require('./config/db');
const User = require('./models/User');
const authRoutes = require('./routes/auth');

dotenv.config();
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Sincronizar DB
sequelize.sync({ alter: true }).then(() => {
  console.log('🟢 Base de datos sincronizada');
}).catch(err => console.error('🔴 Error al conectar DB:', err));

// Rutas
app.use('/api/auth', authRoutes);

app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});

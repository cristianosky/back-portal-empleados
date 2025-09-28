const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// Registrar usuario con nombre y apellido
router.post('/register', async (req, res) => {
  const { nombre, apellido, email, password, role } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      nombre,
      apellido,
      email,
      password: hashedPassword,
      role: role || 'user'
    });

    res.json({
      msg: 'Usuario creado correctamente',
      user: {
        id: newUser.id,
        nombre: newUser.nombre,
        apellido: newUser.apellido,
        email: newUser.email,
        role: newUser.role
      }
    });
  } catch (error) {
    res.status(500).json({ msg: 'Error registrando usuario', error });
  }
});


// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(401).json({ msg: 'Usuario no encontrado' });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(401).json({ msg: 'Clave incorrecta' });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({
      msg: 'Login exitoso 😎',
      token,
      user: {
        id: user.id,
        nombre: user.nombre,
        apellido: user.apellido,
        email: user.email,
        role: user.role,
        photo: user.photo
      }
    });
  } catch (error) {
    res.status(500).json({ msg: 'Error en login', error });
  }
});




module.exports = router;

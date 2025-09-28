// routes/profileRoutes.js
const express = require('express');
const bcrypt = require('bcrypt');
const { User } = require('../models');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

// Ver perfil
router.get('/', authMiddleware, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'nombre', 'apellido', 'email', 'role', 'createdAt']
    });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Actualizar perfil
router.put('/', authMiddleware, async (req, res) => {
  try {
    const { nombre, apellido, email } = req.body;
    const user = await User.findByPk(req.user.id);

    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    user.nombre = nombre || user.nombre;
    user.apellido = apellido || user.apellido;
    user.email = email || user.email;

    await user.save();
    // eliminar password del objeto user antes de enviarlo en la respuesta
    delete user.dataValues.password;
    delete user.dataValues.startDate;
    delete user.dataValues.updatedAt;
    delete user.dataValues.createdAt;
    res.json({ message: 'Perfil actualizado correctamente', user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Cambiar contraseña
router.put('/password', authMiddleware, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findByPk(req.user.id);

    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    const validPassword = await bcrypt.compare(oldPassword, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'La contraseña actual no es correcta' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    await user.save();

    res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

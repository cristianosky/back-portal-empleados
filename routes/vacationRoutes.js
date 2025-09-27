// routes/vacationRoutes.js
const express = require('express');
const router = express.Router();
const { User, Vacation } = require('../models');
const { calcularDiasVacaciones } = require('../utils/vacationUtils');
const authMiddleware = require('../middlewares/authMiddleware');

// Consultar saldo de vacaciones
router.get('/balance', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findByPk(userId, {
      include: [{ model: Vacation }]
    });

    if (!user) return res.status(404).json({ msg: 'Usuario no encontrado' });

    const diasDisponibles = calcularDiasVacaciones(user);

    res.json({
      nombre: user.nombre,
      apellido: user.apellido,
      diasDisponibles
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Error consultando vacaciones', error });
  }
});

// Solicitar vacaciones
router.post('/request', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate } = req.body;

    const daysRequested =
      Math.ceil(
        (new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)
      ) + 1;

    const user = await User.findByPk(userId, { include: [Vacation] });
    const saldo = calcularDiasVacaciones(user);

    if (saldo < daysRequested) {
      return res
        .status(400)
        .json({ msg: 'No tienes suficientes días disponibles' });
    }

    const vacation = await Vacation.create({
      startDate,
      endDate,
      daysRequested,
      userId
    });

    res.json({ msg: 'Solicitud registrada', vacation });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Error solicitando vacaciones', error });
  }
});

// Consultar TODAS las solicitudes de vacaciones (solo admin)
router.get('/all', authMiddleware, async (req, res) => {
  try {
    // Validamos si es admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'No tienes permisos' });
    }

    const solicitudes = await Vacation.findAll({
      include: [
        {
          model: User,
          attributes: ['id', 'nombre', 'apellido', 'email', 'role']
        }
      ]
    });

    res.json(solicitudes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Error consultando todas las vacaciones', error });
  }
});


module.exports = router;

// routes/attendance.js
const express = require('express');
const router = express.Router();
const { Attendance } = require('../models');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const { Op } = require('sequelize');

const formatTime = date => date.toTimeString().split(' ')[0]; // "HH:MM:SS"
const todayStr = () => new Date().toISOString().slice(0,10); // "YYYY-MM-DD"

// Check-in
router.post('/checkin', authMiddleware, roleMiddleware(['user']), async (req, res) => {
  try {
    const userId = req.user.id;
    const date = todayStr();

    let record = await Attendance.findOne({ where: { userId, date } });

    if (record && record.checkIn) {
      return res.status(400).json({ msg: 'Ya registraste tu entrada hoy' });
    }

    const time = formatTime(new Date());

    if (!record) {
      record = await Attendance.create({
        userId,
        date,
        status: 'present',
        checkIn: time
      });
    } else {
      // existe registro pero sin checkIn (por ejemplo admin creó la fila)
      record.checkIn = time;
      record.status = 'present';
      await record.save();
    }

    return res.json({ msg: 'Check-in registrado', record });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: 'Error en check-in' });
  }
});

// Check-out
router.post('/checkout', authMiddleware, roleMiddleware(['user']), async (req, res) => {
  try {
    const userId = req.user.id;
    const date = todayStr();

    const record = await Attendance.findOne({ where: { userId, date } });
    if (!record) return res.status(400).json({ msg: 'No existe registro de entrada hoy' });
    if (record.checkOut) return res.status(400).json({ msg: 'Ya registraste tu salida hoy' });

    record.checkOut = formatTime(new Date());
    await record.save();

    return res.json({ msg: 'Check-out registrado', record });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: 'Error en check-out' });
  }
});

// Obtener registro de hoy
router.get('/today', authMiddleware, roleMiddleware(['user']), async (req, res) => {
  try {
    const userId = req.user.id;
    const date = todayStr();
    const record = await Attendance.findOne({ where: { userId, date } });
    return res.json({ record });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: 'Error obteniendo registro de hoy' });
  }
});

// % asistencia del mes (ejemplo simple)
const calcWorkDays = (year, month) => {
  // month: 1..12
  const start = new Date(year, month -1, 1);
  const end = new Date(year, month, 0); // último día del mes
  let workDays = 0;
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() +1)) {
    const day = d.getDay();
    if (day !== 0 && day !== 6) workDays++; // lunes-viernes
  }
  return workDays;
};

router.get('/monthly', authMiddleware, roleMiddleware(['user']), async (req, res) => {
  try {
    const userId = req.user.id;
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const month = parseInt(req.query.month) || (new Date().getMonth() + 1);

    const startDate = `${year}-${String(month).padStart(2,'0')}-01`;
    const endDate = `${year}-${String(month).padStart(2,'0')}-${new Date(year, month, 0).getDate()}`;

    const presentCount = await Attendance.count({
      where: {
        userId,
        date: { [Op.between]: [startDate, endDate] },
        status: { [Op.in]: ['present','remote'] }
      }
    });

    const expectedWorkDays = calcWorkDays(year, month);
    const percentage = expectedWorkDays === 0 ? 0 : Math.round((presentCount / expectedWorkDays) * 10000) / 100;

    return res.json({ year, month, expectedWorkDays, presentCount, percentage });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: 'Error obteniendo % mensual' });
  }
});

module.exports = router;

// utils/vacationUtils.js
const moment = require('moment');

function calcularDiasVacaciones(user) {
  const inicio = moment(user.startDate);
  const hoy = moment();

  // meses trabajados
  const mesesTrabajados = hoy.diff(inicio, 'months');

  // 1.25 días por mes (15 días al año)
  const diasAcumulados = mesesTrabajados * 1.25;

  // días ya usados en vacaciones aprobadas
  const diasUsados = user.Vacations
    ? user.Vacations
        .filter(v => v.status === 'approved')
        .reduce((sum, v) => sum + v.daysRequested, 0)
    : 0;

  // saldo final
  return diasAcumulados - diasUsados;
}

module.exports = { calcularDiasVacaciones };

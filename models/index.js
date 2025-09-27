// models/index.js
const sequelize = require('../config/db');

const User = require('./User');
const Attendance = require('./Attendance');
const Vacation = require('./Vacation');
// Si tienes otros modelos, requierelos aquí

const models = {
  User,
  Attendance,
  Vacation
};

Object.values(models).forEach(model => {
  if (typeof model.associate === 'function') {
    model.associate(models);
  }
});

module.exports = { sequelize, ...models };

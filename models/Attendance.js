// models/Attendance.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Attendance = sequelize.define('Attendance', {
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('present','absent','permission','remote'),
    defaultValue: 'present'
  },
  checkIn: DataTypes.TIME,
  checkOut: DataTypes.TIME
});

// asociación (se llamará desde models/index.js)
Attendance.associate = (models) => {
  Attendance.belongsTo(models.User, { foreignKey: 'userId' });
};

module.exports = Attendance;

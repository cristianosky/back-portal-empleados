// models/Vacation.js

const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Vacation = sequelize.define('Vacation', {
  startDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  endDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'pending'
  },
  daysRequested: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
});

Vacation.associate = (models) => {
  Vacation.belongsTo(models.User, { foreignKey: 'userId' });
};

module.exports = Vacation;

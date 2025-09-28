const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const User = sequelize.define('User', {
  photo : {
    type: DataTypes.STRING,
    allowNull: true
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false
  },
  apellido: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('user', 'admin'),
    defaultValue: 'user'
  },
  startDate: { 
    type: DataTypes.DATEONLY, 
    field: 'createdAt'
  } 
}, {
  defaultScope: {
    attributes: { exclude: ['password', 'createdAt', 'updatedAt'] }
  }
});

User.associate = models => {
  User.hasMany(models.Attendance, { foreignKey: 'userId' });
  User.hasMany(models.Vacation, { foreignKey: 'userId' });
};

module.exports = User;

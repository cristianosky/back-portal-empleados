const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');
dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME,     // nombre de la BD
  process.env.DB_USER,     // usuario
  process.env.DB_PASS,     // contraseña
  {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    logging: false
  }
);



module.exports = sequelize;

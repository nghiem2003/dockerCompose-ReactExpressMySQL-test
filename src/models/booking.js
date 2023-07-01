'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Booking extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      models.Booking.belongsTo(models.Doctor,{foreignKey: 'DoctorId', targetKey: 'id'});

      models.Booking.belongsTo(models.Patient,{foreignKey: 'PatientId', targetKey: 'id'});
    }
  }
  Booking.init({
    Status: DataTypes.STRING,
    DoctorId: DataTypes.INTEGER,
    PatientId: DataTypes.INTEGER,
    date: DataTypes.DATE,
    timeType: DataTypes.STRING,
  }, {
    sequelize,
    modelName: 'Booking',
  });
  return Booking;
};

const mongoose = require('mongoose');

const weatherSchema = new mongoose.Schema({
  location: {
    type: String,
    required: true,
    trim: true
  },

  country: {
    type: String,
    default: ''
  },

  latitude: {
    type: Number,
    required: true,
    min: -90,
    max: 90
  },

  longitude: {
    type: Number,
    required: true,
    min: -180,
    max: 180
  },

  startDate: {
    type: String,
    required: true
  },

  endDate: {
    type: String,
    required: true
  },

  temperature: Number,
  condition: String,
  humidity: Number,
  windSpeed: Number,

  aqi: {
    type: Number,
    default: null
  },

  provider: {
    type: String,
    default: 'Open-Meteo'
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model(
  'WeatherRecord',
  weatherSchema
);

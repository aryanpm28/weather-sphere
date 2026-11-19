
const axios = require('axios');

const api = axios.create({
  timeout: 10000
});

// Convert city name into coordinates
async function getCoordinates(city) {
  const response = await api.get(
    'https://geocoding-api.open-meteo.com/v1/search',
    {
      params: {
        name: city,
        count: 1
      }
    }
  );

  const place = response.data.results?.[0];

  if (!place) {
    throw new Error(
      'We could not find that location. Check the spelling and try again.'
    );
  }

  return {
    name: place.name,
    country: place.country || '',
    latitude: place.latitude,
    longitude: place.longitude
  };
}

// Retrieve current weather and 5-day forecast
async function getWeather(latitude, longitude) {
  const response = await api.get(
    'https://api.open-meteo.com/v1/forecast',
    {
      params: {
        latitude,
        longitude,
        current:
          'temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,apparent_temperature',
        daily:
          'weather_code,temperature_2m_max,temperature_2m_min',
        timezone: 'auto',
        forecast_days: 5
      }
    }
  );

  return response.data;
}

// Retrieve air quality
async function getAirQuality(latitude, longitude) {
  const response = await api.get(
    'https://air-quality-api.open-meteo.com/v1/air-quality',
    {
      params: {
        latitude,
        longitude,
        current: 'european_aqi'
      }
    }
  );

  return response.data;
}

module.exports = {
  getCoordinates,
  getWeather,
  getAirQuality
};

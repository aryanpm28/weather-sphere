require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const { getCoordinates, getWeather, getAirQuality } = require('./weather');
const WeatherRecord = require('./models');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json({ limit: '10kb' }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

function validCoordinates(latitude, longitude) {
  return Number.isFinite(latitude) && Number.isFinite(longitude) &&
    latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180;
}

function sendServerError(res, error, message) {
  // Keep internal service details in the server logs, not in the public response.
  console.error(message, error.message);
  return res.status(500).json({ error: message });
}

// Return weather for a city name or a pair of coordinates.
app.get('/api/weather', async (req, res) => {
  try {
    const { city } = req.query;
    const hasLatitude = req.query.lat !== undefined;
    const hasLongitude = req.query.lon !== undefined;
    let location;

    if (hasLatitude || hasLongitude) {
      const latitude = Number(req.query.lat);
      const longitude = Number(req.query.lon);
      if (!hasLatitude || !hasLongitude || !validCoordinates(latitude, longitude)) {
        return res.status(400).json({ error: 'Please provide valid latitude and longitude.' });
      }
      location = {
        name: `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`,
        country: '',
        latitude,
        longitude
      };
    } else if (typeof city === 'string' && city.trim()) {
      location = await getCoordinates(city.trim());
    } else {
      return res.status(400).json({ error: 'Enter a city or provide coordinates.' });
    }

    const [weather, air] = await Promise.all([
      getWeather(location.latitude, location.longitude),
      getAirQuality(location.latitude, location.longitude)
    ]);

    return res.json({
      location,
      current: weather.current,
      daily: weather.daily,
      airQuality: air.current,
      provider: 'Open-Meteo'
    });
  } catch (error) {
    if (error.message.includes('could not find that location')) {
      return res.status(404).json({ error: error.message });
    }
    return sendServerError(res, error, 'Unable to retrieve weather right now. Please try again.');
  }
});

// Save a weather snapshot. The selected dates are stored as record labels;
// this endpoint currently saves today's weather, not historical weather data.
app.post('/api/records', async (req, res) => {
  try {
    const { location, latitude, longitude, startDate, endDate } = req.body;
    if ((!location || typeof location !== 'string') &&
        !validCoordinates(Number(latitude), Number(longitude))) {
      return res.status(400).json({ error: 'Enter a valid city or location coordinates.' });
    }
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start date and end date are required.' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return res.status(400).json({ error: 'Please enter valid dates.' });
    }
    if (end < start) {
      return res.status(400).json({ error: 'End date cannot be before start date.' });
    }

    const place = location && location.trim()
      ? await getCoordinates(location.trim())
      : { name: 'Saved location', country: '', latitude: Number(latitude), longitude: Number(longitude) };
    const [weather, air] = await Promise.all([
      getWeather(place.latitude, place.longitude),
      getAirQuality(place.latitude, place.longitude)
    ]);

    const record = await WeatherRecord.create({
      location: place.name,
      country: place.country,
      latitude: place.latitude,
      longitude: place.longitude,
      startDate,
      endDate,
      temperature: weather.current.temperature_2m,
      condition: String(weather.current.weather_code),
      humidity: weather.current.relative_humidity_2m,
      windSpeed: weather.current.wind_speed_10m,
      aqi: air.current?.european_aqi ?? null
    });

    return res.status(201).json(record);
  } catch (error) {
    return sendServerError(res, error, 'Could not save this weather record. Please try again.');
  }
});

app.get('/api/records', async (req, res) => {
  try {
    const records = await WeatherRecord.find().sort({ createdAt: -1 }).lean();
    return res.json(records);
  } catch (error) {
    return sendServerError(res, error, 'Could not load saved records.');
  }
});

// Only allow edits to fields that are part of a saved weather record.
app.put('/api/records/:id', async (req, res) => {
  try {
    const allowedFields = ['location', 'country', 'startDate', 'endDate'];
    const updates = Object.fromEntries(
      Object.entries(req.body).filter(([key]) => allowedFields.includes(key))
    );
    if (!Object.keys(updates).length) {
      return res.status(400).json({ error: 'There are no editable fields in your request.' });
    }
    const updated = await WeatherRecord.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true
    });
    if (!updated) return res.status(404).json({ error: 'Record not found.' });
    return res.json(updated);
  } catch (error) {
    if (error.name === 'CastError') return res.status(400).json({ error: 'Invalid record ID.' });
    return sendServerError(res, error, 'Could not update this record.');
  }
});

app.delete('/api/records/:id', async (req, res) => {
  try {
    const deleted = await WeatherRecord.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Record not found.' });
    return res.json({ message: 'Record deleted.' });
  } catch (error) {
    if (error.name === 'CastError') return res.status(400).json({ error: 'Invalid record ID.' });
    return sendServerError(res, error, 'Could not delete this record.');
  }
});

function csvCell(value) {
  // Quoting every cell also protects commas, line breaks and quotation marks.
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

app.get('/api/export/:format', async (req, res) => {
  try {
    const { format } = req.params;
    if (!['json', 'csv'].includes(format)) {
      return res.status(400).json({ error: 'Supported formats are json and csv.' });
    }

    const records = await WeatherRecord.find().sort({ createdAt: -1 }).lean();
    if (format === 'json') {
      res.setHeader('Content-Disposition', 'attachment; filename=weather-records.json');
      return res.json(records);
    }

    const columns = ['Location', 'Country', 'Temperature', 'Humidity', 'Wind', 'AQI', 'StartDate', 'EndDate'];
    const rows = records.map(record => [
      record.location, record.country, record.temperature, record.humidity,
      record.windSpeed, record.aqi, record.startDate, record.endDate
    ].map(csvCell).join(','));

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=weather-records.csv');
    return res.send([columns.map(csvCell).join(','), ...rows].join('\r\n'));
  } catch (error) {
    return sendServerError(res, error, 'Could not export weather records.');
  }
});

async function startServer() {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is missing. Add it to backend/.env before starting the server.');
  }
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB.');
  app.listen(PORT, () => console.log(`WeatherSphere API is running at http://localhost:${PORT}`));
}

startServer().catch(error => {
  console.error('Server could not start:', error.message);
  process.exit(1);
});

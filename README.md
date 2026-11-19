# WeatherSphere

**One Planet. Every Forecast.**

A simple full-stack weather intelligence dashboard built with the MERN stack.

## Features

- Search any city worldwide
- Current weather (temperature, feels like, humidity, wind)
- 5-day forecast
- Air Quality Index (AQI)
- Save weather records to MongoDB
- View saved records
- Clean modern dark UI

## Tech Stack

- **Frontend**: React + Vite + plain CSS
- **Backend**: Node.js + Express
- **Database**: MongoDB Atlas
- **Weather Data**: Open-Meteo (free, no API key required)

## Project Structure

```
weather-sphere/
├── backend/
│   ├── server.js
│   ├── models.js
│   ├── weather.js
│   ├── package.json
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── style.css
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── .gitignore
└── README.md
```

## Setup Instructions

### 1. MongoDB Atlas

1. Create a free account at https://www.mongodb.com/cloud/atlas
2. Create a free cluster
3. Create a database user
4. Allow network access from anywhere (0.0.0.0/0)
5. Copy the connection string
6. Paste it in `backend/.env` replacing the placeholder

### 2. Backend

```bash
cd backend
npm install
node server.js
```

Server will run on http://localhost:5000

### 3. Frontend

Open a new terminal:

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

## How the Pipeline Works

1. User types a city name
2. Backend converts city → latitude/longitude (Open-Meteo Geocoding)
3. Backend fetches current weather + 5-day forecast
4. Backend fetches air quality data
5. Data is returned to the React frontend
6. User can save the record to MongoDB

## Candidate

Aryan Patil  
PM Accelerator Full-Stack Engineering Assessment

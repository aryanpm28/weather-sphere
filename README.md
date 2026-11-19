# WeatherSphere 🌦️

A weather application that provides real-time weather information, a 5-day forecast, air quality details, and saved weather records.

## Features

- Search weather for cities worldwide
- View current temperature, feels-like temperature, humidity, and wind speed
- 5-day weather forecast
- Air Quality Index (AQI)
- Detect current location using GPS
- Save weather records to MongoDB
- View and delete saved records
- Export records in JSON and CSV formats
- Responsive dark-themed interface

## Tech Stack

**Frontend:** React, Vite, CSS  
**Backend:** Node.js, Express.js  
**Database:** MongoDB Community Server (Local)  
**ODM:** Mongoose  
**Weather Data:** Open-Meteo API

## Project Structure

```text
weather-sphere/
├── client/          # React frontend
├── server/          # Express backend
├── README.md
└── .gitignore
```

## Requirements

- Node.js and npm
- MongoDB Community Server
- Git

## Installation and Setup

### 1. Clone the repository

```bash
git clone https://github.com/aryanpm28/weather-sphere.git
cd weather-sphere
```

### 2. Start MongoDB

Make sure the local MongoDB service is running.

### 3. Configure the backend

Open the server folder:

```bash
cd server
npm install
```

Create a `.env` file inside the server folder:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/weathersphere
```

Make sure the environment variable name matches the one used in your backend code.

### 4. Start the backend

```bash
npm start
```

If your project uses a different start script, use the appropriate script from `package.json`.

Backend runs at:

```text
http://localhost:5000
```

### 5. Start the frontend

Open a new terminal:

```bash
cd client
npm install
npm run dev
```

Frontend runs at:

```text
http://localhost:5173
```

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/weather?city=Mumbai` | Get weather information |
| POST | `/api/records` | Save a weather record |
| GET | `/api/records` | Get saved records |
| PUT | `/api/records/:id` | Update a record |
| DELETE | `/api/records/:id` | Delete a record |
| GET | `/api/export/json` | Export records as JSON |
| GET | `/api/export/csv` | Export records as CSV |

## Database

WeatherSphere uses a local MongoDB database.

**Connection URI:**

```text
mongodb://127.0.0.1:27017/weathersphere
```

You can use MongoDB Compass to view the `weathersphere` database and its collections.

## External API

WeatherSphere uses [Open-Meteo](https://open-meteo.com/) for weather forecasts, geocoding, and air quality information.

## Running the Application

Run the backend and frontend in separate terminals. Make sure MongoDB is running before starting the backend.

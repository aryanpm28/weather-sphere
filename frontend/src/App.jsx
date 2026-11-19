import { useEffect, useState } from 'react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || ''
const api = axios.create({ baseURL: API_URL, timeout: 12000 })

function getCondition(code) {
  if (code === 0) return 'Clear sky'
  if (code === 1) return 'Mainly clear'
  if (code === 2) return 'Partly cloudy'
  if (code === 3) return 'Overcast'
  if ([45, 48].includes(code)) return 'Foggy'
  if ([51, 53, 55, 56, 57].includes(code)) return 'Drizzle'
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return 'Rain'
  if ([71, 73, 75, 77, 85, 86].includes(code)) return 'Snow'
  if ([95, 96, 99].includes(code)) return 'Thunderstorm'
  return 'Conditions unavailable'
}

function getErrorMessage(error, fallback) {
  return error.response?.data?.error || error.message || fallback
}

function App() {
  const [city, setCity] = useState('')
  const [weather, setWeather] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [records, setRecords] = useState([])
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  async function searchWeather() {
    const searchTerm = city.trim()
    if (!searchTerm) {
      setError('Type a city name to get its weather.')
      return
    }

    setLoading(true)
    setError('')
    setNotice('')
    try {
      const response = await api.get('/api/weather', { params: { city: searchTerm } })
      setWeather(response.data)
    } catch (requestError) {
      setWeather(null)
      setError(getErrorMessage(requestError, 'Could not find that location.'))
    } finally {
      setLoading(false)
    }
  }

  function useMyLocation() {
    if (!navigator.geolocation) {
      setError('Your browser does not support location sharing.')
      return
    }

    setLoading(true)
    setError('')
    setNotice('')
    navigator.geolocation.getCurrentPosition(async ({ coords }) => {
      try {
        const response = await api.get('/api/weather', {
          params: { lat: coords.latitude, lon: coords.longitude }
        })
        setWeather(response.data)
        setCity('')
      } catch (requestError) {
        setWeather(null)
        setError(getErrorMessage(requestError, 'Could not get weather for your location.'))
      } finally {
        setLoading(false)
      }
    }, (locationError) => {
      setLoading(false)
      setError(locationError.code === 1
        ? 'Location permission was denied. You can still search for a city.'
        : 'Your location could not be determined. Please try searching for a city.')
    }, { timeout: 10000 })
  }

  async function loadRecords() {
    try {
      const response = await api.get('/api/records')
      setRecords(response.data)
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Could not load saved records.'))
    }
  }

  async function saveRecord() {
    if (!weather || !startDate || !endDate) {
      setError('Search for a location and choose both dates before saving.')
      return
    }
    if (endDate < startDate) {
      setError('The end date cannot be earlier than the start date.')
      return
    }

    setError('')
    setNotice('')
    try {
      const isCoordinateSearch = !weather.location.country && weather.location.name.includes(',')
      await api.post('/api/records', {
        location: isCoordinateSearch ? '' : weather.location.name,
        latitude: weather.location.latitude,
        longitude: weather.location.longitude,
        startDate,
        endDate
      })
      await loadRecords()
      setNotice('Weather record saved.')
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Could not save this record.'))
    }
  }

  async function deleteRecord(id) {
    try {
      await api.delete(`/api/records/${id}`)
      setRecords(currentRecords => currentRecords.filter(record => record._id !== id))
      setNotice('Record deleted.')
      setError('')
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Could not delete this record.'))
    }
  }

  useEffect(() => {
    loadRecords()
  }, [])

  return (
    <div className="app">
      <div className="globe-bg" aria-hidden="true" />
      <main className="content">
        <header>
          <h1>WeatherSphere</h1>
          <p>One Planet. Every Forecast.</p>
          <p className="candidate">Aryan Patil | PM Accelerator Full-Stack Assessment</p>
        </header>

        <section className="search-box" aria-label="Find weather">
          <input
            type="text"
            placeholder="Enter a city name..."
            aria-label="City name"
            value={city}
            onChange={event => setCity(event.target.value)}
            onKeyDown={event => event.key === 'Enter' && searchWeather()}
          />
          <button onClick={searchWeather} disabled={loading}>Search</button>
          <button className="location-btn" onClick={useMyLocation} disabled={loading}>
            📍 My Location
          </button>
        </section>

        <section className="date-box" aria-label="Save a weather record">
          <input type="date" aria-label="Start date" value={startDate}
            onChange={event => setStartDate(event.target.value)} />
          <input type="date" aria-label="End date" value={endDate}
            onChange={event => setEndDate(event.target.value)} />
          <button onClick={saveRecord} disabled={loading || !weather}>Save Record</button>
        </section>

        {loading && <p className="loading" role="status">Getting the latest weather...</p>}
        {error && <p className="error" role="alert">{error}</p>}
        {notice && <p className="loading" role="status">{notice}</p>}

        {weather && (
          <section className="dashboard" aria-label="Weather report">
            <div className="current-card">
              <h2>{weather.location.name}{weather.location.country ? `, ${weather.location.country}` : ''}</h2>
              <p className="temp">{weather.current.temperature_2m}°C</p>
              <p>{getCondition(weather.current.weather_code)}</p>
              <div className="details">
                <span>Feels like: {weather.current.apparent_temperature}°C</span>
                <span>Humidity: {weather.current.relative_humidity_2m}%</span>
                <span>Wind: {weather.current.wind_speed_10m} km/h</span>
                <span>AQI: {weather.airQuality?.european_aqi ?? 'N/A'}</span>
              </div>
              <a className="map-link"
                href={`https://www.google.com/maps?q=${weather.location.latitude},${weather.location.longitude}`}
                target="_blank" rel="noopener noreferrer">
                View on Google Maps
              </a>
            </div>

            <div className="forecast">
              <h3>5-Day Forecast</h3>
              <div className="forecast-grid">
                {weather.daily.time.map((date, index) => (
                  <div key={date} className="day-card">
                    <p>{new Date(`${date}T12:00:00`).toLocaleDateString('en', { weekday: 'short' })}</p>
                    <p>{getCondition(weather.daily.weather_code[index])}</p>
                    <p>{weather.daily.temperature_2m_max[index]}° / {weather.daily.temperature_2m_min[index]}°</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="records-section">
          <div className="records-header">
            <h3>Saved Records</h3>
            <div>
              <button onClick={loadRecords}>Refresh</button>
              <a href={`${API_URL}/api/export/json`} className="export-btn">Export JSON</a>
              <a href={`${API_URL}/api/export/csv`} className="export-btn">Export CSV</a>
            </div>
          </div>

          {records.length === 0 ? <p className="empty">No saved records yet.</p> :
            records.map(record => (
              <article key={record._id} className="record-item">
                <div>
                  <strong>{record.location}</strong> ({record.startDate} → {record.endDate})
                  <br />
                  {record.temperature}°C | Humidity {record.humidity}%
                </div>
                <button className="delete-btn" onClick={() => deleteRecord(record._id)}>
                  Delete
                </button>
              </article>
            ))}
        </section>

        <section className="sources">
          <h4>Data Sources</h4>
          <p>
            <a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer">Open-Meteo</a> •
            <a href="https://open-meteo.com/en/docs/geocoding-api" target="_blank" rel="noopener noreferrer"> Geocoding</a> •
            <a href="https://open-meteo.com/en/docs/air-quality-api" target="_blank" rel="noopener noreferrer"> Air Quality</a>
          </p>
        </section>

        <footer>
          <p>Built by <strong>Aryan Patil</strong></p>
          <p>PM Accelerator – Product Manager Accelerator</p>
        </footer>
      </main>
    </div>
  )
}

export default App

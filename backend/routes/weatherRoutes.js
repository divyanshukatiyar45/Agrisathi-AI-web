const express = require('express');

const router = express.Router();

const BASE_URL = 'https://api.openweathermap.org/data/2.5';

// Current weather: GET /api/weather/current?city=Kanpur&lang=hi
router.get('/current', async (req, res) => {
  try {
    const { city, lang } = req.query;
    if (!city) {
      return res.status(400).json({ message: 'City is required' });
    }

    const url = `${BASE_URL}/weather?q=${encodeURIComponent(city)}&appid=${process.env.OPENWEATHER_API_KEY}&units=metric&lang=${lang === 'hi' ? 'hi' : 'en'}`;
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ message: data.message || 'Weather API error' });
    }

    res.status(200).json({
      city: data.name,
      temperature: data.main.temp,
      feelsLike: data.main.feels_like,
      humidity: data.main.humidity,
      windSpeed: data.wind.speed,
      condition: data.weather[0].main,
      description: data.weather[0].description,
      icon: data.weather[0].icon,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// 5-day forecast: GET /api/weather/forecast?city=Kanpur&lang=hi
router.get('/forecast', async (req, res) => {
  try {
    const { city, lang } = req.query;
    if (!city) {
      return res.status(400).json({ message: 'City is required' });
    }

    const url = `${BASE_URL}/forecast?q=${encodeURIComponent(city)}&appid=${process.env.OPENWEATHER_API_KEY}&units=metric&lang=${lang === 'hi' ? 'hi' : 'en'}`;
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ message: data.message || 'Weather API error' });
    }

    // Har din ke liye ek reading (dopahar 12:00 wali)
    const daily = data.list
      .filter((item) => item.dt_txt.includes('12:00:00'))
      .map((item) => ({
        date: item.dt_txt.split(' ')[0],
        temperature: item.main.temp,
        humidity: item.main.humidity,
        windSpeed: item.wind.speed,
        condition: item.weather[0].main,
        description: item.weather[0].description,
        icon: item.weather[0].icon,
        rainChance: Math.round((item.pop || 0) * 100),
      }));

    res.status(200).json({ city: data.city.name, forecast: daily });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

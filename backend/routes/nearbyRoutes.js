const express = require('express');

const router = express.Router();

const OVERPASS_URLS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];
const HEADERS = { 'User-Agent': 'AgriSathiAI/1.0 (student project)' };

// Kis category ke liye OpenStreetMap ke kaunse tags dhoondhne hain
const CATEGORIES = {
  mandi: ['"amenity"="marketplace"'],
  agri: ['"shop"="agrarian"', '"shop"="garden_centre"'],
  vet: ['"amenity"="veterinary"'],
  bank: ['"amenity"="bank"'],
};

const CACHE_MS = 60 * 60 * 1000;
const cache = new Map();

// Ek IP se 1 minute mein 30 se zyada request nahi (bahari services ko bachane ke liye)
const hits = new Map();
function limiter(req, res, next) {
  const now = Date.now();
  const list = (hits.get(req.ip) || []).filter((t) => now - t < 60000);
  if (list.length >= 30) {
    return res.status(429).json({ message: 'Too many requests. Please wait a minute.' });
  }
  list.push(now);
  hits.set(req.ip, list);
  next();
}

function haversineKm(lat1, lon1, lat2, lon2) {
  const rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(lat2 - lat1);
  const dLon = rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function buildQuery(tags, lat, lon, radius) {
  const parts = tags.map((t) => `nwr[${t}](around:${radius},${lat},${lon});`).join('');
  return `[out:json][timeout:25];(${parts});out center 100;`;
}

async function fetchOverpass(query) {
  let lastError = new Error('Overpass failed');

  for (const url of OVERPASS_URLS) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(url, {
        method: 'POST',
        headers: { ...HEADERS, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ data: query }).toString(),
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (!response.ok) throw new Error(`Overpass status ${response.status}`);
      const data = await response.json();
      return Array.isArray(data.elements) ? data.elements : [];
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

// Naam se jagah dhoondhna: GET /api/nearby/geocode?q=Kanpur
router.get('/geocode', limiter, async (req, res) => {
  try {
    const q = String(req.query.q || '').trim().slice(0, 100);
    if (!q) return res.status(400).json({ message: 'Place name is required' });

    const key = `geo:${q.toLowerCase()}`;
    const cached = cache.get(key);
    if (cached && Date.now() - cached.time < CACHE_MS * 24) {
      return res.status(200).json(cached.data);
    }

    const params = new URLSearchParams({
      q,
      format: 'jsonv2',
      limit: '1',
      countrycodes: 'in',
    });
    const response = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
      headers: HEADERS,
    });
    if (!response.ok) throw new Error(`Nominatim status ${response.status}`);

    const rows = await response.json();
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(404).json({ message: 'Place not found' });
    }

    const data = {
      lat: Number(rows[0].lat),
      lon: Number(rows[0].lon),
      label: rows[0].display_name,
    };
    cache.set(key, { time: Date.now(), data });
    res.status(200).json(data);
  } catch (error) {
    console.log('Geocode error:', error.message);
    res.status(500).json({ message: 'Could not search this place', error: error.message });
  }
});

// Paas ki jagah: GET /api/nearby?lat=26.45&lon=80.33&type=mandi&radius=10000
router.get('/', limiter, async (req, res) => {
  try {
    const lat = Number(req.query.lat);
    const lon = Number(req.query.lon);
    const type = String(req.query.type || '');
    const radius = Math.min(Math.max(Number(req.query.radius) || 10000, 1000), 50000);

    if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
      return res.status(400).json({ message: 'Valid location is required' });
    }
    if (!CATEGORIES[type]) {
      return res.status(400).json({ message: 'Invalid category' });
    }

    // Aas-paas ki location ke liye ek hi cache (lagbhag 1 km ka dayra)
    const key = `${type}:${lat.toFixed(2)}:${lon.toFixed(2)}:${radius}`;
    let elements;
    const cached = cache.get(key);
    if (cached && Date.now() - cached.time < CACHE_MS) {
      elements = cached.data;
    } else {
      elements = await fetchOverpass(buildQuery(CATEGORIES[type], lat, lon, radius));
      cache.set(key, { time: Date.now(), data: elements });
    }

    const places = elements
      .map((el) => {
        const tags = el.tags || {};
        const pLat = el.lat ?? (el.center && el.center.lat);
        const pLon = el.lon ?? (el.center && el.center.lon);
        if (pLat === undefined || pLon === undefined) return null;

        return {
          id: `${el.type}-${el.id}`,
          name: tags.name || '',
          nameHi: tags['name:hi'] || '',
          lat: pLat,
          lon: pLon,
          distanceKm: Math.round(haversineKm(lat, lon, pLat, pLon) * 10) / 10,
          address: [
            tags['addr:street'],
            tags['addr:suburb'] || tags['addr:village'],
            tags['addr:city'] || tags['addr:district'],
          ]
            .filter(Boolean)
            .join(', '),
          phone: tags.phone || tags['contact:phone'] || '',
          openingHours: tags.opening_hours || '',
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, 40);

    res.status(200).json({ count: places.length, places });
  } catch (error) {
    console.log('Nearby error:', error.message);
    res.status(500).json({ message: 'Could not load nearby places', error: error.message });
  }
});

module.exports = router;
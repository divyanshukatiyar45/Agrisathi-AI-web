const express = require('express');

const router = express.Router();

const RESOURCE_ID = '9ef84268-d588-465a-a308-a864a43d0070';
const BASE_URL = `https://api.data.gov.in/resource/${RESOURCE_ID}`;

// Har state ka data 30 minute yaad rakhte hain, taaki API baar-baar na chale
const CACHE_MS = 30 * 60 * 1000;
const cache = new Map();

async function fetchFromApi(state, useKeyword) {
  const params = new URLSearchParams({
    'api-key': process.env.DATA_GOV_API_KEY,
    format: 'json',
    limit: '1000',
  });
  params.set(useKeyword ? 'filters[state.keyword]' : 'filters[state]', state);

  const response = await fetch(`${BASE_URL}?${params.toString()}`);
  const data = await response.json().catch(() => ({}));

  if (!response.ok || data.error) {
    throw new Error(data.message || data.error || `API error ${response.status}`);
  }

  return Array.isArray(data.records) ? data.records : [];
}

const toNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

// Market prices: GET /api/market?state=Uttar Pradesh
router.get('/', async (req, res) => {
  try {
    const state = String(req.query.state || '').trim().slice(0, 40);
    if (!state) {
      return res.status(400).json({ message: 'State is required' });
    }
    if (!process.env.DATA_GOV_API_KEY) {
      return res.status(500).json({ message: 'Market price service is not set up yet' });
    }

    const cached = cache.get(state);
    if (cached && Date.now() - cached.time < CACHE_MS) {
      return res.status(200).json(cached.data);
    }

    let rows = await fetchFromApi(state, true);
    if (rows.length === 0) {
      rows = await fetchFromApi(state, false);
    }

    const records = rows
      .map((r) => ({
        state: r.state,
        district: r.district,
        market: r.market,
        commodity: r.commodity,
        variety: r.variety,
        grade: r.grade,
        date: r.arrival_date,
        min: toNumber(r.min_price),
        max: toNumber(r.max_price),
        modal: toNumber(r.modal_price),
      }))
      .filter((r) => r.commodity && r.modal !== null);

    const data = { state, count: records.length, records };
    cache.set(state, { time: Date.now(), data });

    res.status(200).json(data);
  } catch (error) {
    console.log('Market error:', error.message);
    res.status(500).json({ message: 'Could not load market prices', error: error.message });
  }
});

module.exports = router;
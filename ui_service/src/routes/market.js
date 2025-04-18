const express = require('express');
const router = express.Router();
const axios = require('axios');
require('dotenv').config();

const AV_API_KEY = process.env.ALPHA_VANTAGE_KEY;

router.get('/', async (req, res) => {
    const symbol = req.query.symbol?.toUpperCase();
    if (!symbol) {
        return res.status(400).json({ error: "Missing symbol" });
    }

    const url = `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${symbol}&interval=5min&apikey=${AV_API_KEY}&outputsize=compact`;

    try {
        const response = await axios.get(url);
        const data = response.data;

        if (data['Error Message']) {
            return res.status(400).json({ error: "Invalid symbol or request" });
        } else if (data['Note']) {
            return res.status(429).json({ error: "API rate limit exceeded. Please wait and try again." });
        }

        const timeSeries = data['Time Series (5min)'];
        if (!timeSeries) {
            return res.status(500).json({ error: "Unexpected response structure" });
        }

        // Transform to lightweight-charts format
        const transformed = Object.entries(timeSeries)
            .map(([datetime, ohlcv]) => ({
                time: Math.floor(new Date(datetime).getTime() / 1000), // convert to UNIX timestamp
                open: parseFloat(ohlcv['1. open']),
                high: parseFloat(ohlcv['2. high']),
                low: parseFloat(ohlcv['3. low']),
                close: parseFloat(ohlcv['4. close']),
                volume: parseInt(ohlcv['5. volume']),
            }))
            .sort((a, b) => a.time - b.time); // sort oldest to newest

        return res.status(200).json({ data: transformed });

    } catch (error) {
        console.error("Alpha Vantage fetch error:", error.message);
        return res.status(500).json({ error: "Failed to fetch data from Alpha Vantage" });
    }
});

module.exports = router;

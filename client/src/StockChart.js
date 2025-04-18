import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Box,
  Stack
} from '@mui/material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

const StockChart = () => {
  const [symbol, setSymbol] = useState('');
  const [chartData, setChartData] = useState(null);

  const fetchChartData = async (ticker) => {
    try {
      const res = await fetch(`http://localhost:3000/api/stock-data?symbol=${ticker}`);
      const json = await res.json();
      const data = json.data;

      if (!Array.isArray(data) || data.length === 0) {
        alert('No data or invalid symbol.');
        return;
      }

      // Prepare labels (time) and data (closing prices)
      const labels = data.map(point =>
        new Date(point.time * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      );
      const closePrices = data.map(point => point.close);

      setChartData({
        labels,
        datasets: [
          {
            label: `${ticker} Close Price`,
            data: closePrices,
            borderColor: 'rgba(75,192,192,1)',
            fill: false,
            tension: 0.1,
          },
        ],
      });
    } catch (err) {
      console.error('Chart fetch failed:', err);
      alert('Failed to fetch chart data.');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const ticker = symbol.trim().toUpperCase();
    if (ticker) fetchChartData(ticker);
  };

  return (
    <Card sx={{ mt: 4, boxShadow: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Stock Data within the past Day
        </Typography>

        <Box component="form" onSubmit={handleSubmit} sx={{ mb: 3 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="Enter stock symbol (e.g. AAPL)"
              variant="outlined"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              required
            />
            <Button type="submit" variant="contained" color="primary">
              Load Chart
            </Button>
          </Stack>
        </Box>

        {chartData && (
          <Box sx={{ width: '100%', height: 400 }}>
            <Line data={chartData} />
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default StockChart;

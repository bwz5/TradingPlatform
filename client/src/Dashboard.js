// client/src/Dashboard.js
import React, { useEffect, useState } from 'react';
import {
  Container, Grid, Card, CardContent,
  Typography, List, ListItem, ListItemText,
  TextField, Button, Box,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { apiFetch, clearAuth } from './auth';

export default function Dashboard({ onLogout }) {
  const [stats, setStats] = useState({ balance: 0, holdings: [] });
  const [order, setOrder] = useState({ symbol: '', qty: '', side: 'buy' });
  const nav = useNavigate();

  /* ------------ load portfolio ---------------- */
  useEffect(() => {
    apiFetch('/api/users/me/stats')
      .then(async (res) => {
        if (!res.ok) throw new Error('auth');
        return res.json();
      })
      .then(setStats)
      .catch(() => {
        clearAuth();
        onLogout();
        nav('/login');
      });
  }, []);

  /* ------------ helpers ----------------------- */
  const handleField = (e) =>
    setOrder((o) => ({ ...o, [e.target.name]: e.target.value }));

  const placeOrder = async () => {
    const { symbol, qty, side } = order;
    if (!symbol || !qty) return alert('Fill symbol and quantity');

    const res = await apiFetch('/api/trades', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol, qty, side }),
    });
    const data = await res.json();
    if (!res.ok) return alert(data.msg || 'Order failed');

    alert(data.msg);
    // Refresh balance/holdings after a trade
    apiFetch('/api/users/me/stats')
      .then((r) => r.json())
      .then(setStats);
  };

  /* ------------ UI ---------------------------- */
  return (
    <Container sx={{ mt: 4 }}>
      <Grid container spacing={2}>
        {/* Stats panel */}
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6">Account Balance</Typography>
              <Typography variant="h4" color="primary">
                ${stats.balance.toFixed(2)}
              </Typography>
              <Box mt={4}>
                <Typography variant="h6">Your Holdings</Typography>
                <List>
                  {stats.holdings.map((h) => (
                    <ListItem key={h.symbol}>
                      <ListItemText
                        primary={`${h.symbol}: ${h.shares} shares`}
                        secondary={`Avg cost: $${Number(h.avgCost).toFixed(2)}`}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Trade panel */}
        <Grid item xs={12} md={8}>
          <Card sx={{ borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6">Place Order</Typography>

              <Box
                component="form"
                onSubmit={(e) => {
                  e.preventDefault();
                  placeOrder();
                }}
                sx={{
                  display: 'flex',
                  gap: 2,
                  flexWrap: 'wrap',
                  alignItems: 'center',
                }}
              >
                <TextField
                  label="Symbol"
                  name="symbol"
                  value={order.symbol}
                  onChange={handleField}
                  required
                />
                <TextField
                  label="Quantity"
                  name="qty"
                  type="number"
                  value={order.qty}
                  onChange={handleField}
                  required
                />

                {/* side selector buttons */}
                <Button
                  variant={order.side === 'buy' ? 'contained' : 'outlined'}
                  onClick={() => setOrder((o) => ({ ...o, side: 'buy' }))}
                  sx={{ borderRadius: 2, mt: 1 }}
                >
                  Buy
                </Button>
                <Button
                  variant={order.side === 'sell' ? 'contained' : 'outlined'}
                  color="secondary"
                  onClick={() => setOrder((o) => ({ ...o, side: 'sell' }))}
                  sx={{ borderRadius: 2, mt: 1 }}
                >
                  Sell
                </Button>

                <Button
                  type="submit"
                  variant="contained"
                  sx={{ borderRadius: 2, mt: 1 }}
                >
                  Submit
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}

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
  const [order, setOrder] = useState({ symbol: '', qty: '' });
  const nav = useNavigate();

  /* fetch portfolio */
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

  /* form inputs */
  const handleOrderChange = (e) =>
    setOrder((o) => ({ ...o, [e.target.name]: e.target.value }));

  /* place trade */
  const placeOrder = async () => {
    const res = await apiFetch('/api/trades', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order),
    });
    const data = await res.json();
    if (!res.ok) return alert(data.msg || 'Order failed');
    alert(data.msg);
  };

  return (
    <Container sx={{ mt: 4 }}>
      <Grid container spacing={2}>
        {/* Stats */}
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
                        secondary={`Avg cost: $${h.avgCost.toFixed(2)}`}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Trade */}
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
                  onChange={handleOrderChange}
                  required
                />
                <TextField
                  label="Quantity"
                  name="qty"
                  type="number"
                  value={order.qty}
                  onChange={handleOrderChange}
                  required
                />
                <Button variant="contained" type="submit" sx={{ mt: 1 }}>
                  Buy / Sell
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}

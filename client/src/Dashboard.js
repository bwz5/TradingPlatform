// client/src/Dashboard.js
import React, { useEffect, useState } from 'react';
import {
  Container, Grid, Card, CardContent,
  Typography, List, ListItem, ListItemText,
  TextField, Button, Box,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { apiFetch, clearAuth } from './auth';
import StockChart from './StockChart';

export default function Dashboard({ onLogout }) {
  const [stats, setStats] = useState({ balance: 0, holdings: [] });
  const [order, setOrder] = useState({ symbol: '', qty: '', side: 'buy' });
  const [cashAmt, setCashAmt] = useState('');   // for deposit/withdraw
  const nav = useNavigate();

  /* fetch portfolio on mount */
  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = () =>
    apiFetch('/api/users/me/stats')
      .then(async (res) => {
        if (!res.ok) throw new Error('unauth');
        return res.json();
      })
      .then(setStats)
      .catch(() => {
        clearAuth();
        onLogout();
        nav('/login');
      });

  /* handle buy/sell field change */
  const handleOrderChange = (e) =>
    setOrder((o) => ({ ...o, [e.target.name]: e.target.value }));

  /* place a buy or sell */
  const placeOrder = async () => {
    const { symbol, qty, side } = order;
    if (!symbol || !qty) return alert('Fill symbol and quantity');

    const res = await apiFetch('/api/trades', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol, qty: Number(qty), side }),
    });
    const data = await res.json();
    if (!res.ok) return alert(data.msg || 'Order failed');
    alert(data.msg);
    loadStats();
  };

  /* handle cash amount field change */
  const handleCashChange = (e) => setCashAmt(e.target.value);

  /* deposit cash */
  const deposit = async () => {
    const amt = parseFloat(cashAmt);
    if (!(amt > 0)) return alert('Enter a positive amount');
    const res = await apiFetch('/api/users/me/deposit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: amt }),
    });
    const data = await res.json();
    if (!res.ok) return alert(data.msg || 'Deposit failed');
    alert(`New balance: $${data.balance.toFixed(2)}`);
    setCashAmt('');
    loadStats();
  };

  /* withdraw cash */
  const withdraw = async (amount = null) => {
    const amt = amount != null ? amount : parseFloat(cashAmt);
    if (!(amt > 0)) return alert('Enter a positive amount');
    const res = await apiFetch('/api/users/me/withdraw', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: amt }),
    });
    const data = await res.json();
    if (!res.ok) return alert(data.msg || 'Withdraw failed');
    alert(`New balance: $${data.balance.toFixed(2)}`);
    setCashAmt('');
    loadStats();
  };

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
                        secondary={`Avg cost: $${h.avgCost.toFixed(2)}`}
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
          <Card sx={{ borderRadius: 2, mb: 2 }}>
            <CardContent>
              <Typography variant="h6">Place Order</Typography>
              <Box
                component="form"
                onSubmit={(e) => { e.preventDefault(); placeOrder(); }}
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
                <Button
                  variant={order.side === 'buy' ? 'contained' : 'outlined'}
                  onClick={() => setOrder((o) => ({ ...o, side: 'buy' }))}
                >
                  Buy
                </Button>
                <Button
                  variant={order.side === 'sell' ? 'contained' : 'outlined'}
                  color="secondary"
                  onClick={() => setOrder((o) => ({ ...o, side: 'sell' }))}
                >
                  Sell
                </Button>
                <Button type="submit" variant="contained">
                  Submit
                </Button>
              </Box>
            </CardContent>
          </Card>

          {/* Cash management panel */}
          <Card sx={{ borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Cash Management
              </Typography>
              <Box
                component="form"
                onSubmit={(e) => { e.preventDefault(); deposit(); }}
                sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}
              >
                <TextField
                  label="Amount"
                  type="number"
                  inputProps={{ step: '0.01' }}
                  value={cashAmt}
                  onChange={handleCashChange}
                  required
                />
                <Button variant="contained" onClick={deposit}>
                  Deposit
                </Button>
                <Button variant="contained" color="warning" onClick={() => withdraw()}>
                  Withdraw
                </Button>
                <Button
                  variant="contained"
                  color="error"
                  onClick={() => withdraw(stats.balance)}
                >
                  Cash Out
                </Button>
              </Box>
            </CardContent>
          </Card>
          
          <StockChart />
          
        </Grid>
      </Grid>
    </Container>
  );
}

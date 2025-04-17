import React, { useEffect, useState } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  TextField,
  Button,
  Box,
} from '@mui/material';

export default function Dashboard() {
  const [stats, setStats] = useState({ balance: 0, holdings: [] });
  const [order, setOrder] = useState({ symbol: '', qty: '' });

  useEffect(() => {
    // simple fetch with no auth header
    fetch('/api/users/me/stats')
      .then((res) => res.json())
      .then((data) => setStats(data))
      .catch((err) => {
        console.error(err);
        alert('Could not load stats');
      });
  }, []);

  const handleOrderChange = (e) =>
    setOrder((o) => ({ ...o, [e.target.name]: e.target.value }));
    const username = localStorage.getItem('username') || 'unknown';

    const payload = {
        ...order,
        username,
    }
    const placeOrder = async () => {
        const res = await fetch('/api/trades', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
    
        if (res.ok) {
         alert('Order placed!');
         const username = localStorage.getItem('username') || 'Unknown user';
         alert(`Order placed for ${order.qty} shares of ${order.symbol} by ${username}!`);
          // optionally re-fetch stats here
        } else {
          alert('Order failed');
        }
      };
    

  return (
    <Container sx={{ mt: 4 }}>
      <Grid container spacing={2}>
        {/* Stats Panel */}
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Account Balance
              </Typography>
              <Typography variant="h4" color="primary">
                ${stats.balance.toFixed(2)}
              </Typography>

              <Box mt={4}>
                <Typography variant="h6" gutterBottom>
                  Your Holdings
                </Typography>
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

        {/* Trade Panel */}
        <Grid item xs={12} md={8}>
          <Card sx={{ borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Place Order
              </Typography>
              <Box
                component="form"
                sx={{
                  display: 'flex',
                  gap: 2,
                  flexWrap: 'wrap',
                  alignItems: 'center',
                }}
                onSubmit={(e) => {
                  e.preventDefault();
                  placeOrder();
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
                  type="submit"
                  variant="contained"
                  sx={{ borderRadius: 2, mt: 1 }}
                >
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

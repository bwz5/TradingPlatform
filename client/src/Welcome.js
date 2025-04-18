// client/src/Welcome.js
import React from 'react';
import { Container, Typography, Button, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';

export default function Welcome() {
  const nav = useNavigate();
  return (
    <Container sx={{ mt: 8, textAlign: 'center' }}>
      <Typography variant="h3" gutterBottom>
        Welcome to the TradingPlatform
      </Typography>
      <Box mt={4} display="flex" justifyContent="center" gap={2}>
        <Button variant="contained" onClick={() => nav('/login')}>
          Log In
        </Button>
        <Button variant="outlined" onClick={() => nav('/register')}>
          Register
        </Button>
      </Box>
    </Container>
  );
}

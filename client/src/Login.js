// client/src/Login.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Paper, Typography, TextField, Button, Box } from '@mui/material';
import { setToken } from './auth';

export default function Login({ onLogin }) {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) return alert(data.msg);
      setToken(data.token);
      onLogin();
      nav('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="xs">
      <Paper elevation={3} sx={{ mt: 8, p: 4, borderRadius: 2 }}>
        <Typography variant="h5" align="center" gutterBottom>
          Log In
        </Typography>
        <Box component="form" onSubmit={submit} noValidate>
          <TextField
            fullWidth
            margin="normal"
            label="Email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
          />
          <TextField
            fullWidth
            margin="normal"
            label="Password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            required
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={loading}
            sx={{ mt: 2, borderRadius: 2 }}
          >
            Log In
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}

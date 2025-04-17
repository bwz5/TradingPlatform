// client/src/Login.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
} from '@mui/material';

export default function Login({ onLogin }) {
  const [form, setForm] = useState({ username: '', password: '' });
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        onLogin();
        navigate('/dashboard');
        // persist username
       localStorage.setItem('username', form.username);
       onLogin();
       navigate('/dashboard');
      } else {
        alert(data.message || 'Login failed');
      }
    } catch (err) {
      console.error(err);
      alert('Login error');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!form.username || !form.password) {
      alert('Please fill out both fields');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.status === 201) {
        onLogin();
        navigate('/dashboard');
        // persist username
       localStorage.setItem('username', form.username);
       onLogin();
       navigate('/dashboard');
      } else {
        alert(data.message || 'Registration failed');
      }
    } catch (err) {
      console.error(err);
      alert('Registration error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="xs">
      <Paper elevation={3} sx={{ mt: 8, p: 4, borderRadius: 2 }}>
        <Typography variant="h5" align="center" gutterBottom>
          { /* You could also dynamically switch to “Register” header when they click create */ }
          Sign In / Register
        </Typography>
        <Box component="form" onSubmit={handleLogin} noValidate>
          <TextField
            fullWidth
            margin="normal"
            label="Username"
            name="username"
            value={form.username}
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
            sx={{ mt: 2, borderRadius: 2 }}
            disabled={loading}
          >
            Log In
          </Button>

          <Button
            type="button"
            fullWidth
            variant="outlined"
            sx={{ mt: 1, borderRadius: 2 }}
            onClick={handleRegister}
            disabled={loading}
          >
            Create Account
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}

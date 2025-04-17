// client/src/Header.js
import React from 'react';
import { AppBar, Toolbar, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { clearAuth } from './auth';

export default function Header({ isAuth, onLogout }) {
  const nav = useNavigate();

  const handleLogout = () => {
    clearAuth();
    onLogout();          // flip state in App.js
    nav('/');            // back to Welcome
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <Button color="inherit" onClick={() => nav('/')}>
          Home
        </Button>

        {isAuth ? (
          <>
            <Button color="inherit" onClick={() => nav('/dashboard')}>
              Dashboard
            </Button>
            <Button color="inherit" onClick={handleLogout}>
              Logout
            </Button>
          </>
        ) : (
          <>
            <Button color="inherit" onClick={() => nav('/login')}>
              Login
            </Button>
            <Button color="inherit" onClick={() => nav('/register')}>
              Register
            </Button>
          </>
        )}
      </Toolbar>
    </AppBar>
  );
}

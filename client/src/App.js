// client/src/App.js
import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { isAuthed, clearAuth } from './auth';
import Header     from './Header';
import Welcome    from './Welcome';
import Login      from './Login';
import Register   from './Register';
import Dashboard  from './Dashboard';
import RequireAuth from './RequireAuth';

export default function App() {
  const [auth, setAuth] = useState(isAuthed());

  return (
    <BrowserRouter>
      <Header
        isAuth={auth}
        onLogout={() => {
          clearAuth();
          setAuth(false);
        }}
      />

      <Routes>
        <Route path="/" element={<Welcome />} />

        <Route
          path="/login"
          element={
            auth ? <Navigate to="/dashboard" replace /> :
                   <Login onLogin={() => setAuth(true)} />
          }
        />

        <Route
          path="/register"
          element={
            auth ? <Navigate to="/dashboard" replace /> :
                   <Register onRegister={() => setAuth(true)} />
          }
        />

        <Route
          path="/dashboard"
          element={
            <RequireAuth>
              <Dashboard onLogout={() => setAuth(false)} />
            </RequireAuth>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

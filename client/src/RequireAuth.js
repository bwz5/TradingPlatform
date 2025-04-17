// client/src/RequireAuth.js
import React from 'react';
import { Navigate } from 'react-router-dom';
import { isAuthed } from './auth';

export default function RequireAuth({ children }) {
  return isAuthed() ? children : <Navigate to="/login" replace />;
}

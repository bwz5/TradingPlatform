import React, { useEffect, useState } from 'react';
import { Routes, Route, Link } from 'react-router-dom';

function Home() {
  return <h2>Welcome Home!</h2>;
}

function Users() {
  const [users, setUsers] = useState([]);
  useEffect(() => {
    fetch('/api/users')
      .then(res => res.json())
      .then(data => setUsers(data.users));
  }, []);

  return (
    <div>
      <h2>Users</h2>
      <ul>
        {users.map(u => <li key={u.id}>{u.name}</li>)}
      </ul>
    </div>
  );
}

export default function App() {
  return (
    <div>
      <nav>
        <Link to="/">Home</Link> | <Link to="/users">Users</Link>
      </nav>
      <Routes>
        <Route index element={<Home />} />
        <Route path="users" element={<Users />} />
      </Routes>
    </div>
  );
}

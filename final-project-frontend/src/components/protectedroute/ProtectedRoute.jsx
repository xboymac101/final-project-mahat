import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import axios from 'axios';

export default function ProtectedRoute({ children, requireAdmin = false }) {
  const [auth, setAuth] = useState(null); // null = loading, false = not logged in, object = user info

  useEffect(() => {
    axios.get('/api/auth/me')
      .then((res) => setAuth(res.data))
      .catch(() => setAuth(false)); // not logged in or session expired
  }, []);

  if (auth === null) return <div>Loading...</div>;
  if (!auth) return <Navigate to="/" replace />;
  if (requireAdmin && auth.role !== 'Admin') return <Navigate to="/not-authorized" replace />;

  return children;
}

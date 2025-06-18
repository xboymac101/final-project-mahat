import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import axios from 'axios';

export default function ProtectedRoute({ children, requireAdmin = false, requireStaffOrAdmin = false, requireRegularOnly = false }) {
  const [auth, setAuth] = useState(null);

  useEffect(() => {
    axios.get('/api/auth/me')
      .then((res) => setAuth(res.data))
      .catch(() => setAuth(false));
  }, []);

  if (auth === null) return <div>Loading...</div>;
  if (!auth) return <Navigate to="/" replace />;

  if (requireAdmin && auth.role !== 'Admin') return <Navigate to="/not-authorized" replace />;
  if (requireStaffOrAdmin && !['Admin', 'Staff'].includes(auth.role)) return <Navigate to="/not-authorized" replace />;
  if (requireRegularOnly && auth.role !== 'Regular') return <Navigate to="/not-authorized" replace />;

  return children;
}

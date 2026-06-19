import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/auth/useAuth';
import Spinner from '../general_components/Spinner';

// Route guard: use as a layout route wrapping the routes that require auth.
// Nested routes render through <Outlet/>; unauthenticated users go to /login.
const ProtectedRoute = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <Spinner fullHeight />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Outlet />;
};

export default ProtectedRoute;

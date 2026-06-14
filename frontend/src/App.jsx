import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import theme from './theme';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import HomePage from './pages/HomePage';
import LoginPage from './login/LoginPage';
import RegisterPage from './register/RegisterPage';
import NotFoundPage from './pages/NotFoundPage';

// Create a client for react-query
const queryClient = new QueryClient();

const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Router>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              
              {/* Protected Routes - Add more routes as needed */}
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <div>Profile Page (Coming Soon)</div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/wishlist"
                element={
                  <ProtectedRoute>
                    <div>Wishlist Page (Coming Soon)</div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/gift-finder"
                element={
                  <ProtectedRoute>
                    <div>Gift Finder Page (Coming Soon)</div>
                  </ProtectedRoute>
                }
              />

              {/* 404 Route */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Router>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
};

export default App;

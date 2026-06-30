import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import theme from './theme';
import { AuthProvider } from './context/auth/AuthProvider';
import { ChatWidgetProvider } from './context/chatWidget/ChatWidgetProvider';
import MainLayout from './base_components/MainLayout';
import ProtectedRoute from './base_components/ProtectedRoute';
import HomePage from './home/HomePage';
import LoginPage from './login/LoginPage';
import RegisterPage from './register/RegisterPage';
import MyProfilePage from './profile/MyProfilePage';
import UserProfilePage from './profile/UserProfilePage';
import WishlistPage from './wishlist/WishlistPage';
import GiftBuilderPage from './gift-builder/GiftBuilderPage';
import PrivacyPolicyPage from './privacy/PrivacyPolicyPage';
import TermsOfServicePage from './terms/TermsOfServicePage';
import ProductsPage from './products/ProductsPage';
import NotFoundPage from './not-found/NotFoundPage';

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider theme={theme}>
    <CssBaseline />
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ChatWidgetProvider>
        <Router>
          <Routes>
            {/* Wrapped in the main app shell (Navbar + Footer) */}
            <Route element={<MainLayout />}>
              {/* Public */}
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/privacy" element={<PrivacyPolicyPage />} />
              <Route path="/terms" element={<TermsOfServicePage />} />

              {/* Protected */}
              <Route element={<ProtectedRoute />}>
                <Route path="/products" element={<ProductsPage />} />
                <Route path="/profile" element={<MyProfilePage />} />
                <Route path="/users/:id" element={<UserProfilePage />} />
                <Route path="/wishlist" element={<WishlistPage />} />
                <Route path="/gift-builder" element={<GiftBuilderPage />} />
              </Route>
            </Route>

            {/* 404 (chromeless) */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Router>
        </ChatWidgetProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;

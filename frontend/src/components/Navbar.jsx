import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Button,
  Menu,
  MenuItem,
  Avatar,
  Box,
  Typography,
} from '@mui/material';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleMenuClose();
    navigate('/');
  };

  const handleProfile = () => {
    navigate('/profile');
    handleMenuClose();
  };

  return (
    <AppBar position="sticky" sx={{ backgroundColor: '#FFFFFF', color: '#2D3436' }}>
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        {/* Logo */}
        <Link
          to="/"
          style={{
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: 'inherit',
          }}
        >
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              background: 'linear-gradient(135deg, #FF6B6B 0%, #06D6A0 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            GiftGraph
          </Typography>
        </Link>

        {/* Navigation Links */}
        {isAuthenticated && (
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              component={Link}
              to="/"
              color="inherit"
              sx={{ textTransform: 'none', fontSize: '1rem' }}
            >
              Home
            </Button>
            <Button
              component={Link}
              to="/gift-finder"
              color="inherit"
              sx={{ textTransform: 'none', fontSize: '1rem' }}
            >
              Find a Gift
            </Button>
            <Button
              component={Link}
              to="/wishlist"
              color="inherit"
              sx={{ textTransform: 'none', fontSize: '1rem' }}
            >
              My Wishlist
            </Button>
          </Box>
        )}

        {/* Auth Buttons / User Menu */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {isAuthenticated ? (
            <>
              <Avatar
                onClick={handleMenuOpen}
                sx={{
                  cursor: 'pointer',
                  background: 'linear-gradient(135deg, #FF6B6B 0%, #06D6A0 100%)',
                }}
              >
                U
              </Avatar>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
              >
                <MenuItem onClick={handleProfile}>My Profile</MenuItem>
                <MenuItem onClick={handleLogout}>Logout</MenuItem>
              </Menu>
            </>
          ) : (
            <>
              <Button
                component={Link}
                to="/login"
                color="inherit"
                variant="text"
                sx={{ textTransform: 'none', fontSize: '1rem' }}
              >
                Login
              </Button>
              <Button
                component={Link}
                to="/register"
                color="inherit"
                variant="contained"
                sx={{
                  background: 'linear-gradient(135deg, #FF6B6B 0%, #06D6A0 100%)',
                  textTransform: 'none',
                  fontSize: '1rem',
                }}
              >
                Register
              </Button>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;

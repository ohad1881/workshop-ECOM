import { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
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
import { useAuth } from '../context/auth/useAuth';

const Navbar = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const avatarInitial = (user?.username || user?.email || 'U').charAt(0).toUpperCase();

  const openMenu = (event) => setAnchorEl(event.currentTarget);
  const closeMenu = () => setAnchorEl(null);
  const goProfile = () => {
    navigate('/profile');
    closeMenu();
  };
  const handleLogout = () => {
    logout();
    closeMenu();
    navigate('/');
  };

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: 'background.paper',
        color: 'text.primary',
        borderBottom: 1,
        borderColor: 'divider',
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <Typography
          variant="h4"
          component={RouterLink}
          to="/"
          sx={{ color: 'primary.main', fontWeight: 700, textDecoration: 'none' }}
        >
          GiftGraph
        </Typography>

        {isAuthenticated && (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button component={RouterLink} to="/" color="inherit">
              Home
            </Button>
            <Button component={RouterLink} to="/gift-finder" color="inherit">
              Find a Gift
            </Button>
            <Button component={RouterLink} to="/products" color="inherit">
              Products
            </Button>
            <Button component={RouterLink} to="/wishlist" color="inherit">
              My Wishlist
            </Button>
          </Box>
        )}

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {isAuthenticated ? (
            <>
              <Avatar
                onClick={openMenu}
                sx={{ cursor: 'pointer', bgcolor: 'primary.main' }}
              >
                {avatarInitial}
              </Avatar>
              <Menu anchorEl={anchorEl} open={open} onClose={closeMenu}>
                <MenuItem onClick={goProfile}>My Profile</MenuItem>
                <MenuItem onClick={handleLogout}>Logout</MenuItem>
              </Menu>
            </>
          ) : (
            <>
              <Button component={RouterLink} to="/login" color="inherit">
                Login
              </Button>
              <Button component={RouterLink} to="/register" variant="contained">
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

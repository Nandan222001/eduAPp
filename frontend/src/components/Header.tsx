import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { ShoppingCart as ShoppingCartIcon } from '@mui/icons-material';
import { useAppStore } from '@/store/useAppStore';
import { env } from '@/config/env';
import { motion } from 'motion/react';

export default function Header() {
  const { isAuthenticated, user, logout } = useAppStore();

  const getMerchandiseStoreLink = () => {
    if (!user) return '/';

    switch (user.role) {
      case 'admin':
      case 'institution_admin':
        return '/admin/merchandise';
      case 'teacher':
        return '/teacher/merchandise/store';
      case 'student':
        return '/student/merchandise/store';
      case 'parent':
        return '/parent/merchandise/store';
      default:
        return '/';
    }
  };

  return (
    <AppBar
      position="sticky"
      sx={{
        background: 'rgba(255, 244, 240, 0.75)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(221, 159, 124, 0.15)', // Ghost border
        color: 'text.primary',
        boxShadow: 'none',
        zIndex: 1100,
      }}
    >
      <Toolbar sx={{ minHeight: '80px !important', px: { xs: 2, md: 4 } }}>
        <Typography
          variant="h5"
          component={RouterLink}
          to="/"
          sx={{
            flexGrow: 1,
            textDecoration: 'none',
            color: 'primary.main',
            fontWeight: 800,
            fontFamily: 'Manrope',
            letterSpacing: '-1px',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring' as const, stiffness: 200, damping: 10 }}
            style={{ display: 'flex', alignItems: 'center' }}
          >
            {env.appName}
            <Box
              component="span"
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: 'secondary.main',
                ml: 1,
                mt: 1,
              }}
            />
          </motion.div>
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button color="inherit" component={RouterLink} to="/">
              Home
            </Button>
          </motion.div>
          
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button color="inherit" component={RouterLink} to="/about">
              About
            </Button>
          </motion.div>
          
          {isAuthenticated ? (
            <>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  color="inherit"
                  component={RouterLink}
                  to={getMerchandiseStoreLink()}
                  startIcon={<ShoppingCartIcon />}
                >
                  Store
                </Button>
              </motion.div>
              
              <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mx: 2, fontWeight: 600 }}>
                {user?.fullName}
              </Typography>
              
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  color="secondary"
                  variant="outlined"
                  onClick={logout}
                  sx={{ borderRadius: 24, borderWidth: 2, '&:hover': { borderWidth: 2 } }}
                >
                  Logout
                </Button>
              </motion.div>
            </>
          ) : (
            <motion.div whileHover={{ scale: 1.05, boxShadow: '0px 8px 20px rgba(255, 122, 69, 0.3)' }} whileTap={{ scale: 0.95 }}>
              <Button
                color="primary"
                variant="contained"
                component={RouterLink}
                to="/login"
              >
                Login
              </Button>
            </motion.div>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}

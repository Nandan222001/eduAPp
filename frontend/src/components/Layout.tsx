import { Outlet, useLocation } from 'react-router-dom';
import { Box } from '@mui/material';
import Header from './Header';
import Footer from './Footer';
import { AnimatePresence, motion } from 'motion/react';

export default function Layout() {
  const location = useLocation();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        bgcolor: 'background.default',
      }}
    >
      <Header />
      <Box
        component="main"
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            style={{ 
              flex: 1, 
              display: 'flex', 
              flexDirection: 'column',
              width: '100%'
            }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </Box>
      <Box component="div" sx={{ mt: 'auto' }}>
        <Footer />
      </Box>
    </Box>
  );
}

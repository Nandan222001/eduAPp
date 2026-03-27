import { Container, Typography, Box, Card, CardContent, Grid, Button } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { env } from '@/config/env';
import { motion } from 'motion/react';
import { AutoAwesome, School, Speed, Group } from '@mui/icons-material';

const MotionCard = motion.create(Card);
const MotionBox = motion.create(Box);

import type { Variants } from 'motion/react';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { type: 'spring' as const, stiffness: 100, damping: 12 } 
  },
};

export default function Home() {
  return (
    <Box sx={{ overflow: 'hidden' }}>
      {/* Hero Section */}
      <MotionBox
        initial={{ opacity: 0, backgroundPosition: '0% 0%' }}
        animate={{ opacity: 1, backgroundPosition: '100% 100%' }}
        transition={{ duration: 1.5 }}
        sx={{
          background: 'linear-gradient(135deg, #FFF4F0 0%, #FFDBC9 50%, #D2CCFF 100%)',
          backgroundSize: '200% 200%',
          pt: { xs: 8, md: 15 },
          pb: { xs: 8, md: 20 },
          px: 2,
          position: 'relative',
        }}
      >
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ textAlign: 'center', maxWidth: '800px', mx: 'auto' }}>
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring' as const, stiffness: 150, damping: 15 }}
            >
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  bgcolor: 'rgba(255, 255, 255, 0.6)',
                  backdropFilter: 'blur(10px)',
                  px: 2,
                  py: 1,
                  borderRadius: 24,
                  mb: 4,
                  border: '1px solid rgba(255, 122, 69, 0.2)',
                }}
              >
                <AutoAwesome sx={{ color: 'primary.main', mr: 1, fontSize: 18 }} />
                <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                  The Kinetic Scholar Framework
                </Typography>
              </Box>
            </motion.div>

            <motion.div variants={itemVariants} initial="hidden" animate="visible">
              <Typography 
                variant="h1" 
                component="h1" 
                gutterBottom
                sx={{ 
                  color: 'text.primary',
                  mb: 3
                }}
              >
                Welcome to{' '}
                <Box component="span" sx={{ color: 'primary.main' }}>
                  {env.appName}
                </Box>
              </Typography>
            </motion.div>
            
            <motion.div variants={itemVariants} initial="hidden" animate="visible">
              <Typography 
                variant="h4" 
                color="text.secondary" 
                paragraph
                sx={{ mb: 6, fontWeight: 400, fontFamily: 'Inter' }}
              >
                Propelling you through a curated learning journey. Built with motion, depth, and extreme clarity.
              </Typography>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="contained"
                    size="large"
                    component={RouterLink}
                    to="/login"
                    sx={{ px: 6, py: 2, fontSize: '1.1rem' }}
                  >
                    Start Journey
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="outlined"
                    size="large"
                    component={RouterLink}
                    to="/about"
                    sx={{ 
                      px: 6, 
                      py: 2, 
                      fontSize: '1.1rem',
                      bgcolor: 'rgba(255, 255, 255, 0.5)',
                      backdropFilter: 'blur(10px)',
                      borderWidth: 2,
                      '&:hover': { borderWidth: 2 }
                    }}
                  >
                    Learn More
                  </Button>
                </motion.div>
              </Box>
            </motion.div>
          </Box>
        </Container>

        {/* Decorative ambient blobs */}
        <Box 
          sx={{ 
            position: 'absolute', top: '10%', left: '10%', 
            width: '300px', height: '300px', 
            bgcolor: 'secondary.main', filter: 'blur(150px)', opacity: 0.15,
            zIndex: 0, borderRadius: '50%',
            animation: 'pulse 10s infinite alternate'
          }} 
        />
        <Box 
          sx={{ 
            position: 'absolute', bottom: '10%', right: '10%', 
            width: '400px', height: '400px', 
            bgcolor: 'primary.main', filter: 'blur(150px)', opacity: 0.15,
            zIndex: 0, borderRadius: '50%',
            animation: 'pulse 12s infinite alternate-reverse'
          }} 
        />
      </MotionBox>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: 10, mt: -10, position: 'relative', zIndex: 2 }}>
        <MotionBox
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          <Grid container spacing={4}>
            {[
              { title: 'Dynamic Learning', icon: <School sx={{ fontSize: 40 }}/>, desc: 'Experience education that moves with you, never staying static.' },
              { title: 'Blazing Fast', icon: <Speed sx={{ fontSize: 40 }}/>, desc: 'Built on Vite and React 18 for instantaneous feedback and velocity.' },
              { title: 'Community Driven', icon: <Group sx={{ fontSize: 40 }}/>, desc: 'Connect, compete, and recognize peers with our deep ecosystem.' },
              { title: 'TypeScript Core', icon: <AutoAwesome sx={{ fontSize: 40 }}/>, desc: 'Robust, type-safe architecture ensuring reliability at every step.' },
            ].map((item, i) => (
              <Grid item xs={12} md={6} key={i}>
                <MotionCard
                  variants={itemVariants}
                  whileHover={{ y: -8, scale: 1.02 }}
                  sx={{ 
                    p: 2, 
                    height: '100%',
                    bgcolor: 'background.paper',
                    position: 'relative',
                    overflow: 'visible'
                  }}
                >
                  <CardContent>
                    <Box 
                      sx={{ 
                        width: 64, height: 64, 
                        bgcolor: 'surface.containerLow',
                        borderRadius: 4,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: 3,
                        color: i % 2 === 0 ? 'primary.main' : 'secondary.main',
                        border: '1px solid rgba(221, 159, 124, 0.2)'
                      }}
                    >
                      {item.icon}
                    </Box>
                    <Typography variant="h4" component="h2" gutterBottom>
                      {item.title}
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      {item.desc}
                    </Typography>
                  </CardContent>
                </MotionCard>
              </Grid>
            ))}
          </Grid>
        </MotionBox>
      </Container>
    </Box>
  );
}

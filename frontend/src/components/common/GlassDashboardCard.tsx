import React from 'react';
import { Card, CardContent, CardProps } from '@mui/material';
import { motion, useMotionValue, useTransform } from 'motion/react';

interface GlassDashboardCardProps extends CardProps {
  children: React.ReactNode;
  delay?: number;
}

export default function GlassDashboardCard({ children, delay = 0, sx, ...props }: GlassDashboardCardProps) {
  // 3D Tilt Effect State
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useTransform(y, [-100, 100], [5, -5]);
  const rotateY = useTransform(x, [-100, 100], [-5, 5]);

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set(event.clientX - centerX);
    y.set(event.clientY - centerY);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 30 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ 
        delay, 
        duration: 0.5, 
        type: 'spring', 
        stiffness: 100, 
        damping: 15 
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        perspective: 1000, 
        height: '100%',
        transformStyle: "preserve-3d",
      }}
    >
      <Card
        {...props}
        sx={{
          height: '100%',
          bgcolor: 'rgba(255, 255, 255, 0.4)',
          backdropFilter: 'blur(20px)',
          borderRadius: 4,
          border: '1px solid rgba(255, 255, 255, 0.6)',
          boxShadow: '0 8px 32px 0 rgba(108, 92, 231, 0.1)',
          transition: 'box-shadow 0.3s ease-in-out',
          '&:hover': {
            boxShadow: '0 12px 48px 0 rgba(255, 122, 69, 0.2)',
          },
          ...sx
        }}
      >
        <CardContent sx={{ height: '100%', p: 3, '&:last-child': { pb: 3 } }}>
          <motion.div style={{ transform: 'translateZ(30px)' }}>
            {children}
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

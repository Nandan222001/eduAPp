import React from 'react';
import { Container, Box } from '@mui/material';
import { ParentCommunicationView } from '@/components/communications';

export const ParentCommunicationDashboard: React.FC = () => {
  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 3 }}>
        <ParentCommunicationView />
      </Box>
    </Container>
  );
};

export default ParentCommunicationDashboard;

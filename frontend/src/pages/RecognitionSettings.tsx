import { Box, Typography, Paper, Tabs, Tab, Divider } from '@mui/material';
import { useState } from 'react';
import { Settings as SettingsIcon } from '@mui/icons-material';
import RecognitionNotificationPreferences from '@/components/recognition/RecognitionNotificationPreferences';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function RecognitionSettings() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          <SettingsIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
          Recognition Settings
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Manage your peer recognition preferences and notifications
        </Typography>
      </Box>

      <Paper>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
          <Tab label="Notifications" />
          <Tab label="Privacy" />
        </Tabs>
        <Divider />

        <TabPanel value={activeTab} index={0}>
          <Box sx={{ px: 3 }}>
            <RecognitionNotificationPreferences />
          </Box>
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <Box sx={{ px: 3 }}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Privacy Settings
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Privacy settings for recognitions will be available soon.
              </Typography>
            </Paper>
          </Box>
        </TabPanel>
      </Paper>
    </Box>
  );
}

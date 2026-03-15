import { useState } from 'react';
import { Box, Typography, Tabs, Tab, Container, Paper, useTheme, Alert } from '@mui/material';
import {
  Edit as EditIcon,
  RateReview as ReviewIcon,
  CheckCircle as ApproveIcon,
  LibraryBooks as LibraryIcon,
  Timeline as AnalyticsIcon,
  Feedback as FeedbackIcon,
} from '@mui/icons-material';
import ScholarshipEssayCenter from './ScholarshipEssayCenter';
import EssayPeerReview from './EssayPeerReview';
import {
  CounselorReviewPortal,
  EssayTemplateLibrary,
  EssayAnalyticsDashboard,
  EssayFeedbackDashboard,
} from '@/components/scholarshipEssay';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function ScholarshipEssayDemo() {
  const theme = useTheme();
  const [currentTab, setCurrentTab] = useState(0);

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" fontWeight={700} gutterBottom>
          Scholarship Essay Platform Demo
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Comprehensive demo of all scholarship essay features
        </Typography>
        <Alert severity="info" sx={{ mt: 2 }}>
          This demo uses mock data. Set VITE_USE_MOCK_DATA=true in your environment to enable.
        </Alert>
      </Box>

      <Paper elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
        <Tabs
          value={currentTab}
          onChange={(_, v) => setCurrentTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Essay Center" icon={<EditIcon />} iconPosition="start" />
          <Tab label="Peer Review" icon={<ReviewIcon />} iconPosition="start" />
          <Tab label="Counselor Portal" icon={<ApproveIcon />} iconPosition="start" />
          <Tab label="Template Library" icon={<LibraryIcon />} iconPosition="start" />
          <Tab label="Feedback Dashboard" icon={<FeedbackIcon />} iconPosition="start" />
          <Tab label="Analytics" icon={<AnalyticsIcon />} iconPosition="start" />
        </Tabs>

        <TabPanel value={currentTab} index={0}>
          <ScholarshipEssayCenter />
        </TabPanel>

        <TabPanel value={currentTab} index={1}>
          <EssayPeerReview />
        </TabPanel>

        <TabPanel value={currentTab} index={2}>
          <CounselorReviewPortal />
        </TabPanel>

        <TabPanel value={currentTab} index={3}>
          <EssayTemplateLibrary />
        </TabPanel>

        <TabPanel value={currentTab} index={4}>
          <EssayFeedbackDashboard essayId="e2" />
        </TabPanel>

        <TabPanel value={currentTab} index={5}>
          <EssayAnalyticsDashboard essayId="e2" />
        </TabPanel>
      </Paper>

      <Box sx={{ mt: 4, p: 3, bgcolor: 'background.default', borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom>
          Feature Highlights
        </Typography>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 2,
            mt: 2,
          }}
        >
          <Paper elevation={0} sx={{ p: 2, border: `1px solid ${theme.palette.divider}` }}>
            <Typography variant="subtitle2" gutterBottom>
              📝 Essay Writing
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Rich text editor with formatting, word count tracking, and auto-save
            </Typography>
          </Paper>
          <Paper elevation={0} sx={{ p: 2, border: `1px solid ${theme.palette.divider}` }}>
            <Typography variant="subtitle2" gutterBottom>
              🤖 AI Assistance
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Get AI-powered suggestions for structure, clarity, and impact
            </Typography>
          </Paper>
          <Paper elevation={0} sx={{ p: 2, border: `1px solid ${theme.palette.divider}` }}>
            <Typography variant="subtitle2" gutterBottom>
              ✓ Grammar Check
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Integrated grammar checking with LanguageTool/Grammarly API support
            </Typography>
          </Paper>
          <Paper elevation={0} sx={{ p: 2, border: `1px solid ${theme.palette.divider}` }}>
            <Typography variant="subtitle2" gutterBottom>
              👥 Peer Review
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Rubric-based peer reviews with detailed feedback
            </Typography>
          </Paper>
          <Paper elevation={0} sx={{ p: 2, border: `1px solid ${theme.palette.divider}` }}>
            <Typography variant="subtitle2" gutterBottom>
              👨‍🏫 Counselor Approval
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Final review and approval workflow before submission
            </Typography>
          </Paper>
          <Paper elevation={0} sx={{ p: 2, border: `1px solid ${theme.palette.divider}` }}>
            <Typography variant="subtitle2" gutterBottom>
              📊 Analytics
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Track improvement metrics and version comparisons
            </Typography>
          </Paper>
          <Paper elevation={0} sx={{ p: 2, border: `1px solid ${theme.palette.divider}` }}>
            <Typography variant="subtitle2" gutterBottom>
              📚 Templates
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Learn from successful scholarship essay examples
            </Typography>
          </Paper>
          <Paper elevation={0} sx={{ p: 2, border: `1px solid ${theme.palette.divider}` }}>
            <Typography variant="subtitle2" gutterBottom>
              🔄 Version History
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Track changes and compare versions side-by-side
            </Typography>
          </Paper>
        </Box>
      </Box>
    </Container>
  );
}

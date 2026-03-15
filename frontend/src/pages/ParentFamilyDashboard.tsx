import React, { useState, useMemo } from 'react';
import {
  Container,
  Grid,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Chip,
  IconButton,
  Stack,
  Tabs,
  Tab,
  Badge,
  Divider,
} from '@mui/material';
import {
  SwapHoriz as SwapHorizIcon,
  CalendarMonth as CalendarIcon,
  Assessment as AssessmentIcon,
  Notifications as NotificationsIcon,
  Build as BuildIcon,
  Settings as SettingsIcon,
  People as PeopleIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { parentsApi } from '@/api/parents';
import { FamilyOverviewCards } from '@/components/parent/FamilyOverviewCards';
import { FamilyCalendar } from '@/components/parent/FamilyCalendar';
import { ComparativePerformanceDashboard } from '@/components/parent/ComparativePerformanceDashboard';
import { FamilyNotificationCenter } from '@/components/parent/FamilyNotificationCenter';
import { BulkActionCenter } from '@/components/parent/BulkActionCenter';
import { SiblingLinkingWorkflow } from '@/components/parent/SiblingLinkingWorkflow';
import { PrivacyControlsPanel } from '@/components/parent/PrivacyControlsPanel';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div role="tabpanel" hidden={value !== index} id={`tabpanel-${index}`}>
    {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
  </div>
);

export const ParentFamilyDashboard: React.FC = () => {
  const [selectedChildId, setSelectedChildId] = useState<number | 'all'>('all');
  const [currentTab, setCurrentTab] = useState(0);
  const [quickSwitchOpen, setQuickSwitchOpen] = useState(false);

  const {
    data: children,
    isLoading: childrenLoading,
    error: childrenError,
  } = useQuery({
    queryKey: ['parent-children'],
    queryFn: () => parentsApi.getChildren(),
  });

  const {
    data: familyMetrics,
    isLoading: metricsLoading,
    error: metricsError,
  } = useQuery({
    queryKey: ['family-overview-metrics'],
    queryFn: () => parentsApi.getFamilyOverviewMetrics(),
  });

  const { data: privacySettings, isLoading: privacyLoading } = useQuery({
    queryKey: ['parent-privacy-settings'],
    queryFn: () => parentsApi.getPrivacySettings(),
  });

  const { data: comparativePerformance } = useQuery({
    queryKey: ['family-comparative-performance'],
    queryFn: () => parentsApi.getComparativePerformance(),
    enabled: !privacySettings?.disable_sibling_comparisons,
  });

  const handleChildChange = (event: SelectChangeEvent<number | 'all'>) => {
    setSelectedChildId(event.target.value as number | 'all');
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const handleQuickSwitch = (childId: number | 'all') => {
    setSelectedChildId(childId);
    setQuickSwitchOpen(false);
  };

  const selectedChildren = useMemo(() => {
    if (!children) return [];
    if (selectedChildId === 'all') return children;
    return children.filter((child) => child.id === selectedChildId);
  }, [children, selectedChildId]);

  const isLoading = childrenLoading || metricsLoading || privacyLoading;

  if (isLoading) {
    return (
      <Container maxWidth="xl">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (childrenError || metricsError) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ py: 3 }}>
          <Alert severity="error">Failed to load family dashboard. Please try again later.</Alert>
        </Box>
      </Container>
    );
  }

  if (!children || children.length === 0) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ py: 3 }}>
          <Alert severity="info">
            No children found. Please contact the school administration or use the sibling linking
            feature to add children.
          </Alert>
          <Box sx={{ mt: 3 }}>
            <SiblingLinkingWorkflow />
          </Box>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 3 }}>
        <Box sx={{ mb: 4 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Box>
              <Typography variant="h4" gutterBottom>
                Family Dashboard
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Monitor all your children&apos;s academic progress in one place
              </Typography>
            </Box>
            <Stack direction="row" spacing={2}>
              <IconButton
                color="primary"
                onClick={() => setQuickSwitchOpen(!quickSwitchOpen)}
                aria-label="Quick switch children"
              >
                <Badge badgeContent={children.length} color="secondary">
                  <SwapHorizIcon />
                </Badge>
              </IconButton>
            </Stack>
          </Box>

          {quickSwitchOpen && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Quick Switch
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <Chip
                    label="All Children"
                    color={selectedChildId === 'all' ? 'primary' : 'default'}
                    onClick={() => handleQuickSwitch('all')}
                    icon={<PeopleIcon />}
                  />
                  {children.map((child) => (
                    <Chip
                      key={child.id}
                      label={`${child.first_name} ${child.last_name}`}
                      color={selectedChildId === child.id ? 'primary' : 'default'}
                      onClick={() => handleQuickSwitch(child.id)}
                      avatar={
                        child.photo_url ? (
                          <img src={child.photo_url} alt="" style={{ objectFit: 'cover' }} />
                        ) : undefined
                      }
                    />
                  ))}
                </Stack>
              </CardContent>
            </Card>
          )}

          <Box sx={{ mt: 3, maxWidth: 500 }}>
            <FormControl fullWidth>
              <InputLabel id="child-select-label">View</InputLabel>
              <Select
                labelId="child-select-label"
                id="child-select"
                value={selectedChildId}
                label="View"
                onChange={handleChildChange}
              >
                <MenuItem value="all">
                  <Box display="flex" alignItems="center" gap={1}>
                    <PeopleIcon fontSize="small" />
                    All Children
                  </Box>
                </MenuItem>
                <Divider />
                {children.map((child) => (
                  <MenuItem key={child.id} value={child.id}>
                    {child.first_name} {child.last_name}
                    {child.grade_name &&
                      child.section_name &&
                      ` - ${child.grade_name} ${child.section_name}`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Box>

        {selectedChildId === 'all' && familyMetrics && (
          <Box sx={{ mb: 4 }}>
            <FamilyOverviewCards metrics={familyMetrics} />
          </Box>
        )}

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={currentTab} onChange={handleTabChange} aria-label="Family dashboard tabs">
            <Tab
              icon={<CalendarIcon />}
              label="Calendar"
              iconPosition="start"
              id="tab-0"
              aria-controls="tabpanel-0"
            />
            <Tab
              icon={<AssessmentIcon />}
              label="Performance"
              iconPosition="start"
              id="tab-1"
              aria-controls="tabpanel-1"
              disabled={privacySettings?.disable_sibling_comparisons && selectedChildId === 'all'}
            />
            <Tab
              icon={<NotificationsIcon />}
              label="Notifications"
              iconPosition="start"
              id="tab-2"
              aria-controls="tabpanel-2"
            />
            <Tab
              icon={<BuildIcon />}
              label="Bulk Actions"
              iconPosition="start"
              id="tab-3"
              aria-controls="tabpanel-3"
            />
            <Tab
              icon={<SettingsIcon />}
              label="Settings"
              iconPosition="start"
              id="tab-4"
              aria-controls="tabpanel-4"
            />
          </Tabs>
        </Box>

        <TabPanel value={currentTab} index={0}>
          <FamilyCalendar selectedChildren={selectedChildren} allChildren={children} />
        </TabPanel>

        <TabPanel value={currentTab} index={1}>
          {privacySettings?.disable_sibling_comparisons && selectedChildId === 'all' ? (
            <Alert severity="info">
              Sibling comparisons are disabled. Please select an individual child or enable
              comparisons in settings.
            </Alert>
          ) : (
            <ComparativePerformanceDashboard
              data={comparativePerformance || []}
              selectedChildren={selectedChildren}
              privacySettings={privacySettings}
            />
          )}
        </TabPanel>

        <TabPanel value={currentTab} index={2}>
          <FamilyNotificationCenter selectedChildren={selectedChildren} />
        </TabPanel>

        <TabPanel value={currentTab} index={3}>
          <BulkActionCenter allChildren={children} />
        </TabPanel>

        <TabPanel value={currentTab} index={4}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <PrivacyControlsPanel />
            </Grid>
            <Grid item xs={12} md={6}>
              <SiblingLinkingWorkflow />
            </Grid>
          </Grid>
        </TabPanel>
      </Box>
    </Container>
  );
};

export default ParentFamilyDashboard;

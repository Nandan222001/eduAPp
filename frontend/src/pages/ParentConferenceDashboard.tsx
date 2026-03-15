import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  Avatar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Rating,
  Paper,
  alpha,
  CircularProgress,
  LinearProgress,
  Tabs,
  Tab,
} from '@mui/material';
import {
  VideoCall as VideoCallIcon,
  Cancel as CancelIcon,
  CalendarToday as CalendarIcon,
  AccessTime as AccessTimeIcon,
  School as SchoolIcon,
  Download as DownloadIcon,
  Feedback as FeedbackIcon,
  Timer as TimerIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, parse, differenceInMinutes, parseISO } from 'date-fns';
import { conferencesApi } from '@/api/conferences';
import type { UpcomingConference, PastConference } from '@/types/conference';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`conference-tabpanel-${index}`}
      aria-labelledby={`conference-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export const ParentConferenceDashboard: React.FC = () => {
  const queryClient = useQueryClient();
  const [tabValue, setTabValue] = useState(0);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [selectedConference, setSelectedConference] = useState<
    UpcomingConference | PastConference | null
  >(null);
  const [feedback, setFeedback] = useState('');
  const [rating, setRating] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['conference-dashboard'],
    queryFn: () => conferencesApi.getDashboard(),
    refetchInterval: 60000,
  });

  const cancelMutation = useMutation({
    mutationFn: conferencesApi.cancelBooking,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conference-dashboard'] });
      setCancelDialogOpen(false);
      setSelectedConference(null);
    },
  });

  const feedbackMutation = useMutation({
    mutationFn: ({
      bookingId,
      feedback,
      rating,
    }: {
      bookingId: number;
      feedback: string;
      rating: number;
    }) => conferencesApi.submitFeedback(bookingId, feedback, rating),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conference-dashboard'] });
      setFeedbackDialogOpen(false);
      setSelectedConference(null);
      setFeedback('');
      setRating(null);
    },
  });

  const handleCancelClick = (conference: UpcomingConference) => {
    setSelectedConference(conference);
    setCancelDialogOpen(true);
  };

  const handleFeedbackClick = (conference: PastConference) => {
    setSelectedConference(conference);
    setFeedbackDialogOpen(true);
  };

  const handleCancelConfirm = () => {
    if (selectedConference) {
      cancelMutation.mutate(selectedConference.id);
    }
  };

  const handleFeedbackSubmit = () => {
    if (selectedConference && feedback && rating) {
      feedbackMutation.mutate({ bookingId: selectedConference.id, feedback, rating });
    }
  };

  const handleJoinMeeting = (meetingUrl: string) => {
    window.open(meetingUrl, '_blank');
  };

  const getTimeUntilStart = (conference: UpcomingConference) => {
    const conferenceDateTime = parseISO(`${conference.date}T${conference.start_time}`);
    const minutesUntil = differenceInMinutes(conferenceDateTime, currentTime);

    if (minutesUntil < 0) return 'Started';
    if (minutesUntil === 0) return 'Starting now';
    if (minutesUntil < 60) return `${minutesUntil} minutes`;
    if (minutesUntil < 1440) return `${Math.floor(minutesUntil / 60)} hours`;
    return `${Math.floor(minutesUntil / 1440)} days`;
  };

  const canJoinMeeting = (conference: UpcomingConference) => {
    const conferenceDateTime = parseISO(`${conference.date}T${conference.start_time}`);
    const minutesUntil = differenceInMinutes(conferenceDateTime, currentTime);
    return minutesUntil <= 5 && minutesUntil >= -conference.duration_minutes;
  };

  const handleDownloadICS = async (bookingId: number) => {
    try {
      const blob = await conferencesApi.downloadICS(bookingId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `conference-${bookingId}.ics`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to download ICS:', error);
    }
  };

  if (isLoading) {
    return (
      <Container maxWidth="lg">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant="h4" fontWeight={700} gutterBottom>
              Conference Dashboard
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage your parent-teacher conferences
            </Typography>
          </Box>
          <Button variant="contained" href="/parent/conferences/book">
            Book New Conference
          </Button>
        </Box>

        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)} sx={{ mb: 2 }}>
          <Tab label={`Upcoming (${dashboardData?.upcoming_conferences.length || 0})`} />
          <Tab label={`Past (${dashboardData?.past_conferences.length || 0})`} />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          {dashboardData?.upcoming_conferences && dashboardData.upcoming_conferences.length > 0 ? (
            <Grid container spacing={3}>
              {dashboardData.upcoming_conferences.map((conference) => (
                <Grid item xs={12} key={conference.id}>
                  <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
                    <CardContent>
                      <Grid container spacing={3}>
                        <Grid item xs={12} md={8}>
                          <Box display="flex" gap={2} alignItems="start">
                            <Avatar
                              src={conference.teacher?.photo_url}
                              sx={{ width: 64, height: 64 }}
                            >
                              {conference.teacher?.first_name.charAt(0)}
                            </Avatar>
                            <Box flex={1}>
                              <Box display="flex" alignItems="center" gap={1} mb={1}>
                                <Typography variant="h6" fontWeight={700}>
                                  {conference.teacher?.first_name} {conference.teacher?.last_name}
                                </Typography>
                                <Chip
                                  label={conference.status}
                                  size="small"
                                  color={
                                    conference.status === 'confirmed'
                                      ? 'success'
                                      : conference.status === 'pending'
                                        ? 'warning'
                                        : 'default'
                                  }
                                />
                              </Box>

                              <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                                <SchoolIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                                <Typography variant="body2" color="text.secondary">
                                  Student: {conference.student?.first_name}{' '}
                                  {conference.student?.last_name}
                                </Typography>
                              </Box>

                              <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                                <CalendarIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                                <Typography variant="body2" color="text.secondary">
                                  {format(
                                    parse(conference.date, 'yyyy-MM-dd', new Date()),
                                    'EEEE, MMMM d, yyyy'
                                  )}
                                </Typography>
                              </Box>

                              <Box display="flex" alignItems="center" gap={1} mb={2}>
                                <AccessTimeIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                                <Typography variant="body2" color="text.secondary">
                                  {conference.start_time} - {conference.end_time} (
                                  {conference.duration_minutes} min)
                                </Typography>
                              </Box>

                              <Box>
                                <Typography variant="subtitle2" gutterBottom>
                                  Topics:
                                </Typography>
                                <Box display="flex" gap={1} flexWrap="wrap">
                                  {conference.topics.map((topic, idx) => (
                                    <Chip key={idx} label={topic.replace(/_/g, ' ')} size="small" />
                                  ))}
                                </Box>
                              </Box>

                              {conference.special_requests && (
                                <Box mt={2}>
                                  <Typography variant="subtitle2" gutterBottom>
                                    Special Requests:
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    {conference.special_requests}
                                  </Typography>
                                </Box>
                              )}
                            </Box>
                          </Box>
                        </Grid>

                        <Grid item xs={12} md={4}>
                          <Paper
                            sx={{
                              p: 3,
                              textAlign: 'center',
                              bgcolor: alpha('#1976d2', 0.05),
                              border: '1px solid',
                              borderColor: 'primary.main',
                            }}
                          >
                            <TimerIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
                            <Typography
                              variant="h5"
                              fontWeight={700}
                              color="primary.main"
                              gutterBottom
                            >
                              {getTimeUntilStart(conference)}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              until conference starts
                            </Typography>

                            {conference.status === 'confirmed' && canJoinMeeting(conference) && (
                              <Box mt={2}>
                                <LinearProgress
                                  variant="determinate"
                                  value={100}
                                  sx={{ mb: 1, height: 6, borderRadius: 1 }}
                                />
                                <Alert severity="success" sx={{ mb: 2 }}>
                                  Meeting is ready to join!
                                </Alert>
                              </Box>
                            )}

                            <Box display="flex" flexDirection="column" gap={1} mt={2}>
                              {conference.status === 'confirmed' &&
                                conference.meeting_url &&
                                canJoinMeeting(conference) && (
                                  <Button
                                    variant="contained"
                                    startIcon={<VideoCallIcon />}
                                    onClick={() => handleJoinMeeting(conference.meeting_url!)}
                                    fullWidth
                                  >
                                    Join Meeting
                                  </Button>
                                )}
                              <Button
                                variant="outlined"
                                startIcon={<DownloadIcon />}
                                onClick={() => handleDownloadICS(conference.id)}
                                size="small"
                                fullWidth
                              >
                                Download ICS
                              </Button>
                              {conference.status !== 'cancelled' && (
                                <Button
                                  variant="outlined"
                                  color="error"
                                  startIcon={<CancelIcon />}
                                  onClick={() => handleCancelClick(conference)}
                                  size="small"
                                  fullWidth
                                >
                                  Cancel
                                </Button>
                              )}
                            </Box>
                          </Paper>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Alert severity="info">
              No upcoming conferences. <a href="/parent/conferences/book">Book a conference</a> to
              get started.
            </Alert>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {dashboardData?.past_conferences && dashboardData.past_conferences.length > 0 ? (
            <Grid container spacing={3}>
              {dashboardData.past_conferences.map((conference) => (
                <Grid item xs={12} key={conference.id}>
                  <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
                    <CardContent>
                      <Grid container spacing={3}>
                        <Grid item xs={12} md={9}>
                          <Box display="flex" gap={2} alignItems="start">
                            <Avatar
                              src={conference.teacher?.photo_url}
                              sx={{ width: 56, height: 56 }}
                            >
                              {conference.teacher?.first_name.charAt(0)}
                            </Avatar>
                            <Box flex={1}>
                              <Box display="flex" alignItems="center" gap={1} mb={1}>
                                <Typography variant="h6" fontWeight={700}>
                                  {conference.teacher?.first_name} {conference.teacher?.last_name}
                                </Typography>
                                <Chip
                                  icon={<CheckCircleIcon />}
                                  label="Completed"
                                  size="small"
                                  color="success"
                                />
                              </Box>

                              <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                                <SchoolIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                                <Typography variant="body2" color="text.secondary">
                                  Student: {conference.student?.first_name}{' '}
                                  {conference.student?.last_name}
                                </Typography>
                              </Box>

                              <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                                <CalendarIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                                <Typography variant="body2" color="text.secondary">
                                  {format(
                                    parse(conference.date, 'yyyy-MM-dd', new Date()),
                                    'EEEE, MMMM d, yyyy'
                                  )}
                                </Typography>
                              </Box>

                              <Box display="flex" alignItems="center" gap={1} mb={2}>
                                <AccessTimeIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                                <Typography variant="body2" color="text.secondary">
                                  {conference.start_time} - {conference.end_time}
                                </Typography>
                              </Box>

                              <Box mb={2}>
                                <Typography variant="subtitle2" gutterBottom>
                                  Topics Discussed:
                                </Typography>
                                <Box display="flex" gap={1} flexWrap="wrap">
                                  {conference.topics.map((topic, idx) => (
                                    <Chip
                                      key={idx}
                                      label={topic.replace(/_/g, ' ')}
                                      size="small"
                                      variant="outlined"
                                    />
                                  ))}
                                </Box>
                              </Box>

                              {conference.teacher_notes && (
                                <Paper sx={{ p: 2, bgcolor: alpha('#1976d2', 0.05) }}>
                                  <Typography variant="subtitle2" gutterBottom>
                                    Teacher&apos;s Notes:
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    {conference.teacher_notes}
                                  </Typography>
                                </Paper>
                              )}

                              {conference.parent_feedback && (
                                <Paper sx={{ p: 2, bgcolor: alpha('#4caf50', 0.05), mt: 2 }}>
                                  <Box
                                    display="flex"
                                    justifyContent="space-between"
                                    alignItems="center"
                                    mb={1}
                                  >
                                    <Typography variant="subtitle2">Your Feedback:</Typography>
                                    {conference.parent_rating && (
                                      <Rating
                                        value={conference.parent_rating}
                                        readOnly
                                        size="small"
                                      />
                                    )}
                                  </Box>
                                  <Typography variant="body2" color="text.secondary">
                                    {conference.parent_feedback}
                                  </Typography>
                                </Paper>
                              )}
                            </Box>
                          </Box>
                        </Grid>

                        <Grid item xs={12} md={3}>
                          <Box display="flex" flexDirection="column" gap={1}>
                            {!conference.has_feedback && (
                              <Button
                                variant="contained"
                                startIcon={<FeedbackIcon />}
                                onClick={() => handleFeedbackClick(conference)}
                                fullWidth
                              >
                                Provide Feedback
                              </Button>
                            )}
                            <Button
                              variant="outlined"
                              startIcon={<DownloadIcon />}
                              onClick={() => handleDownloadICS(conference.id)}
                              size="small"
                              fullWidth
                            >
                              Download Summary
                            </Button>
                          </Box>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Alert severity="info">No past conferences to display.</Alert>
          )}
        </TabPanel>

        <Dialog
          open={cancelDialogOpen}
          onClose={() => setCancelDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Cancel Conference</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to cancel this conference? This action cannot be undone.
            </Typography>
            {selectedConference && (
              <Paper sx={{ p: 2, mt: 2, bgcolor: alpha('#f44336', 0.05) }}>
                <Typography variant="subtitle2" gutterBottom>
                  Conference Details:
                </Typography>
                <Typography variant="body2">
                  Teacher: {selectedConference.teacher?.first_name}{' '}
                  {selectedConference.teacher?.last_name}
                </Typography>
                <Typography variant="body2">
                  Date:{' '}
                  {format(parse(selectedConference.date, 'yyyy-MM-dd', new Date()), 'MMMM d, yyyy')}
                </Typography>
                <Typography variant="body2">
                  Time: {selectedConference.start_time} - {selectedConference.end_time}
                </Typography>
              </Paper>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCancelDialogOpen(false)}>Keep Conference</Button>
            <Button
              onClick={handleCancelConfirm}
              color="error"
              variant="contained"
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending ? <CircularProgress size={24} /> : 'Cancel Conference'}
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={feedbackDialogOpen}
          onClose={() => setFeedbackDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Provide Feedback</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Rate your conference experience
              </Typography>
              <Rating
                value={rating}
                onChange={(_, newValue) => setRating(newValue)}
                size="large"
                sx={{ mb: 3 }}
              />

              <TextField
                fullWidth
                multiline
                rows={4}
                label="Your Feedback"
                placeholder="Share your thoughts about the conference..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setFeedbackDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleFeedbackSubmit}
              variant="contained"
              disabled={!feedback || !rating || feedbackMutation.isPending}
            >
              {feedbackMutation.isPending ? <CircularProgress size={24} /> : 'Submit Feedback'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default ParentConferenceDashboard;

import React, { useState } from 'react';
import {
  Container,
  Grid,
  Box,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Button,
  Chip,
  Avatar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemText,
  Paper,
  IconButton,
  alpha,
  CircularProgress,
  Tabs,
  Tab,
  Badge,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  VideoCall as VideoCallIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Edit as EditIcon,
  CalendarToday as CalendarIcon,
  AccessTime as AccessTimeIcon,
  Save as SaveIcon,
  Assignment as AssignmentIcon,
  Star as StarIcon,
} from '@mui/icons-material';
import { DatePicker, LocalizationProvider, TimePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, parse, addMonths } from 'date-fns';
import { conferencesApi } from '@/api/conferences';
import type { ConferenceBooking, ConferenceSlot } from '@/types/conference';

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
      id={`teacher-conference-tabpanel-${index}`}
      aria-labelledby={`teacher-conference-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export const TeacherConferenceManager: React.FC = () => {
  const queryClient = useQueryClient();
  const [tabValue, setTabValue] = useState(0);
  const [availabilityDialogOpen, setAvailabilityDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [timeSlots, setTimeSlots] = useState<Array<{ start: Date | null; end: Date | null }>>([
    { start: null, end: null },
  ]);
  const [notesDialogOpen, setNotesDialogOpen] = useState(false);
  const [selectedConference, setSelectedConference] = useState<ConferenceBooking | null>(null);
  const [notes, setNotes] = useState('');
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false);
  const [newSlotId, setNewSlotId] = useState('');
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['teacher-conference-dashboard'],
    queryFn: () => conferencesApi.getTeacherDashboard(),
    refetchInterval: 60000,
  });

  const updateAvailabilityMutation = useMutation({
    mutationFn: ({ date, slots }: { date: string; slots: Omit<ConferenceSlot, 'id'>[] }) =>
      conferencesApi.updateAvailability(date, slots),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-conference-dashboard'] });
      setAvailabilityDialogOpen(false);
      setTimeSlots([{ start: null, end: null }]);
    },
  });

  const acceptMutation = useMutation({
    mutationFn: conferencesApi.acceptBookingRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-conference-dashboard'] });
    },
  });

  const rescheduleMutation = useMutation({
    mutationFn: ({ bookingId, slotId }: { bookingId: number; slotId: string }) =>
      conferencesApi.rescheduleBooking(bookingId, slotId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-conference-dashboard'] });
      setRescheduleDialogOpen(false);
      setSelectedConference(null);
      setNewSlotId('');
    },
  });

  const saveNotesMutation = useMutation({
    mutationFn: ({ bookingId, notes }: { bookingId: number; notes: string }) =>
      conferencesApi.saveConferenceNotes(bookingId, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-conference-dashboard'] });
      setNotesDialogOpen(false);
      setSelectedConference(null);
      setNotes('');
    },
  });

  const startMeetingMutation = useMutation({
    mutationFn: conferencesApi.startMeeting,
    onSuccess: (data) => {
      window.open(data.meeting_url, '_blank');
      queryClient.invalidateQueries({ queryKey: ['teacher-conference-dashboard'] });
    },
  });

  const handleAddTimeSlot = () => {
    setTimeSlots([...timeSlots, { start: null, end: null }]);
  };

  const handleRemoveTimeSlot = (index: number) => {
    setTimeSlots(timeSlots.filter((_, i) => i !== index));
  };

  const handleTimeSlotChange = (index: number, field: 'start' | 'end', value: Date | null) => {
    const newSlots = [...timeSlots];
    newSlots[index][field] = value;
    setTimeSlots(newSlots);
  };

  const handleSaveAvailability = () => {
    if (!selectedDate) return;

    const validSlots = timeSlots.filter((slot) => slot.start && slot.end);
    const formattedSlots = validSlots.map((slot) => ({
      teacher_id: 0,
      date: format(selectedDate, 'yyyy-MM-dd'),
      start_time: format(slot.start!, 'HH:mm'),
      end_time: format(slot.end!, 'HH:mm'),
      duration_minutes: Math.floor((slot.end!.getTime() - slot.start!.getTime()) / (1000 * 60)),
      is_available: true,
    }));

    updateAvailabilityMutation.mutate({
      date: format(selectedDate, 'yyyy-MM-dd'),
      slots: formattedSlots,
    });
  };

  const handleAcceptRequest = (bookingId: number) => {
    acceptMutation.mutate(bookingId);
  };

  const handleRescheduleClick = (conference: ConferenceBooking) => {
    setSelectedConference(conference);
    setRescheduleDialogOpen(true);
  };

  const handleRescheduleConfirm = () => {
    if (selectedConference && newSlotId) {
      rescheduleMutation.mutate({ bookingId: selectedConference.id, slotId: newSlotId });
    }
  };

  const handleNotesClick = (conference: ConferenceBooking) => {
    setSelectedConference(conference);
    setNotes(conference.notes || '');
    setNotesDialogOpen(true);
  };

  const handleSaveNotes = () => {
    if (selectedConference) {
      saveNotesMutation.mutate({ bookingId: selectedConference.id, notes });
    }
  };

  const handleStartMeeting = (bookingId: number) => {
    startMeetingMutation.mutate(bookingId);
  };

  const handleViewFeedback = (conference: ConferenceBooking) => {
    setSelectedConference(conference);
    setFeedbackDialogOpen(true);
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
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant="h4" fontWeight={700} gutterBottom>
              Conference Manager
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage your parent-teacher conferences and availability
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setAvailabilityDialogOpen(true)}
          >
            Set Availability
          </Button>
        </Box>

        {dashboardData?.statistics && (
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
                <CardContent>
                  <Typography variant="h4" fontWeight={700} color="primary.main">
                    {dashboardData.statistics.total_conferences}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Conferences
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
                <CardContent>
                  <Typography variant="h4" fontWeight={700} color="info.main">
                    {dashboardData.statistics.this_month}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    This Month
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="h4" fontWeight={700} color="success.main">
                      {dashboardData.statistics.average_rating.toFixed(1)}
                    </Typography>
                    <StarIcon sx={{ color: 'warning.main' }} />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Average Rating
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
                <CardContent>
                  <Typography variant="h4" fontWeight={700} color="warning.main">
                    {dashboardData.statistics.pending_requests}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pending Requests
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)} sx={{ mb: 2 }}>
          <Tab
            label={
              <Badge badgeContent={dashboardData?.pending_requests.length || 0} color="error">
                <Box sx={{ pr: 2 }}>Booking Requests</Box>
              </Badge>
            }
          />
          <Tab label={`Upcoming (${dashboardData?.upcoming_conferences.length || 0})`} />
          <Tab label={`Past (${dashboardData?.past_conferences.length || 0})`} />
          <Tab label="Availability" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          {dashboardData?.pending_requests && dashboardData.pending_requests.length > 0 ? (
            <Grid container spacing={2}>
              {dashboardData.pending_requests.map((request) => (
                <Grid item xs={12} key={request.id}>
                  <Card elevation={0} sx={{ border: '1px solid', borderColor: 'warning.main' }}>
                    <CardContent>
                      <Grid container spacing={3}>
                        <Grid item xs={12} md={8}>
                          <Box display="flex" gap={2} alignItems="start">
                            <Avatar
                              src={request.student?.photo_url}
                              sx={{ width: 56, height: 56, bgcolor: 'primary.main' }}
                            >
                              {request.student?.first_name.charAt(0)}
                            </Avatar>
                            <Box flex={1}>
                              <Box display="flex" alignItems="center" gap={1} mb={1}>
                                <Typography variant="h6" fontWeight={700}>
                                  {request.student?.first_name} {request.student?.last_name}
                                </Typography>
                                <Chip label="Pending" size="small" color="warning" />
                              </Box>

                              {request.student?.grade_name && request.student?.section_name && (
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                  {request.student.grade_name} {request.student.section_name}
                                  {request.student.admission_number &&
                                    ` • ${request.student.admission_number}`}
                                </Typography>
                              )}

                              <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                                <CalendarIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                                <Typography variant="body2" color="text.secondary">
                                  {format(
                                    parse(request.date, 'yyyy-MM-dd', new Date()),
                                    'EEEE, MMMM d, yyyy'
                                  )}
                                </Typography>
                              </Box>

                              <Box display="flex" alignItems="center" gap={1} mb={2}>
                                <AccessTimeIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                                <Typography variant="body2" color="text.secondary">
                                  {request.start_time} - {request.end_time}
                                </Typography>
                              </Box>

                              <Box mb={2}>
                                <Typography variant="subtitle2" gutterBottom>
                                  Topics Requested:
                                </Typography>
                                <Box display="flex" gap={1} flexWrap="wrap">
                                  {request.topics.map((topic, idx) => (
                                    <Chip key={idx} label={topic.replace(/_/g, ' ')} size="small" />
                                  ))}
                                </Box>
                              </Box>

                              {request.special_requests && (
                                <Paper sx={{ p: 2, bgcolor: alpha('#ff9800', 0.05) }}>
                                  <Typography variant="subtitle2" gutterBottom>
                                    Special Requests:
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    {request.special_requests}
                                  </Typography>
                                </Paper>
                              )}
                            </Box>
                          </Box>
                        </Grid>

                        <Grid item xs={12} md={4}>
                          <Box display="flex" flexDirection="column" gap={1}>
                            <Button
                              variant="contained"
                              color="success"
                              startIcon={<CheckIcon />}
                              onClick={() => handleAcceptRequest(request.id)}
                              disabled={acceptMutation.isPending}
                              fullWidth
                            >
                              Accept
                            </Button>
                            <Button
                              variant="outlined"
                              startIcon={<EditIcon />}
                              onClick={() => handleRescheduleClick(request)}
                              fullWidth
                            >
                              Reschedule
                            </Button>
                            <Button
                              variant="outlined"
                              color="error"
                              startIcon={<CloseIcon />}
                              fullWidth
                            >
                              Decline
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
            <Alert severity="info">No pending booking requests.</Alert>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {dashboardData?.upcoming_conferences && dashboardData.upcoming_conferences.length > 0 ? (
            <Grid container spacing={2}>
              {dashboardData.upcoming_conferences.map((conference) => (
                <Grid item xs={12} key={conference.id}>
                  <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
                    <CardContent>
                      <Grid container spacing={3}>
                        <Grid item xs={12} md={8}>
                          <Box display="flex" gap={2} alignItems="start">
                            <Avatar
                              src={conference.student?.photo_url}
                              sx={{ width: 56, height: 56, bgcolor: 'success.main' }}
                            >
                              {conference.student?.first_name.charAt(0)}
                            </Avatar>
                            <Box flex={1}>
                              <Box display="flex" alignItems="center" gap={1} mb={1}>
                                <Typography variant="h6" fontWeight={700}>
                                  {conference.student?.first_name} {conference.student?.last_name}
                                </Typography>
                                <Chip label={conference.status} size="small" color="success" />
                              </Box>

                              {conference.student?.grade_name &&
                                conference.student?.section_name && (
                                  <Typography variant="body2" color="text.secondary" gutterBottom>
                                    {conference.student.grade_name}{' '}
                                    {conference.student.section_name}
                                  </Typography>
                                )}

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

                              <Box>
                                <Typography variant="subtitle2" gutterBottom>
                                  Topics:
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
                            </Box>
                          </Box>
                        </Grid>

                        <Grid item xs={12} md={4}>
                          <Box display="flex" flexDirection="column" gap={1}>
                            <Button
                              variant="contained"
                              startIcon={<VideoCallIcon />}
                              onClick={() => handleStartMeeting(conference.id)}
                              disabled={startMeetingMutation.isPending}
                              fullWidth
                            >
                              Start Meeting
                            </Button>
                            <Button
                              variant="outlined"
                              startIcon={<AssignmentIcon />}
                              onClick={() => handleNotesClick(conference)}
                              fullWidth
                            >
                              Add Notes
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
            <Alert severity="info">No upcoming conferences scheduled.</Alert>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          {dashboardData?.past_conferences && dashboardData.past_conferences.length > 0 ? (
            <Grid container spacing={2}>
              {dashboardData.past_conferences.map((conference) => (
                <Grid item xs={12} key={conference.id}>
                  <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
                    <CardContent>
                      <Grid container spacing={3}>
                        <Grid item xs={12} md={9}>
                          <Box display="flex" gap={2} alignItems="start">
                            <Avatar
                              src={conference.student?.photo_url}
                              sx={{ width: 48, height: 48 }}
                            >
                              {conference.student?.first_name.charAt(0)}
                            </Avatar>
                            <Box flex={1}>
                              <Typography variant="h6" fontWeight={700} gutterBottom>
                                {conference.student?.first_name} {conference.student?.last_name}
                              </Typography>

                              <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                                <CalendarIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                <Typography variant="body2" color="text.secondary">
                                  {format(
                                    parse(conference.date, 'yyyy-MM-dd', new Date()),
                                    'MMM d, yyyy'
                                  )}{' '}
                                  • {conference.start_time}
                                </Typography>
                              </Box>

                              {conference.notes && (
                                <Paper sx={{ p: 2, mt: 2, bgcolor: alpha('#1976d2', 0.05) }}>
                                  <Typography variant="subtitle2" gutterBottom>
                                    Your Notes:
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    {conference.notes}
                                  </Typography>
                                </Paper>
                              )}

                              {conference.parent_feedback && (
                                <Paper sx={{ p: 2, mt: 2, bgcolor: alpha('#4caf50', 0.05) }}>
                                  <Box
                                    display="flex"
                                    justifyContent="space-between"
                                    alignItems="center"
                                    mb={1}
                                  >
                                    <Typography variant="subtitle2">Parent Feedback:</Typography>
                                    {conference.parent_rating && (
                                      <Box display="flex" alignItems="center" gap={0.5}>
                                        <StarIcon sx={{ color: 'warning.main', fontSize: 20 }} />
                                        <Typography variant="body2" fontWeight={700}>
                                          {conference.parent_rating}/5
                                        </Typography>
                                      </Box>
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
                          {conference.parent_feedback && (
                            <Button
                              variant="outlined"
                              startIcon={<StarIcon />}
                              onClick={() => handleViewFeedback(conference)}
                              fullWidth
                            >
                              View Feedback
                            </Button>
                          )}
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

        <TabPanel value={tabValue} index={3}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
            <CardHeader
              title="Manage Availability"
              subheader="Set your available time slots for parent-teacher conferences"
              action={
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setAvailabilityDialogOpen(true)}
                >
                  Add Availability
                </Button>
              }
            />
            <CardContent>
              {dashboardData?.availability && dashboardData.availability.length > 0 ? (
                <Grid container spacing={2}>
                  {dashboardData.availability.map((dayAvailability) => (
                    <Grid item xs={12} sm={6} md={4} key={dayAvailability.date}>
                      <Paper sx={{ p: 2, border: '1px solid', borderColor: 'divider' }}>
                        <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                          {format(
                            parse(dayAvailability.date, 'yyyy-MM-dd', new Date()),
                            'EEEE, MMM d'
                          )}
                        </Typography>
                        <List dense>
                          {dayAvailability.slots.map((slot) => (
                            <ListItem key={slot.id} sx={{ px: 0 }}>
                              <ListItemText
                                primary={`${slot.start_time} - ${slot.end_time}`}
                                secondary={
                                  <Chip
                                    label={slot.is_booked ? 'Booked' : 'Available'}
                                    size="small"
                                    color={slot.is_booked ? 'default' : 'success'}
                                    sx={{ mt: 0.5 }}
                                  />
                                }
                              />
                            </ListItem>
                          ))}
                        </List>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Alert severity="info">
                  No availability set. Click &quot;Add Availability&quot; to set your available time
                  slots.
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabPanel>

        <Dialog
          open={availabilityDialogOpen}
          onClose={() => setAvailabilityDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Set Availability</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Select Date"
                  value={selectedDate}
                  onChange={setSelectedDate}
                  minDate={new Date()}
                  maxDate={addMonths(new Date(), 3)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      sx: { mb: 3 },
                    },
                  }}
                />

                <Typography variant="subtitle2" gutterBottom>
                  Time Slots
                </Typography>
                {timeSlots.map((slot, index) => (
                  <Box key={index} display="flex" gap={2} alignItems="center" mb={2}>
                    <TimePicker
                      label="Start Time"
                      value={slot.start}
                      onChange={(value) => handleTimeSlotChange(index, 'start', value)}
                      slotProps={{
                        textField: {
                          size: 'small',
                        },
                      }}
                    />
                    <TimePicker
                      label="End Time"
                      value={slot.end}
                      onChange={(value) => handleTimeSlotChange(index, 'end', value)}
                      slotProps={{
                        textField: {
                          size: 'small',
                        },
                      }}
                    />
                    <IconButton
                      onClick={() => handleRemoveTimeSlot(index)}
                      disabled={timeSlots.length === 1}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                ))}
              </LocalizationProvider>

              <Button
                startIcon={<AddIcon />}
                onClick={handleAddTimeSlot}
                variant="outlined"
                size="small"
              >
                Add Time Slot
              </Button>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAvailabilityDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSaveAvailability}
              variant="contained"
              disabled={
                !selectedDate ||
                timeSlots.every((s) => !s.start || !s.end) ||
                updateAvailabilityMutation.isPending
              }
            >
              {updateAvailabilityMutation.isPending ? <CircularProgress size={24} /> : 'Save'}
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={notesDialogOpen}
          onClose={() => setNotesDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Conference Notes</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              {selectedConference && (
                <Paper sx={{ p: 2, mb: 3, bgcolor: alpha('#1976d2', 0.05) }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Conference Details:
                  </Typography>
                  <Typography variant="body2">
                    Student: {selectedConference.student?.first_name}{' '}
                    {selectedConference.student?.last_name}
                  </Typography>
                  <Typography variant="body2">
                    Date:{' '}
                    {format(
                      parse(selectedConference.date, 'yyyy-MM-dd', new Date()),
                      'MMM d, yyyy'
                    )}
                  </Typography>
                  <Typography variant="body2">
                    Time: {selectedConference.start_time} - {selectedConference.end_time}
                  </Typography>
                </Paper>
              )}
              <TextField
                fullWidth
                multiline
                rows={6}
                label="Notes"
                placeholder="Enter your notes from the conference..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setNotesDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSaveNotes}
              variant="contained"
              startIcon={<SaveIcon />}
              disabled={!notes || saveNotesMutation.isPending}
            >
              {saveNotesMutation.isPending ? <CircularProgress size={24} /> : 'Save Notes'}
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={rescheduleDialogOpen}
          onClose={() => setRescheduleDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Reschedule Conference</DialogTitle>
          <DialogContent>
            <Typography gutterBottom>Select a new time slot for this conference</Typography>
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>New Time Slot</InputLabel>
              <Select
                value={newSlotId}
                label="New Time Slot"
                onChange={(e) => setNewSlotId(e.target.value)}
              >
                <MenuItem value="slot-1">Today, 2:00 PM - 2:30 PM</MenuItem>
                <MenuItem value="slot-2">Today, 3:00 PM - 3:30 PM</MenuItem>
                <MenuItem value="slot-3">Tomorrow, 10:00 AM - 10:30 AM</MenuItem>
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setRescheduleDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleRescheduleConfirm}
              variant="contained"
              disabled={!newSlotId || rescheduleMutation.isPending}
            >
              {rescheduleMutation.isPending ? <CircularProgress size={24} /> : 'Reschedule'}
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={feedbackDialogOpen}
          onClose={() => setFeedbackDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Parent Feedback</DialogTitle>
          <DialogContent>
            {selectedConference && (
              <Box sx={{ pt: 2 }}>
                <Paper sx={{ p: 2, mb: 2, bgcolor: alpha('#1976d2', 0.05) }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Conference:
                  </Typography>
                  <Typography variant="body2">
                    Student: {selectedConference.student?.first_name}{' '}
                    {selectedConference.student?.last_name}
                  </Typography>
                  <Typography variant="body2">
                    Date:{' '}
                    {format(
                      parse(selectedConference.date, 'yyyy-MM-dd', new Date()),
                      'MMM d, yyyy'
                    )}
                  </Typography>
                </Paper>

                {selectedConference.parent_rating && (
                  <Box mb={2}>
                    <Typography variant="subtitle2" gutterBottom>
                      Rating:
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1}>
                      {[...Array(5)].map((_, i) => (
                        <StarIcon
                          key={i}
                          sx={{
                            color:
                              i < selectedConference.parent_rating!
                                ? 'warning.main'
                                : 'action.disabled',
                          }}
                        />
                      ))}
                      <Typography variant="body2" fontWeight={700}>
                        {selectedConference.parent_rating}/5
                      </Typography>
                    </Box>
                  </Box>
                )}

                {selectedConference.parent_feedback && (
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Feedback:
                    </Typography>
                    <Paper sx={{ p: 2, bgcolor: alpha('#4caf50', 0.05) }}>
                      <Typography variant="body2">{selectedConference.parent_feedback}</Typography>
                    </Paper>
                  </Box>
                )}
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setFeedbackDialogOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default TeacherConferenceManager;

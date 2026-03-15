import React, { useState } from 'react';
import {
  Container,
  Grid,
  Box,
  Typography,
  Card,
  CardContent,
  CardHeader,
  TextField,
  Button,
  Chip,
  Avatar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  alpha,
  CircularProgress,
  SelectChangeEvent,
} from '@mui/material';
import {
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  School as SchoolIcon,
  Download as DownloadIcon,
  NavigateNext as NavigateNextIcon,
  NavigateBefore as NavigateBeforeIcon,
  CheckCircle as CheckCircleIcon,
  Event as EventIcon,
  AccessTime as AccessTimeIcon,
} from '@mui/icons-material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, addMonths, startOfMonth, endOfMonth, parse } from 'date-fns';
import { conferencesApi } from '@/api/conferences';
import { parentsApi } from '@/api/parents';
import { CONFERENCE_TOPICS } from '@/types/conference';
import type { Teacher, ConferenceSlot, ChildBasicInfo } from '@/types/conference';

const steps = [
  'Select Student & Teacher',
  'Choose Date & Time',
  'Topics & Details',
  'Confirmation',
];

export const ParentConferenceBooking: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeStep, setActiveStep] = useState(0);
  const [selectedChild, setSelectedChild] = useState<ChildBasicInfo | null>(null);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<ConferenceSlot | null>(null);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [specialRequests, setSpecialRequests] = useState('');
  const [filterSubject, setFilterSubject] = useState('all');
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [createdBookingId, setCreatedBookingId] = useState<number | null>(null);

  const { data: childrenData, isLoading: childrenLoading } = useQuery({
    queryKey: ['parent-children'],
    queryFn: () => parentsApi.getChildren(),
  });

  const { data: teachers, isLoading: teachersLoading } = useQuery({
    queryKey: ['child-teachers', selectedChild?.id],
    queryFn: () => conferencesApi.getChildTeachers(selectedChild!.id),
    enabled: !!selectedChild,
  });

  const startDate = selectedDate ? startOfMonth(selectedDate) : startOfMonth(new Date());
  const endDate = selectedDate ? endOfMonth(selectedDate) : endOfMonth(addMonths(new Date(), 1));

  const { data: availability, isLoading: availabilityLoading } = useQuery({
    queryKey: [
      'teacher-availability',
      selectedTeacher?.id,
      format(startDate, 'yyyy-MM-dd'),
      format(endDate, 'yyyy-MM-dd'),
    ],
    queryFn: () =>
      conferencesApi.getTeacherAvailability(
        selectedTeacher!.id,
        format(startDate, 'yyyy-MM-dd'),
        format(endDate, 'yyyy-MM-dd')
      ),
    enabled: !!selectedTeacher,
  });

  const bookingMutation = useMutation({
    mutationFn: conferencesApi.bookConference,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['conference-dashboard'] });
      setCreatedBookingId(data.id);
      setBookingSuccess(true);
      setActiveStep(3);
    },
  });

  const handleNext = () => {
    if (activeStep === 2) {
      if (selectedChild && selectedTeacher && selectedSlot) {
        bookingMutation.mutate({
          student_id: selectedChild.id,
          teacher_id: selectedTeacher.id,
          slot_id: selectedSlot.id,
          topics: selectedTopics,
          special_requests: specialRequests || undefined,
        });
      }
    } else {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleReset = () => {
    setActiveStep(0);
    setSelectedChild(null);
    setSelectedTeacher(null);
    setSelectedDate(null);
    setSelectedSlot(null);
    setSelectedTopics([]);
    setSpecialRequests('');
    setBookingSuccess(false);
    setCreatedBookingId(null);
  };

  const handleTopicToggle = (topicValue: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topicValue) ? prev.filter((t) => t !== topicValue) : [...prev, topicValue]
    );
  };

  const handleDownloadICS = async () => {
    if (createdBookingId) {
      try {
        const blob = await conferencesApi.downloadICS(createdBookingId);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `conference-${createdBookingId}.ics`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } catch (error) {
        console.error('Failed to download ICS:', error);
      }
    }
  };

  const handleAddToGoogleCalendar = () => {
    if (selectedSlot && selectedTeacher && selectedChild) {
      const startDateTime = `${selectedSlot.date}T${selectedSlot.start_time}`;
      const endDateTime = `${selectedSlot.date}T${selectedSlot.end_time}`;
      const title = `Parent-Teacher Conference: ${selectedTeacher.first_name} ${selectedTeacher.last_name}`;
      const details = `Conference with ${selectedTeacher.first_name} ${selectedTeacher.last_name} regarding ${selectedChild.first_name} ${selectedChild.last_name}.\n\nTopics: ${selectedTopics.join(', ')}${specialRequests ? `\n\nSpecial Requests: ${specialRequests}` : ''}`;

      const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${startDateTime.replace(/[-:]/g, '')}/${endDateTime.replace(/[-:]/g, '')}&details=${encodeURIComponent(details)}`;

      window.open(googleCalendarUrl, '_blank');
    }
  };

  const canProceed = () => {
    switch (activeStep) {
      case 0:
        return selectedChild && selectedTeacher;
      case 1:
        return selectedSlot;
      case 2:
        return selectedTopics.length > 0;
      default:
        return false;
    }
  };

  const uniqueSubjects = teachers
    ? Array.from(new Set(teachers.flatMap((t) => t.subjects || [])))
    : [];

  const filteredTeachers = teachers?.filter((teacher) => {
    if (filterSubject === 'all') return true;
    return teacher.subjects?.includes(filterSubject);
  });

  const getTeacherColor = (teacherId: number) => {
    const colors = ['#1976d2', '#388e3c', '#d32f2f', '#f57c00', '#7b1fa2', '#0097a7'];
    return colors[teacherId % colors.length];
  };

  const getSlotsForDate = (date: string) => {
    if (!availability) return [];
    const dayAvailability = availability.find((a) => a.date === date);
    return dayAvailability?.slots || [];
  };

  if (childrenLoading) {
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
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Book Parent-Teacher Conference
        </Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom sx={{ mb: 4 }}>
          Schedule a meeting with your child&apos;s teacher to discuss their progress
        </Typography>

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {bookingSuccess ? (
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
            <CardContent sx={{ textAlign: 'center', py: 6 }}>
              <CheckCircleIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
              <Typography variant="h5" fontWeight={700} gutterBottom>
                Conference Booked Successfully!
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                Your conference has been scheduled. You&apos;ll receive a confirmation email
                shortly.
              </Typography>

              {selectedSlot && selectedTeacher && selectedChild && (
                <Paper sx={{ p: 3, mb: 4, maxWidth: 600, mx: 'auto', textAlign: 'left' }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <PersonIcon color="primary" />
                        <Typography variant="body1">
                          <strong>Teacher:</strong> {selectedTeacher.first_name}{' '}
                          {selectedTeacher.last_name}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <SchoolIcon color="primary" />
                        <Typography variant="body1">
                          <strong>Student:</strong> {selectedChild.first_name}{' '}
                          {selectedChild.last_name}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <CalendarIcon color="primary" />
                        <Typography variant="body1">
                          <strong>Date:</strong>{' '}
                          {format(
                            parse(selectedSlot.date, 'yyyy-MM-dd', new Date()),
                            'MMMM d, yyyy'
                          )}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <AccessTimeIcon color="primary" />
                        <Typography variant="body1">
                          <strong>Time:</strong> {selectedSlot.start_time} - {selectedSlot.end_time}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Paper>
              )}

              <Box display="flex" gap={2} justifyContent="center" flexWrap="wrap">
                <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleDownloadICS}>
                  Download ICS
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<EventIcon />}
                  onClick={handleAddToGoogleCalendar}
                >
                  Add to Google Calendar
                </Button>
                <Button variant="contained" onClick={handleReset}>
                  Book Another Conference
                </Button>
              </Box>
            </CardContent>
          </Card>
        ) : (
          <>
            {activeStep === 0 && (
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
                    <CardHeader title="Select Student" />
                    <CardContent>
                      {childrenData && childrenData.length > 1 ? (
                        <FormControl fullWidth>
                          <InputLabel>Student</InputLabel>
                          <Select
                            value={selectedChild?.id || ''}
                            label="Student"
                            onChange={(e: SelectChangeEvent<number>) => {
                              const child = childrenData.find((c) => c.id === e.target.value);
                              setSelectedChild(child || null);
                              setSelectedTeacher(null);
                            }}
                          >
                            {childrenData.map((child) => (
                              <MenuItem key={child.id} value={child.id}>
                                <Box display="flex" alignItems="center" gap={2}>
                                  <Avatar src={child.photo_url} sx={{ width: 32, height: 32 }}>
                                    {child.first_name.charAt(0)}
                                  </Avatar>
                                  <Box>
                                    <Typography>
                                      {child.first_name} {child.last_name}
                                    </Typography>
                                    {child.grade_name && child.section_name && (
                                      <Typography variant="caption" color="text.secondary">
                                        {child.grade_name} {child.section_name}
                                      </Typography>
                                    )}
                                  </Box>
                                </Box>
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      ) : (
                        childrenData &&
                        childrenData.length === 1 && (
                          <>
                            {!selectedChild && setSelectedChild(childrenData[0])}
                            <Alert severity="info">
                              Student: {childrenData[0].first_name} {childrenData[0].last_name}
                            </Alert>
                          </>
                        )
                      )}
                    </CardContent>
                  </Card>
                </Grid>

                {selectedChild && (
                  <Grid item xs={12}>
                    <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
                      <CardHeader
                        title="Select Teacher"
                        action={
                          uniqueSubjects.length > 0 && (
                            <FormControl size="small" sx={{ minWidth: 150 }}>
                              <InputLabel>Filter by Subject</InputLabel>
                              <Select
                                value={filterSubject}
                                label="Filter by Subject"
                                onChange={(e) => setFilterSubject(e.target.value)}
                              >
                                <MenuItem value="all">All Subjects</MenuItem>
                                {uniqueSubjects.map((subject) => (
                                  <MenuItem key={subject} value={subject}>
                                    {subject}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          )
                        }
                      />
                      <CardContent>
                        {teachersLoading ? (
                          <CircularProgress />
                        ) : filteredTeachers && filteredTeachers.length > 0 ? (
                          <List>
                            {filteredTeachers.map((teacher) => (
                              <ListItem
                                key={teacher.id}
                                button
                                selected={selectedTeacher?.id === teacher.id}
                                onClick={() => setSelectedTeacher(teacher)}
                                sx={{
                                  borderRadius: 1,
                                  mb: 1,
                                  border: '1px solid',
                                  borderColor:
                                    selectedTeacher?.id === teacher.id ? 'primary.main' : 'divider',
                                  bgcolor:
                                    selectedTeacher?.id === teacher.id
                                      ? alpha('#1976d2', 0.05)
                                      : 'transparent',
                                }}
                              >
                                <ListItemAvatar>
                                  <Avatar src={teacher.photo_url}>
                                    {teacher.first_name.charAt(0)}
                                  </Avatar>
                                </ListItemAvatar>
                                <ListItemText
                                  primary={`${teacher.first_name} ${teacher.last_name}`}
                                  secondary={
                                    <Box display="flex" gap={1} flexWrap="wrap" mt={0.5}>
                                      {teacher.subjects?.map((subject) => (
                                        <Chip
                                          key={subject}
                                          label={subject}
                                          size="small"
                                          sx={{ fontSize: '0.7rem' }}
                                        />
                                      ))}
                                    </Box>
                                  }
                                />
                              </ListItem>
                            ))}
                          </List>
                        ) : (
                          <Alert severity="warning">No teachers found for this student.</Alert>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                )}
              </Grid>
            )}

            {activeStep === 1 && selectedTeacher && (
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
                    <CardHeader title="Select Date" />
                    <CardContent>
                      <LocalizationProvider dateAdapter={AdapterDateFns}>
                        <DatePicker
                          label="Conference Date"
                          value={selectedDate}
                          onChange={setSelectedDate}
                          minDate={new Date()}
                          maxDate={addMonths(new Date(), 3)}
                          slotProps={{
                            textField: {
                              fullWidth: true,
                            },
                          }}
                        />
                      </LocalizationProvider>

                      {selectedTeacher && (
                        <Box
                          mt={3}
                          p={2}
                          bgcolor={alpha(getTeacherColor(selectedTeacher.id), 0.1)}
                          borderRadius={1}
                        >
                          <Typography variant="subtitle2" gutterBottom>
                            Selected Teacher
                          </Typography>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Avatar src={selectedTeacher.photo_url} sx={{ width: 40, height: 40 }}>
                              {selectedTeacher.first_name.charAt(0)}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight={600}>
                                {selectedTeacher.first_name} {selectedTeacher.last_name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {selectedTeacher.specialization || 'Teacher'}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} md={8}>
                  <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
                    <CardHeader
                      title="Available Time Slots"
                      subheader={
                        selectedDate
                          ? format(selectedDate, 'EEEE, MMMM d, yyyy')
                          : 'Select a date to view available slots'
                      }
                    />
                    <CardContent>
                      {availabilityLoading ? (
                        <CircularProgress />
                      ) : selectedDate ? (
                        (() => {
                          const slots = getSlotsForDate(format(selectedDate, 'yyyy-MM-dd'));
                          return slots.length > 0 ? (
                            <Grid container spacing={2}>
                              {slots
                                .filter((slot) => slot.is_available && !slot.is_booked)
                                .map((slot) => (
                                  <Grid item xs={12} sm={6} md={4} key={slot.id}>
                                    <Paper
                                      sx={{
                                        p: 2,
                                        cursor: 'pointer',
                                        border: '2px solid',
                                        borderColor:
                                          selectedSlot?.id === slot.id
                                            ? getTeacherColor(selectedTeacher.id)
                                            : 'divider',
                                        bgcolor:
                                          selectedSlot?.id === slot.id
                                            ? alpha(getTeacherColor(selectedTeacher.id), 0.1)
                                            : 'transparent',
                                        transition: 'all 0.2s',
                                        '&:hover': {
                                          borderColor: getTeacherColor(selectedTeacher.id),
                                          transform: 'translateY(-2px)',
                                        },
                                      }}
                                      onClick={() => setSelectedSlot(slot)}
                                    >
                                      <Box display="flex" alignItems="center" gap={1}>
                                        <AccessTimeIcon
                                          sx={{
                                            color:
                                              selectedSlot?.id === slot.id
                                                ? getTeacherColor(selectedTeacher.id)
                                                : 'text.secondary',
                                          }}
                                        />
                                        <Typography
                                          variant="body1"
                                          fontWeight={selectedSlot?.id === slot.id ? 700 : 400}
                                        >
                                          {slot.start_time} - {slot.end_time}
                                        </Typography>
                                      </Box>
                                      <Typography
                                        variant="caption"
                                        color="text.secondary"
                                        display="block"
                                        mt={0.5}
                                      >
                                        {slot.duration_minutes} minutes
                                      </Typography>
                                    </Paper>
                                  </Grid>
                                ))}
                            </Grid>
                          ) : (
                            <Alert severity="info">
                              No available slots for this date. Please select another date.
                            </Alert>
                          );
                        })()
                      ) : (
                        <Alert severity="info">
                          Please select a date to view available time slots.
                        </Alert>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            )}

            {activeStep === 2 && (
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
                    <CardHeader title="Select Topics to Discuss" />
                    <CardContent>
                      <FormGroup>
                        {CONFERENCE_TOPICS.map((topic) => (
                          <FormControlLabel
                            key={topic.id}
                            control={
                              <Checkbox
                                checked={selectedTopics.includes(topic.value)}
                                onChange={() => handleTopicToggle(topic.value)}
                              />
                            }
                            label={topic.label}
                          />
                        ))}
                      </FormGroup>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12}>
                  <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
                    <CardHeader title="Special Requests (Optional)" />
                    <CardContent>
                      <TextField
                        fullWidth
                        multiline
                        rows={4}
                        placeholder="Enter any specific concerns or topics you'd like to discuss..."
                        value={specialRequests}
                        onChange={(e) => setSpecialRequests(e.target.value)}
                      />
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12}>
                  <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
                    <CardHeader title="Conference Summary" />
                    <CardContent>
                      <Grid container spacing={2}>
                        {selectedChild && (
                          <Grid item xs={12} sm={6}>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                              Student
                            </Typography>
                            <Typography variant="body1">
                              {selectedChild.first_name} {selectedChild.last_name}
                            </Typography>
                          </Grid>
                        )}
                        {selectedTeacher && (
                          <Grid item xs={12} sm={6}>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                              Teacher
                            </Typography>
                            <Typography variant="body1">
                              {selectedTeacher.first_name} {selectedTeacher.last_name}
                            </Typography>
                          </Grid>
                        )}
                        {selectedSlot && (
                          <>
                            <Grid item xs={12} sm={6}>
                              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                Date & Time
                              </Typography>
                              <Typography variant="body1">
                                {format(
                                  parse(selectedSlot.date, 'yyyy-MM-dd', new Date()),
                                  'MMMM d, yyyy'
                                )}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {selectedSlot.start_time} - {selectedSlot.end_time}
                              </Typography>
                            </Grid>
                          </>
                        )}
                        <Grid item xs={12}>
                          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            Topics
                          </Typography>
                          <Box display="flex" gap={1} flexWrap="wrap">
                            {selectedTopics.map((topicValue) => {
                              const topic = CONFERENCE_TOPICS.find((t) => t.value === topicValue);
                              return topic ? (
                                <Chip
                                  key={topic.id}
                                  label={topic.label}
                                  color="primary"
                                  size="small"
                                />
                              ) : null;
                            })}
                          </Box>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
              <Button
                disabled={activeStep === 0}
                onClick={handleBack}
                startIcon={<NavigateBeforeIcon />}
              >
                Back
              </Button>
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={!canProceed() || bookingMutation.isPending}
                endIcon={activeStep === 2 ? null : <NavigateNextIcon />}
              >
                {bookingMutation.isPending ? (
                  <CircularProgress size={24} />
                ) : activeStep === 2 ? (
                  'Confirm Booking'
                ) : (
                  'Next'
                )}
              </Button>
            </Box>
          </>
        )}
      </Box>
    </Container>
  );
};

export default ParentConferenceBooking;

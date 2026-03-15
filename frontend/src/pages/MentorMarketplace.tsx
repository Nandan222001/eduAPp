import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Button,
  Avatar,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Stack,
  Divider,
  LinearProgress,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  TextField,
  Rating,
  Badge,
  Tabs,
  Tab,
  alpha,
} from '@mui/material';
import {
  Business as BusinessIcon,
  Close as CloseIcon,
  Send as SendIcon,
  Star as StarIcon,
  LinkedIn as LinkedInIcon,
  Email as EmailIcon,
  CheckCircle as CheckIcon,
  WorkOutline as WorkIcon,
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import entrepreneurshipApi from '@/api/entrepreneurship';
import {
  EntrepreneurshipMentor,
  MentorshipRelationship,
  MentorshipStatus,
} from '@/types/entrepreneurship';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
};

export default function MentorMarketplace() {
  const [activeTab, setActiveTab] = useState(0);
  const [mentors, setMentors] = useState<EntrepreneurshipMentor[]>([]);
  const [myMentorships, setMyMentorships] = useState<MentorshipRelationship[]>([]);
  const [selectedMentor, setSelectedMentor] = useState<EntrepreneurshipMentor | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [requestForm, setRequestForm] = useState({
    venture_id: 0,
    goals: [''],
    message: '',
  });

  const institutionId = parseInt(localStorage.getItem('institution_id') || '1');

  useEffect(() => {
    fetchMentors();
    fetchMyMentorships();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchMentors = async () => {
    try {
      setLoading(true);
      const data = await entrepreneurshipApi.getMentors(institutionId, { available: true });
      setMentors(data);
    } catch (error) {
      console.error('Failed to fetch mentors:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyMentorships = async () => {
    try {
      const data = await entrepreneurshipApi.getMentorships(institutionId);
      setMyMentorships(data);
    } catch (error) {
      console.error('Failed to fetch mentorships:', error);
    }
  };

  const handleViewMentor = (mentor: EntrepreneurshipMentor) => {
    setSelectedMentor(mentor);
    setDetailDialogOpen(true);
  };

  const handleRequestMentorship = (mentor: EntrepreneurshipMentor) => {
    setSelectedMentor(mentor);
    setRequestDialogOpen(true);
  };

  const handleSubmitRequest = async () => {
    if (!selectedMentor) return;

    try {
      setLoading(true);
      await entrepreneurshipApi.requestMentorship(institutionId, {
        mentor_id: selectedMentor.id,
        venture_id: requestForm.venture_id,
        goals: requestForm.goals.filter((g) => g.trim() !== ''),
        message: requestForm.message,
      });
      setRequestDialogOpen(false);
      alert('Mentorship request sent successfully!');
      await fetchMyMentorships();
    } catch (error) {
      console.error('Failed to request mentorship:', error);
      alert('Failed to send mentorship request');
    } finally {
      setLoading(false);
    }
  };

  const addGoal = () => {
    setRequestForm({ ...requestForm, goals: [...requestForm.goals, ''] });
  };

  const updateGoal = (index: number, value: string) => {
    const newGoals = [...requestForm.goals];
    newGoals[index] = value;
    setRequestForm({ ...requestForm, goals: newGoals });
  };

  const removeGoal = (index: number) => {
    const newGoals = requestForm.goals.filter((_, i) => i !== index);
    setRequestForm({ ...requestForm, goals: newGoals });
  };

  const getStatusColor = (status: MentorshipStatus) => {
    switch (status) {
      case MentorshipStatus.ACTIVE:
        return 'success';
      case MentorshipStatus.PENDING:
        return 'warning';
      case MentorshipStatus.COMPLETED:
        return 'default';
      default:
        return 'default';
    }
  };

  if (loading && mentors.length === 0) {
    return (
      <Box sx={{ width: '100%', mt: 4 }}>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" fontWeight={700} gutterBottom>
          Mentor Marketplace
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Connect with experienced entrepreneurs and business professionals
        </Typography>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Available Mentors
                  </Typography>
                  <Typography variant="h3" fontWeight={700}>
                    {mentors.filter((m) => m.available_for_mentoring).length}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1) }}>
                  <BusinessIcon color="primary" />
                </Avatar>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    My Mentorships
                  </Typography>
                  <Typography variant="h3" fontWeight={700}>
                    {myMentorships.filter((m) => m.status === MentorshipStatus.ACTIVE).length}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: (theme) => alpha(theme.palette.success.main, 0.1) }}>
                  <CheckIcon color="success" />
                </Avatar>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Total Experience
                  </Typography>
                  <Typography variant="h3" fontWeight={700}>
                    {mentors.reduce((sum, m) => sum + (m.years_of_experience || 0), 0)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    years combined
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: (theme) => alpha(theme.palette.warning.main, 0.1) }}>
                  <WorkIcon color="warning" />
                </Avatar>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Verified Mentors
                  </Typography>
                  <Typography variant="h3" fontWeight={700}>
                    {mentors.filter((m) => m.is_verified).length}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: (theme) => alpha(theme.palette.info.main, 0.1) }}>
                  <StarIcon color="info" />
                </Avatar>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          variant="fullWidth"
        >
          <Tab label="Browse Mentors" />
          <Tab label="My Mentorships" />
        </Tabs>

        <TabPanel value={activeTab} index={0}>
          <Grid container spacing={3}>
            {mentors.map((mentor) => (
              <Grid item xs={12} md={6} lg={4} key={mentor.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardHeader
                    avatar={
                      <Badge
                        overlap="circular"
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        badgeContent={
                          mentor.is_verified ? (
                            <CheckIcon sx={{ color: 'success.main', fontSize: 20 }} />
                          ) : null
                        }
                      >
                        <Avatar src={mentor.photo_url} sx={{ width: 64, height: 64 }}>
                          {mentor.first_name.charAt(0)}
                        </Avatar>
                      </Badge>
                    }
                    title={
                      <Typography variant="h6" fontWeight={700}>
                        {mentor.first_name} {mentor.last_name}
                      </Typography>
                    }
                    subheader={
                      <>
                        {mentor.current_position && (
                          <Typography variant="body2" color="text.secondary">
                            {mentor.current_position}
                          </Typography>
                        )}
                        {mentor.company && (
                          <Typography variant="caption" color="text.secondary">
                            {mentor.company}
                          </Typography>
                        )}
                      </>
                    }
                  />
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Stack spacing={2}>
                      {mentor.years_of_experience && (
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Experience
                          </Typography>
                          <Typography variant="body2" fontWeight={600}>
                            {mentor.years_of_experience} years
                          </Typography>
                        </Box>
                      )}

                      <Box>
                        <Typography variant="caption" color="text.secondary" gutterBottom>
                          Expertise Areas
                        </Typography>
                        <Stack direction="row" flexWrap="wrap" gap={0.5} sx={{ mt: 0.5 }}>
                          {mentor.expertise_areas.slice(0, 3).map((area, idx) => (
                            <Chip key={idx} label={area} size="small" />
                          ))}
                          {mentor.expertise_areas.length > 3 && (
                            <Chip label={`+${mentor.expertise_areas.length - 3}`} size="small" />
                          )}
                        </Stack>
                      </Box>

                      {mentor.bio && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {mentor.bio}
                        </Typography>
                      )}

                      <Divider />

                      <Stack direction="row" spacing={2} justifyContent="space-between">
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Mentees
                          </Typography>
                          <Typography variant="body2" fontWeight={600}>
                            {mentor.current_mentees} / {mentor.mentoring_capacity}
                          </Typography>
                        </Box>
                        {mentor.average_rating && (
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              Rating
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <StarIcon sx={{ fontSize: 16, color: 'warning.main' }} />
                              <Typography variant="body2" fontWeight={600}>
                                {mentor.average_rating.toFixed(1)}
                              </Typography>
                            </Box>
                          </Box>
                        )}
                      </Stack>
                    </Stack>
                  </CardContent>
                  <Box sx={{ p: 2, pt: 0 }}>
                    <Stack direction="row" spacing={1}>
                      <Button fullWidth variant="outlined" onClick={() => handleViewMentor(mentor)}>
                        View Profile
                      </Button>
                      <Button
                        fullWidth
                        variant="contained"
                        onClick={() => handleRequestMentorship(mentor)}
                        disabled={
                          !mentor.available_for_mentoring ||
                          mentor.current_mentees >= mentor.mentoring_capacity
                        }
                      >
                        Request
                      </Button>
                    </Stack>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <Grid container spacing={3}>
            {myMentorships.map((mentorship) => (
              <Grid item xs={12} key={mentorship.id}>
                <Card>
                  <CardContent>
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={3}>
                        <Stack alignItems="center" spacing={1}>
                          <Avatar src={mentorship.mentor?.photo_url} sx={{ width: 80, height: 80 }}>
                            {mentorship.mentor?.first_name.charAt(0)}
                          </Avatar>
                          <Typography variant="subtitle1" fontWeight={600} textAlign="center">
                            {mentorship.mentor?.first_name} {mentorship.mentor?.last_name}
                          </Typography>
                          <Chip
                            label={mentorship.status.toUpperCase()}
                            color={getStatusColor(mentorship.status)}
                            size="small"
                          />
                        </Stack>
                      </Grid>

                      <Grid item xs={12} md={9}>
                        <Stack spacing={2}>
                          <Box>
                            <Typography variant="subtitle2" gutterBottom>
                              Venture
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {mentorship.venture?.venture_name}
                            </Typography>
                          </Box>

                          {mentorship.goals && mentorship.goals.length > 0 && (
                            <Box>
                              <Typography variant="subtitle2" gutterBottom>
                                Goals
                              </Typography>
                              <List dense>
                                {mentorship.goals.map((goal, idx) => (
                                  <ListItem key={idx} sx={{ px: 0 }}>
                                    <ListItemText primary={goal} />
                                  </ListItem>
                                ))}
                              </List>
                            </Box>
                          )}

                          <Grid container spacing={2}>
                            <Grid item xs={6} sm={3}>
                              <Typography variant="caption" color="text.secondary">
                                Start Date
                              </Typography>
                              <Typography variant="body2" fontWeight={600}>
                                {mentorship.start_date
                                  ? format(parseISO(mentorship.start_date), 'MMM d, yyyy')
                                  : 'Not started'}
                              </Typography>
                            </Grid>
                            <Grid item xs={6} sm={3}>
                              <Typography variant="caption" color="text.secondary">
                                Meetings
                              </Typography>
                              <Typography variant="body2" fontWeight={600}>
                                {mentorship.total_meetings}
                              </Typography>
                            </Grid>
                            <Grid item xs={6} sm={3}>
                              <Typography variant="caption" color="text.secondary">
                                Frequency
                              </Typography>
                              <Typography variant="body2" fontWeight={600}>
                                {mentorship.meeting_frequency || 'Weekly'}
                              </Typography>
                            </Grid>
                            {mentorship.student_rating && (
                              <Grid item xs={6} sm={3}>
                                <Typography variant="caption" color="text.secondary">
                                  My Rating
                                </Typography>
                                <Rating value={mentorship.student_rating} readOnly size="small" />
                              </Grid>
                            )}
                          </Grid>
                        </Stack>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>
      </Paper>

      <Dialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedMentor && (
          <>
            <DialogTitle>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar src={selectedMentor.photo_url} sx={{ width: 64, height: 64 }}>
                    {selectedMentor.first_name.charAt(0)}
                  </Avatar>
                  <Box>
                    <Typography variant="h5" fontWeight={700}>
                      {selectedMentor.first_name} {selectedMentor.last_name}
                    </Typography>
                    {selectedMentor.current_position && (
                      <Typography variant="body2" color="text.secondary">
                        {selectedMentor.current_position} at {selectedMentor.company}
                      </Typography>
                    )}
                  </Box>
                </Box>
                <IconButton onClick={() => setDetailDialogOpen(false)}>
                  <CloseIcon />
                </IconButton>
              </Stack>
            </DialogTitle>
            <DialogContent>
              <Stack spacing={3}>
                {selectedMentor.bio && (
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      About
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      {selectedMentor.bio}
                    </Typography>
                  </Box>
                )}

                <Box>
                  <Typography variant="h6" gutterBottom>
                    Expertise Areas
                  </Typography>
                  <Stack direction="row" flexWrap="wrap" gap={1}>
                    {selectedMentor.expertise_areas.map((area, idx) => (
                      <Chip key={idx} label={area} color="primary" variant="outlined" />
                    ))}
                  </Stack>
                </Box>

                {selectedMentor.industry_experience &&
                  selectedMentor.industry_experience.length > 0 && (
                    <Box>
                      <Typography variant="h6" gutterBottom>
                        Industry Experience
                      </Typography>
                      <List>
                        {selectedMentor.industry_experience.map((exp, idx) => (
                          <ListItem key={idx}>
                            <ListItemAvatar>
                              <Avatar>
                                <WorkIcon />
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={exp.industry}
                              secondary={`${exp.years} years${exp.role ? ` • ${exp.role}` : ''}`}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  )}

                {selectedMentor.successful_ventures &&
                  selectedMentor.successful_ventures.length > 0 && (
                    <Box>
                      <Typography variant="h6" gutterBottom>
                        Successful Ventures
                      </Typography>
                      <Stack spacing={2}>
                        {selectedMentor.successful_ventures.map((venture, idx) => (
                          <Paper key={idx} sx={{ p: 2, bgcolor: 'background.default' }}>
                            <Typography variant="subtitle2" fontWeight={600}>
                              {venture.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {venture.description}
                            </Typography>
                            <Typography variant="caption" color="success.main">
                              {venture.outcome}
                            </Typography>
                          </Paper>
                        ))}
                      </Stack>
                    </Box>
                  )}

                <Divider />

                <Stack direction="row" spacing={2}>
                  {selectedMentor.email && (
                    <Button startIcon={<EmailIcon />} href={`mailto:${selectedMentor.email}`}>
                      Email
                    </Button>
                  )}
                  {selectedMentor.linkedin_url && (
                    <Button
                      startIcon={<LinkedInIcon />}
                      href={selectedMentor.linkedin_url}
                      target="_blank"
                    >
                      LinkedIn
                    </Button>
                  )}
                </Stack>
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDetailDialogOpen(false)}>Close</Button>
              <Button
                variant="contained"
                onClick={() => {
                  setDetailDialogOpen(false);
                  handleRequestMentorship(selectedMentor);
                }}
                disabled={
                  !selectedMentor.available_for_mentoring ||
                  selectedMentor.current_mentees >= selectedMentor.mentoring_capacity
                }
              >
                Request Mentorship
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      <Dialog
        open={requestDialogOpen}
        onClose={() => setRequestDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Request Mentorship</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              type="number"
              label="Venture ID"
              value={requestForm.venture_id}
              onChange={(e) =>
                setRequestForm({ ...requestForm, venture_id: Number(e.target.value) })
              }
            />

            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Mentorship Goals
              </Typography>
              {requestForm.goals.map((goal, idx) => (
                <Stack key={idx} direction="row" spacing={1} sx={{ mb: 1 }}>
                  <TextField
                    fullWidth
                    size="small"
                    value={goal}
                    onChange={(e) => updateGoal(idx, e.target.value)}
                    placeholder={`Goal ${idx + 1}`}
                  />
                  <IconButton
                    onClick={() => removeGoal(idx)}
                    disabled={requestForm.goals.length === 1}
                  >
                    <CloseIcon />
                  </IconButton>
                </Stack>
              ))}
              <Button size="small" onClick={addGoal}>
                Add Goal
              </Button>
            </Box>

            <TextField
              fullWidth
              multiline
              rows={4}
              label="Message to Mentor"
              value={requestForm.message}
              onChange={(e) => setRequestForm({ ...requestForm, message: e.target.value })}
              placeholder="Introduce yourself and explain why you'd like this mentor..."
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRequestDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSubmitRequest}
            disabled={loading || !requestForm.venture_id}
            startIcon={<SendIcon />}
          >
            Send Request
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

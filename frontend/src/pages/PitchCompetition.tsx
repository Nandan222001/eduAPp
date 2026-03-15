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
  Tabs,
  Tab,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Rating,
  Alert,
  Badge,
  alpha,
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  Close as CloseIcon,
  PlayArrow as PlayIcon,
  ThumbUp as VoteIcon,
  Gavel as JudgeIcon,
  Send as SendIcon,
  People as PeopleIcon,
  CalendarMonth as CalendarIcon,
  AttachMoney as MoneyIcon,
  PlayCircle as LiveIcon,
} from '@mui/icons-material';
import { format, parseISO, differenceInDays } from 'date-fns';
import entrepreneurshipApi from '@/api/entrepreneurship';
import { PitchCompetition, PitchSubmission, CompetitionStatus } from '@/types/entrepreneurship';

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

export default function PitchCompetitionPlatform() {
  const [activeTab, setActiveTab] = useState(0);
  const [competitions, setCompetitions] = useState<PitchCompetition[]>([]);
  const [selectedCompetition, setSelectedCompetition] = useState<PitchCompetition | null>(null);
  const [submissions, setSubmissions] = useState<PitchSubmission[]>([]);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [judgingDialogOpen, setJudgingDialogOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<PitchSubmission | null>(null);
  const [scores, setScores] = useState<{ [key: string]: number }>({});
  const [judgeComments, setJudgeComments] = useState('');
  const [loading, setLoading] = useState(true);
  const [submissionForm, setSubmissionForm] = useState({
    venture_id: 0,
    pitch_video_url: '',
    presentation_url: '',
  });

  const institutionId = parseInt(localStorage.getItem('institution_id') || '1');
  const isJudge = true;

  useEffect(() => {
    fetchCompetitions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchCompetitions = async () => {
    try {
      setLoading(true);
      const data = await entrepreneurshipApi.getCompetitions(institutionId);
      setCompetitions(data);
    } catch (error) {
      console.error('Failed to fetch competitions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubmissions = async (competitionId: number) => {
    try {
      const data = await entrepreneurshipApi.getCompetitionSubmissions(
        institutionId,
        competitionId
      );
      setSubmissions(data);
    } catch (error) {
      console.error('Failed to fetch submissions:', error);
    }
  };

  const handleViewCompetition = async (competition: PitchCompetition) => {
    setSelectedCompetition(competition);
    await fetchSubmissions(competition.id);
    setDetailDialogOpen(true);
  };

  const handleSubmitPitch = async () => {
    if (!selectedCompetition) return;

    try {
      setLoading(true);
      await entrepreneurshipApi.submitPitch(institutionId, {
        ...submissionForm,
        competition_id: selectedCompetition.id,
      });
      setSubmitDialogOpen(false);
      alert('Pitch submitted successfully!');
      await fetchSubmissions(selectedCompetition.id);
    } catch (error) {
      console.error('Failed to submit pitch:', error);
      alert('Failed to submit pitch');
    } finally {
      setLoading(false);
    }
  };

  const handleJudgeSubmission = (submission: PitchSubmission) => {
    setSelectedSubmission(submission);
    setScores({});
    setJudgeComments('');
    setJudgingDialogOpen(true);
  };

  const handleSubmitScores = async () => {
    if (!selectedSubmission) return;

    try {
      setLoading(true);
      const criteriaScores = Object.entries(scores).map(([criteria_id, score]) => ({
        criteria_id,
        score,
      }));

      await entrepreneurshipApi.scoreSubmission(
        institutionId,
        selectedSubmission.id,
        criteriaScores,
        judgeComments
      );

      setJudgingDialogOpen(false);
      alert('Scores submitted successfully!');
      if (selectedCompetition) {
        await fetchSubmissions(selectedCompetition.id);
      }
    } catch (error) {
      console.error('Failed to submit scores:', error);
      alert('Failed to submit scores');
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (submissionId: number) => {
    try {
      await entrepreneurshipApi.voteForSubmission(institutionId, submissionId);
      if (selectedCompetition) {
        await fetchSubmissions(selectedCompetition.id);
      }
    } catch (error) {
      console.error('Failed to vote:', error);
      alert('Failed to vote');
    }
  };

  const getStatusColor = (status: CompetitionStatus) => {
    switch (status) {
      case CompetitionStatus.OPEN:
        return 'success';
      case CompetitionStatus.JUDGING:
        return 'warning';
      case CompetitionStatus.COMPLETED:
        return 'default';
      case CompetitionStatus.UPCOMING:
        return 'info';
      default:
        return 'default';
    }
  };

  const getDaysUntil = (date: string) => {
    return differenceInDays(parseISO(date), new Date());
  };

  if (loading && competitions.length === 0) {
    return (
      <Box sx={{ width: '100%', mt: 4 }}>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h3" fontWeight={700} gutterBottom>
              Pitch Competition Platform
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Compete, showcase your venture, and win prizes
            </Typography>
          </Box>
          <Avatar
            sx={{
              width: 64,
              height: 64,
              bgcolor: (theme) => alpha(theme.palette.warning.main, 0.1),
            }}
          >
            <TrophyIcon sx={{ fontSize: 36, color: 'warning.main' }} />
          </Avatar>
        </Stack>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Active Competitions
                  </Typography>
                  <Typography variant="h3" fontWeight={700}>
                    {competitions.filter((c) => c.status === CompetitionStatus.OPEN).length}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: (theme) => alpha(theme.palette.success.main, 0.1) }}>
                  <TrophyIcon color="success" />
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
                    Total Prize Pool
                  </Typography>
                  <Typography variant="h3" fontWeight={700}>
                    $
                    {competitions
                      .reduce((sum, c) => sum + Number(c.prize_pool || 0), 0)
                      .toLocaleString()}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: (theme) => alpha(theme.palette.warning.main, 0.1) }}>
                  <MoneyIcon color="warning" />
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
                    Total Participants
                  </Typography>
                  <Typography variant="h3" fontWeight={700}>
                    {competitions.reduce((sum, c) => sum + c.current_participants, 0)}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: (theme) => alpha(theme.palette.info.main, 0.1) }}>
                  <PeopleIcon color="info" />
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
                    Live Now
                  </Typography>
                  <Typography variant="h3" fontWeight={700}>
                    {competitions.filter((c) => c.status === CompetitionStatus.JUDGING).length}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: (theme) => alpha(theme.palette.error.main, 0.1) }}>
                  <LiveIcon color="error" />
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
          <Tab label="Competitions" />
          <Tab label="Live Events" />
          <Tab label="Winners & Results" />
        </Tabs>

        <TabPanel value={activeTab} index={0}>
          <Grid container spacing={3}>
            {competitions.map((competition) => (
              <Grid item xs={12} md={6} key={competition.id}>
                <Card>
                  <CardHeader
                    avatar={
                      <Avatar sx={{ bgcolor: 'warning.main' }}>
                        <TrophyIcon />
                      </Avatar>
                    }
                    action={
                      <Chip
                        label={competition.status.replace('_', ' ').toUpperCase()}
                        color={getStatusColor(competition.status)}
                        size="small"
                      />
                    }
                    title={
                      <Typography variant="h6" fontWeight={700}>
                        {competition.competition_name}
                      </Typography>
                    }
                    subheader={competition.theme}
                  />
                  <CardContent>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {competition.description}
                    </Typography>

                    <Stack spacing={2}>
                      {competition.prize_pool && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <MoneyIcon fontSize="small" color="action" />
                          <Typography variant="body2">
                            Prize Pool: ${Number(competition.prize_pool).toLocaleString()}
                          </Typography>
                        </Box>
                      )}

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PeopleIcon fontSize="small" color="action" />
                        <Typography variant="body2">
                          Participants: {competition.current_participants}
                          {competition.max_participants && ` / ${competition.max_participants}`}
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CalendarIcon fontSize="small" color="action" />
                        <Typography variant="body2">
                          Deadline:{' '}
                          {format(parseISO(competition.submission_deadline), 'MMM dd, yyyy')}
                          {getDaysUntil(competition.submission_deadline) > 0 && (
                            <Chip
                              label={`${getDaysUntil(competition.submission_deadline)} days left`}
                              size="small"
                              color="warning"
                              sx={{ ml: 1 }}
                            />
                          )}
                        </Typography>
                      </Box>

                      {competition.judges && competition.judges.length > 0 && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <JudgeIcon fontSize="small" color="action" />
                          <Typography variant="body2">
                            {competition.judges.length} Judges
                          </Typography>
                        </Box>
                      )}
                    </Stack>

                    <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
                      <Button
                        fullWidth
                        variant="outlined"
                        onClick={() => handleViewCompetition(competition)}
                      >
                        View Details
                      </Button>
                      {competition.status === CompetitionStatus.OPEN && (
                        <Button
                          fullWidth
                          variant="contained"
                          onClick={() => {
                            setSelectedCompetition(competition);
                            setSubmitDialogOpen(true);
                          }}
                        >
                          Submit Pitch
                        </Button>
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <Grid container spacing={3}>
            {competitions
              .filter((c) => c.status === CompetitionStatus.JUDGING)
              .map((competition) => (
                <Grid item xs={12} key={competition.id}>
                  <Card>
                    <CardHeader
                      avatar={
                        <Badge badgeContent="LIVE" color="error">
                          <Avatar sx={{ bgcolor: 'error.main' }}>
                            <LiveIcon />
                          </Avatar>
                        </Badge>
                      }
                      title={
                        <Typography variant="h5" fontWeight={700}>
                          {competition.competition_name}
                        </Typography>
                      }
                      subheader="Live Pitch Event"
                      action={
                        <Button variant="contained" color="error" startIcon={<PlayIcon />}>
                          Watch Live
                        </Button>
                      }
                    />
                    <CardContent>
                      {competition.recording_url && (
                        <Box
                          sx={{
                            width: '100%',
                            height: 400,
                            bgcolor: 'black',
                            borderRadius: 2,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mb: 3,
                          }}
                        >
                          <Typography variant="h6" color="white">
                            Live Stream Placeholder
                          </Typography>
                        </Box>
                      )}

                      {competition.leaderboard && competition.leaderboard.length > 0 && (
                        <Box>
                          <Typography variant="h6" gutterBottom>
                            Live Leaderboard
                          </Typography>
                          <TableContainer>
                            <Table>
                              <TableHead>
                                <TableRow>
                                  <TableCell>Rank</TableCell>
                                  <TableCell>Venture</TableCell>
                                  <TableCell align="right">Score</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {competition.leaderboard.map((entry) => (
                                  <TableRow key={entry.venture_id}>
                                    <TableCell>
                                      <Chip
                                        label={entry.rank}
                                        color={entry.rank === 1 ? 'warning' : 'default'}
                                        size="small"
                                      />
                                    </TableCell>
                                    <TableCell>{entry.venture_name}</TableCell>
                                    <TableCell align="right">
                                      <Typography variant="body2" fontWeight={600}>
                                        {entry.total_score.toFixed(2)}
                                      </Typography>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
          </Grid>
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          <Grid container spacing={3}>
            {competitions
              .filter((c) => c.status === CompetitionStatus.COMPLETED)
              .map((competition) => (
                <Grid item xs={12} key={competition.id}>
                  <Card>
                    <CardHeader
                      avatar={
                        <Avatar sx={{ bgcolor: 'warning.main' }}>
                          <TrophyIcon />
                        </Avatar>
                      }
                      title={
                        <Typography variant="h6" fontWeight={700}>
                          {competition.competition_name}
                        </Typography>
                      }
                      subheader={`Completed on ${competition.competition_date ? format(parseISO(competition.competition_date), 'MMM dd, yyyy') : 'N/A'}`}
                    />
                    <CardContent>
                      {competition.final_results && competition.final_results.length > 0 && (
                        <Box>
                          <Typography variant="h6" gutterBottom>
                            Final Results
                          </Typography>
                          <Stack spacing={2}>
                            {competition.final_results.slice(0, 3).map((result, index) => (
                              <Paper
                                key={result.venture_id}
                                sx={{
                                  p: 2,
                                  bgcolor:
                                    index === 0 ? alpha('#FFD700', 0.1) : 'background.default',
                                  border: index === 0 ? 2 : 1,
                                  borderColor: index === 0 ? '#FFD700' : 'divider',
                                }}
                              >
                                <Stack direction="row" alignItems="center" spacing={2}>
                                  <Avatar
                                    sx={{
                                      bgcolor:
                                        index === 0
                                          ? '#FFD700'
                                          : index === 1
                                            ? '#C0C0C0'
                                            : '#CD7F32',
                                      color: 'white',
                                    }}
                                  >
                                    {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                                  </Avatar>
                                  <Box flex={1}>
                                    <Typography variant="subtitle1" fontWeight={700}>
                                      {result.venture_name}
                                    </Typography>
                                    {result.prize && (
                                      <Typography variant="body2" color="text.secondary">
                                        {result.prize}
                                      </Typography>
                                    )}
                                  </Box>
                                  <Typography variant="h6" fontWeight={700}>
                                    {result.total_score.toFixed(2)}
                                  </Typography>
                                </Stack>
                              </Paper>
                            ))}
                          </Stack>
                        </Box>
                      )}

                      {competition.highlights_url && (
                        <Button
                          variant="outlined"
                          startIcon={<PlayIcon />}
                          sx={{ mt: 2 }}
                          href={competition.highlights_url}
                          target="_blank"
                        >
                          Watch Highlights
                        </Button>
                      )}
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
        maxWidth="lg"
        fullWidth
      >
        {selectedCompetition && (
          <>
            <DialogTitle>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="h5" fontWeight={700}>
                  {selectedCompetition.competition_name}
                </Typography>
                <IconButton onClick={() => setDetailDialogOpen(false)}>
                  <CloseIcon />
                </IconButton>
              </Stack>
            </DialogTitle>
            <DialogContent>
              <Stack spacing={3}>
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Evaluation Criteria
                  </Typography>
                  <Grid container spacing={2}>
                    {selectedCompetition.evaluation_criteria?.map((criteria) => (
                      <Grid item xs={12} sm={6} key={criteria.id}>
                        <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                          <Typography variant="subtitle2" fontWeight={600}>
                            {criteria.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {criteria.description}
                          </Typography>
                          <Chip
                            label={`Max: ${criteria.max_score} pts (${criteria.weight}% weight)`}
                            size="small"
                            sx={{ mt: 1 }}
                          />
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </Box>

                <Divider />

                <Box>
                  <Typography variant="h6" gutterBottom>
                    Submissions ({submissions.length})
                  </Typography>
                  <Stack spacing={2}>
                    {submissions.map((submission) => (
                      <Card key={submission.id}>
                        <CardContent>
                          <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Box flex={1}>
                              <Typography variant="subtitle1" fontWeight={600}>
                                {submission.venture?.venture_name}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Submitted:{' '}
                                {format(parseISO(submission.submission_date), 'MMM dd, yyyy')}
                              </Typography>
                              {submission.total_score && (
                                <Chip
                                  label={`Score: ${submission.total_score.toFixed(2)}`}
                                  size="small"
                                  color="primary"
                                  sx={{ mt: 1 }}
                                />
                              )}
                            </Box>
                            <Stack direction="row" spacing={1}>
                              <IconButton onClick={() => handleVote(submission.id)}>
                                <Badge badgeContent={submission.audience_votes} color="primary">
                                  <VoteIcon />
                                </Badge>
                              </IconButton>
                              {isJudge && (
                                <Button
                                  variant="outlined"
                                  size="small"
                                  onClick={() => handleJudgeSubmission(submission)}
                                >
                                  Score
                                </Button>
                              )}
                            </Stack>
                          </Stack>
                        </CardContent>
                      </Card>
                    ))}
                  </Stack>
                </Box>
              </Stack>
            </DialogContent>
          </>
        )}
      </Dialog>

      <Dialog
        open={submitDialogOpen}
        onClose={() => setSubmitDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Submit Your Pitch</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              type="number"
              label="Venture ID"
              value={submissionForm.venture_id}
              onChange={(e) =>
                setSubmissionForm({ ...submissionForm, venture_id: Number(e.target.value) })
              }
            />
            <TextField
              fullWidth
              label="Pitch Video URL"
              value={submissionForm.pitch_video_url}
              onChange={(e) =>
                setSubmissionForm({ ...submissionForm, pitch_video_url: e.target.value })
              }
              placeholder="https://youtube.com/..."
            />
            <TextField
              fullWidth
              label="Presentation URL"
              value={submissionForm.presentation_url}
              onChange={(e) =>
                setSubmissionForm({ ...submissionForm, presentation_url: e.target.value })
              }
              placeholder="https://docs.google.com/..."
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSubmitDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSubmitPitch}
            disabled={loading || !submissionForm.venture_id}
            startIcon={<SendIcon />}
          >
            Submit Pitch
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={judgingDialogOpen}
        onClose={() => setJudgingDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Judge Submission</DialogTitle>
        <DialogContent>
          {selectedSubmission && selectedCompetition && (
            <Stack spacing={3} sx={{ mt: 1 }}>
              <Alert severity="info">Score each criterion based on the evaluation rubric</Alert>

              {selectedCompetition.evaluation_criteria?.map((criteria) => (
                <Box key={criteria.id}>
                  <Typography variant="subtitle2" gutterBottom>
                    {criteria.name} (Max: {criteria.max_score} pts)
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                    {criteria.description}
                  </Typography>
                  <Rating
                    value={scores[criteria.id] || 0}
                    max={criteria.max_score}
                    onChange={(_, value) => setScores({ ...scores, [criteria.id]: value || 0 })}
                    size="large"
                  />
                </Box>
              ))}

              <TextField
                fullWidth
                multiline
                rows={4}
                label="Comments & Feedback"
                value={judgeComments}
                onChange={(e) => setJudgeComments(e.target.value)}
                placeholder="Provide constructive feedback..."
              />
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setJudgingDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSubmitScores}
            disabled={loading || Object.keys(scores).length === 0}
            startIcon={<SendIcon />}
          >
            Submit Scores
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

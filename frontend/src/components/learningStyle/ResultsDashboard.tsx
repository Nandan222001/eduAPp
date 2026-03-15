import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Alert,
  Button,
  Paper,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useTheme,
  alpha,
  Divider,
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Hearing as HearingIcon,
  TouchApp as TouchIcon,
  MenuBook as BookIcon,
  EmojiEvents as TrophyIcon,
  CheckCircle as CheckCircleIcon,
  TipsAndUpdates as TipsIcon,
  School as SchoolIcon,
} from '@mui/icons-material';
import { Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import learningStyleApi from '@/api/learningStyle';
import { LearningStyleProfile, StudyTip } from '@/types/learningStyle';
import { useNavigate } from 'react-router-dom';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

interface ResultsDashboardProps {
  studentId: number;
  profileId?: number;
}

const styleIcons: Record<string, JSX.Element> = {
  visual: <VisibilityIcon />,
  auditory: <HearingIcon />,
  kinesthetic: <TouchIcon />,
  reading_writing: <BookIcon />,
};

const styleColors: Record<string, string> = {
  visual: '#3b82f6',
  auditory: '#10b981',
  kinesthetic: '#f59e0b',
  reading_writing: '#8b5cf6',
};

export default function ResultsDashboard({ studentId }: ResultsDashboardProps) {
  const theme = useTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<LearningStyleProfile | null>(null);
  const [studyTips, setStudyTips] = useState<StudyTip[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadResults();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadResults = async () => {
    try {
      setLoading(true);
      const [profileData, tipsData] = await Promise.all([
        learningStyleApi.getProfile(studentId),
        learningStyleApi.getStudyTips('all'),
      ]);
      setProfile(profileData);
      setStudyTips(tipsData);
    } catch (err) {
      setError('Failed to load results');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box
        sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error || !profile) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Alert severity="error">{error || 'Profile not found'}</Alert>
      </Container>
    );
  }

  const radarData = {
    labels: ['Visual', 'Auditory', 'Kinesthetic', 'Reading/Writing'],
    datasets: [
      {
        label: 'Learning Style Profile',
        data: [
          profile.visual_score,
          profile.auditory_score,
          profile.kinesthetic_score,
          profile.reading_writing_score,
        ],
        backgroundColor: alpha(theme.palette.primary.main, 0.2),
        borderColor: theme.palette.primary.main,
        borderWidth: 2,
        pointBackgroundColor: theme.palette.primary.main,
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: theme.palette.primary.main,
      },
    ],
  };

  const radarOptions = {
    scales: {
      r: {
        beginAtZero: true,
        max: 100,
        ticks: {
          stepSize: 20,
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
    },
  };

  const getStyleDescription = (style: string) => {
    const descriptions: Record<string, string> = {
      visual:
        'You learn best through visual aids like diagrams, charts, videos, and written instructions.',
      auditory:
        'You learn best through listening to explanations, discussions, and audio materials.',
      kinesthetic:
        'You learn best through hands-on activities, experiments, and physical movement.',
      reading_writing: 'You learn best through reading texts, taking notes, and writing summaries.',
    };
    return descriptions[style] || '';
  };

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', py: 4 }}>
      <Container maxWidth="lg">
        {/* Success Header */}
        <Paper
          elevation={3}
          sx={{
            p: 4,
            mb: 4,
            background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`,
            color: 'white',
            textAlign: 'center',
          }}
        >
          <TrophyIcon sx={{ fontSize: 80, mb: 2 }} />
          <Typography variant="h3" fontWeight={700} gutterBottom>
            Assessment Complete!
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.9 }}>
            Discover your unique learning style profile
          </Typography>
        </Paper>

        <Grid container spacing={3}>
          {/* Radar Chart */}
          <Grid item xs={12} md={6}>
            <Card elevation={2}>
              <CardHeader title="Your Learning Style Profile" />
              <CardContent>
                <Box
                  sx={{
                    height: 400,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Radar data={radarData} options={radarOptions} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Primary & Secondary Styles */}
          <Grid item xs={12} md={6}>
            <Card elevation={2} sx={{ height: '100%' }}>
              <CardHeader title="Learning Style Breakdown" />
              <CardContent>
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: '50%',
                        bgcolor: alpha(styleColors[profile.primary_style], 0.1),
                        color: styleColors[profile.primary_style],
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {styleIcons[profile.primary_style]}
                    </Box>
                    <Box>
                      <Typography variant="overline" color="text.secondary">
                        Primary Style
                      </Typography>
                      <Typography
                        variant="h5"
                        fontWeight={700}
                        sx={{ textTransform: 'capitalize' }}
                      >
                        {profile.primary_style.replace('_', ' ')}
                      </Typography>
                    </Box>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {getStyleDescription(profile.primary_style)}
                  </Typography>
                </Box>

                <Divider sx={{ my: 3 }} />

                {profile.secondary_style && (
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Box
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: '50%',
                          bgcolor: alpha(styleColors[profile.secondary_style], 0.1),
                          color: styleColors[profile.secondary_style],
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {styleIcons[profile.secondary_style]}
                      </Box>
                      <Box>
                        <Typography variant="overline" color="text.secondary">
                          Secondary Style
                        </Typography>
                        <Typography
                          variant="h6"
                          fontWeight={600}
                          sx={{ textTransform: 'capitalize' }}
                        >
                          {profile.secondary_style.replace('_', ' ')}
                        </Typography>
                      </Box>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {getStyleDescription(profile.secondary_style)}
                    </Typography>
                  </Box>
                )}

                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Score Breakdown:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                    <Chip
                      icon={<VisibilityIcon />}
                      label={`Visual: ${profile.visual_score}%`}
                      size="small"
                    />
                    <Chip
                      icon={<HearingIcon />}
                      label={`Auditory: ${profile.auditory_score}%`}
                      size="small"
                    />
                    <Chip
                      icon={<TouchIcon />}
                      label={`Kinesthetic: ${profile.kinesthetic_score}%`}
                      size="small"
                    />
                    <Chip
                      icon={<BookIcon />}
                      label={`Reading/Writing: ${profile.reading_writing_score}%`}
                      size="small"
                    />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Study Tips */}
          <Grid item xs={12}>
            <Card elevation={2}>
              <CardHeader
                title="Personalized Study Tips"
                avatar={<TipsIcon sx={{ color: theme.palette.warning.main }} />}
                subheader={`Tips tailored for ${profile.primary_style.replace('_', ' ')} learners`}
              />
              <CardContent>
                <Grid container spacing={2}>
                  {studyTips
                    .filter((tip) => tip.learning_style === profile.primary_style)
                    .slice(0, 6)
                    .map((tip) => (
                      <Grid item xs={12} sm={6} md={4} key={tip.id}>
                        <Paper
                          elevation={0}
                          sx={{
                            p: 2,
                            height: '100%',
                            border: `1px solid ${theme.palette.divider}`,
                            borderLeft: `4px solid ${styleColors[tip.learning_style]}`,
                          }}
                        >
                          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                            {tip.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" paragraph>
                            {tip.description}
                          </Typography>
                          <List dense>
                            {tip.examples.slice(0, 3).map((example, idx) => (
                              <ListItem key={idx} sx={{ px: 0 }}>
                                <ListItemIcon sx={{ minWidth: 32 }}>
                                  <CheckCircleIcon sx={{ fontSize: 16, color: 'success.main' }} />
                                </ListItemIcon>
                                <ListItemText
                                  primary={example}
                                  primaryTypographyProps={{ variant: 'caption' }}
                                />
                              </ListItem>
                            ))}
                          </List>
                        </Paper>
                      </Grid>
                    ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Preferences */}
          <Grid item xs={12}>
            <Card elevation={2}>
              <CardHeader title="Your Learning Preferences" />
              <CardContent>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                      Preferred Formats
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {profile.preferences.preferred_formats.map((format, idx) => (
                        <Chip key={idx} label={format} size="small" color="primary" />
                      ))}
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                      Study Environment
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {profile.preferences.study_environment}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                      Interaction Preference
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {profile.preferences.interaction_preference}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Action Buttons */}
          <Grid item xs={12}>
            <Paper elevation={0} sx={{ p: 3, bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<SchoolIcon />}
                    onClick={() => navigate('/adaptive-learning-library')}
                  >
                    Browse Content Library
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={() => navigate('/student/dashboard')}
                  >
                    Back to Dashboard
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Button fullWidth variant="outlined" onClick={() => window.print()}>
                    Print Results
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={() => navigate('/parent/learning-guide')}
                  >
                    Parent Guide
                  </Button>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

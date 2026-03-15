import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Chip,
  LinearProgress,
  Stack,
  Paper,
  useTheme,
  alpha,
  List,
  ListItem,
  ListItemText,
  Avatar,
  Rating,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Lightbulb as LightbulbIcon,
  Psychology as PsychologyIcon,
} from '@mui/icons-material';
import { scholarshipEssayApi } from '@/api/scholarshipEssay';
import type { EssayFeedbackSummary } from '@/types/scholarshipEssay';

interface EssayFeedbackDashboardProps {
  essayId: string;
}

export default function EssayFeedbackDashboard({ essayId }: EssayFeedbackDashboardProps) {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<EssayFeedbackSummary | null>(null);

  useEffect(() => {
    loadFeedback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [essayId]);

  const loadFeedback = async () => {
    try {
      setLoading(true);
      const data = await scholarshipEssayApi.getEssayFeedback(essayId);
      setFeedback(data);
      setError(null);
    } catch (err) {
      setError('Failed to load feedback');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !feedback) {
    return <Alert severity="error">{error || 'No feedback available'}</Alert>;
  }

  return (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card
            elevation={0}
            sx={{
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
              color: 'white',
            }}
          >
            <CardContent>
              <Grid container spacing={3} alignItems="center">
                <Grid item xs={12} md={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h3" fontWeight={700}>
                      {feedback.avgOverallRating.toFixed(1)}
                    </Typography>
                    <Rating value={feedback.avgOverallRating} readOnly sx={{ color: 'white' }} />
                    <Typography variant="body2" sx={{ mt: 1, opacity: 0.9 }}>
                      Average Rating
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={8}>
                  <Typography variant="h5" fontWeight={700} gutterBottom>
                    {feedback.essayTitle}
                  </Typography>
                  <Typography variant="body1" sx={{ opacity: 0.9 }}>
                    Based on {feedback.totalReviews} peer review
                    {feedback.totalReviews !== 1 ? 's' : ''}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, height: '100%' }}>
            <CardHeader
              title="Aggregated Rubric Scores"
              avatar={<TrendingUpIcon color="primary" />}
            />
            <CardContent>
              <Stack spacing={3}>
                {feedback.aggregatedScores.map((score) => {
                  const percentage = (score.avgScore / score.maxScore) * 100;
                  return (
                    <Box key={score.criterion}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" fontWeight={600}>
                          {score.criterion}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {score.avgScore.toFixed(1)} / {score.maxScore}
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={percentage}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                          '& .MuiLinearProgress-bar': {
                            bgcolor:
                              percentage >= 80
                                ? theme.palette.success.main
                                : percentage >= 60
                                  ? theme.palette.warning.main
                                  : theme.palette.error.main,
                          },
                        }}
                      />
                    </Box>
                  );
                })}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Stack spacing={3}>
            <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
              <CardHeader title="Common Strengths" avatar={<CheckCircleIcon color="success" />} />
              <CardContent>
                <List dense>
                  {feedback.commonStrengths.slice(0, 5).map((strength, index) => (
                    <ListItem key={index}>
                      <ListItemText
                        primary={strength.text}
                        secondary={`Mentioned by ${strength.count} reviewer${strength.count !== 1 ? 's' : ''}`}
                      />
                      <Chip
                        label={strength.count}
                        size="small"
                        color="success"
                        variant="outlined"
                      />
                    </ListItem>
                  ))}
                  {feedback.commonStrengths.length === 0 && (
                    <Typography variant="body2" color="text.secondary">
                      No common strengths identified yet
                    </Typography>
                  )}
                </List>
              </CardContent>
            </Card>

            <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
              <CardHeader title="Areas for Improvement" avatar={<WarningIcon color="warning" />} />
              <CardContent>
                <List dense>
                  {feedback.commonImprovements.slice(0, 5).map((improvement, index) => (
                    <ListItem key={index}>
                      <ListItemText
                        primary={improvement.text}
                        secondary={`Mentioned by ${improvement.count} reviewer${improvement.count !== 1 ? 's' : ''}`}
                      />
                      <Chip
                        label={improvement.count}
                        size="small"
                        color="warning"
                        variant="outlined"
                      />
                    </ListItem>
                  ))}
                  {feedback.commonImprovements.length === 0 && (
                    <Typography variant="body2" color="text.secondary">
                      No common improvements identified yet
                    </Typography>
                  )}
                </List>
              </CardContent>
            </Card>
          </Stack>
        </Grid>

        <Grid item xs={12}>
          <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
            <CardHeader
              title="Actionable Suggestions"
              avatar={<LightbulbIcon sx={{ color: theme.palette.warning.main }} />}
            />
            <CardContent>
              {feedback.actionableSuggestions.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No actionable suggestions available yet
                </Typography>
              ) : (
                <Grid container spacing={2}>
                  {feedback.actionableSuggestions.map((suggestion, index) => (
                    <Grid item xs={12} md={6} key={index}>
                      <Paper
                        elevation={0}
                        sx={{
                          p: 2,
                          bgcolor: alpha(theme.palette.warning.main, 0.05),
                          border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
                        }}
                      >
                        <Stack direction="row" spacing={2} alignItems="flex-start">
                          <Avatar
                            sx={{
                              bgcolor: alpha(theme.palette.warning.main, 0.1),
                              color: theme.palette.warning.main,
                              width: 32,
                              height: 32,
                            }}
                          >
                            {index + 1}
                          </Avatar>
                          <Typography variant="body2">{suggestion}</Typography>
                        </Stack>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              )}
            </CardContent>
          </Card>
        </Grid>

        {feedback.reviewersConsensus && (
          <Grid item xs={12}>
            <Card
              elevation={0}
              sx={{
                border: `1px solid ${theme.palette.divider}`,
                bgcolor: alpha(theme.palette.secondary.main, 0.05),
              }}
            >
              <CardHeader
                title="Reviewers' Consensus"
                avatar={<PsychologyIcon color="secondary" />}
              />
              <CardContent>
                <Typography variant="body1">{feedback.reviewersConsensus}</Typography>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}

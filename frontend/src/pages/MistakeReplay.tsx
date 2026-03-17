import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Alert,
  useTheme,
  alpha,
  Chip,
  List,
  ListItem,
  ListItemText,
  LinearProgress,
  Paper,
  IconButton,
  Divider,
  Button,
  Avatar,
  Stack,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  School as SchoolIcon,
  EmojiObjects as LightbulbIcon,
  Link as LinkIcon,
  Assessment as AssessmentIcon,
  CompareArrows as CompareIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { mistakeAnalysisApi } from '@/api/mistakeAnalysis';
import { useAuth } from '@/hooks/useAuth';
import type { MistakeReplayData, MistakePattern, MistakeSeverity } from '@/types/mistakeAnalysis';

interface SeverityHeaderProps {
  severity: MistakeSeverity;
  count: number;
  totalMarksLost: number;
}

function SeverityHeader({ severity, count, totalMarksLost }: SeverityHeaderProps) {
  const theme = useTheme();

  const getSeverityConfig = () => {
    switch (severity) {
      case 'critical':
        return {
          icon: <ErrorIcon />,
          color: theme.palette.error.main,
          label: 'Critical Mistakes',
          bgcolor: alpha(theme.palette.error.main, 0.1),
        };
      case 'moderate':
        return {
          icon: <WarningIcon />,
          color: theme.palette.warning.main,
          label: 'Moderate Mistakes',
          bgcolor: alpha(theme.palette.warning.main, 0.1),
        };
      case 'minor':
        return {
          icon: <InfoIcon />,
          color: theme.palette.info.main,
          label: 'Minor Mistakes',
          bgcolor: alpha(theme.palette.info.main, 0.1),
        };
    }
  };

  const config = getSeverityConfig();

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        mb: 3,
        border: `2px solid ${config.color}`,
        bgcolor: config.bgcolor,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar sx={{ bgcolor: config.color, width: 56, height: 56 }}>{config.icon}</Avatar>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" fontWeight={700} sx={{ color: config.color }}>
            {config.label}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {count} pattern{count !== 1 ? 's' : ''} • {totalMarksLost} marks lost
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
}

interface PatternCardProps {
  pattern: MistakePattern;
  onMasteryTest: (patternId: number) => void;
}

function PatternCard({ pattern, onMasteryTest }: PatternCardProps) {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);

  const getSeverityColor = () => {
    switch (pattern.severity) {
      case 'critical':
        return theme.palette.error.main;
      case 'moderate':
        return theme.palette.warning.main;
      default:
        return theme.palette.info.main;
    }
  };

  const masteryColor =
    pattern.mastery_level >= 80
      ? theme.palette.success.main
      : pattern.mastery_level >= 50
        ? theme.palette.warning.main
        : theme.palette.error.main;

  return (
    <Card
      elevation={0}
      sx={{
        border: `1px solid ${theme.palette.divider}`,
        mb: 2,
        '&:hover': {
          borderColor: getSeverityColor(),
          boxShadow: theme.shadows[2],
        },
      }}
    >
      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6" fontWeight={600}>
              {pattern.mistake_type}
            </Typography>
            <Chip
              label={pattern.severity}
              size="small"
              sx={{
                bgcolor: alpha(getSeverityColor(), 0.1),
                color: getSeverityColor(),
                fontWeight: 600,
                textTransform: 'capitalize',
              }}
            />
          </Box>
        }
        subheader={
          <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Frequency: <strong>{pattern.frequency} times</strong>
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Marks Lost: <strong>{pattern.total_marks_lost}</strong>
            </Typography>
          </Box>
        }
        action={
          <IconButton onClick={() => setExpanded(!expanded)}>
            <ExpandMoreIcon
              sx={{
                transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.3s',
              }}
            />
          </IconButton>
        }
      />
      <CardContent>
        <Typography variant="body2" color="text.secondary" paragraph>
          {pattern.description}
        </Typography>

        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" fontWeight={600}>
              Mastery Level
            </Typography>
            <Typography variant="body2" fontWeight={600} sx={{ color: masteryColor }}>
              {pattern.mastery_level}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={pattern.mastery_level}
            sx={{
              height: 8,
              borderRadius: 4,
              bgcolor: alpha(masteryColor, 0.1),
              '& .MuiLinearProgress-bar': {
                bgcolor: masteryColor,
              },
            }}
          />
        </Box>

        {expanded && (
          <Box sx={{ mt: 3 }}>
            <Divider sx={{ mb: 2 }} />

            {pattern.memory_tricks.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <LightbulbIcon sx={{ color: theme.palette.warning.main, fontSize: 20 }} />
                  <Typography variant="subtitle2" fontWeight={600}>
                    Memory Tricks
                  </Typography>
                </Box>
                <Stack spacing={1}>
                  {pattern.memory_tricks.map((trick, index) => (
                    <Paper
                      key={index}
                      elevation={0}
                      sx={{
                        p: 1.5,
                        bgcolor: alpha(theme.palette.primary.main, 0.05),
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                      }}
                    >
                      <Typography variant="body2">{trick}</Typography>
                    </Paper>
                  ))}
                </Stack>
              </Box>
            )}

            {pattern.practice_links.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <LinkIcon sx={{ color: theme.palette.info.main, fontSize: 20 }} />
                  <Typography variant="subtitle2" fontWeight={600}>
                    Targeted Practice
                  </Typography>
                </Box>
                <Stack spacing={1}>
                  {pattern.practice_links.map((link, index) => (
                    <Button
                      key={index}
                      variant="outlined"
                      size="small"
                      startIcon={<SchoolIcon />}
                      href={link.url}
                      target="_blank"
                      sx={{ justifyContent: 'flex-start' }}
                    >
                      {link.title}
                    </Button>
                  ))}
                </Stack>
              </Box>
            )}

            {pattern.occurrences.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                  Example Occurrences ({pattern.occurrences.length})
                </Typography>
                <List sx={{ py: 0 }}>
                  {pattern.occurrences.slice(0, 3).map((occurrence) => (
                    <ListItem
                      key={occurrence.id}
                      sx={{
                        px: 0,
                        py: 1,
                        borderLeft: `3px solid ${getSeverityColor()}`,
                        pl: 2,
                        mb: 1,
                        bgcolor: alpha(getSeverityColor(), 0.03),
                      }}
                    >
                      <ListItemText
                        primary={
                          <Typography variant="body2" fontWeight={600}>
                            {occurrence.exam_name} - Q{occurrence.question_number}
                          </Typography>
                        }
                        secondary={
                          <Box>
                            <Typography variant="caption" color="text.secondary" display="block">
                              {occurrence.subject} •{' '}
                              {new Date(occurrence.date).toLocaleDateString()}
                            </Typography>
                            <Typography variant="caption" color="error.main" fontWeight={600}>
                              -{occurrence.marks_lost} marks
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}

            <Button
              variant="contained"
              fullWidth
              startIcon={<AssessmentIcon />}
              onClick={() => onMasteryTest(pattern.id)}
              sx={{ mt: 2 }}
            >
              Take Mastery Test
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

interface BeforeAfterCardProps {
  data: MistakeReplayData;
}

function BeforeAfterCard({ data }: BeforeAfterCardProps) {
  const theme = useTheme();
  const totalPatterns =
    data.patterns_by_severity.critical.length +
    data.patterns_by_severity.moderate.length +
    data.patterns_by_severity.minor.length;

  return (
    <Card
      elevation={0}
      sx={{
        border: `1px solid ${theme.palette.divider}`,
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
      }}
    >
      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CompareIcon />
            <Typography variant="h6" fontWeight={700}>
              Progress Comparison
            </Typography>
          </Box>
        }
        subheader={`${data.month} ${data.year} Performance Summary`}
      />
      <CardContent>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper elevation={0} sx={{ p: 2, border: `1px solid ${theme.palette.divider}` }}>
              <Typography variant="overline" color="text.secondary" gutterBottom>
                Total Mistakes Identified
              </Typography>
              <Typography variant="h3" fontWeight={700} color="error.main">
                {data.total_mistakes}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Across {totalPatterns} distinct patterns
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper elevation={0} sx={{ p: 2, border: `1px solid ${theme.palette.divider}` }}>
              <Typography variant="overline" color="text.secondary" gutterBottom>
                Total Marks Lost
              </Typography>
              <Typography variant="h3" fontWeight={700} color="warning.main">
                {data.total_marks_lost}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Recoverable through practice
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12}>
            <Box
              sx={{
                p: 2,
                bgcolor:
                  data.improvement_rate >= 0
                    ? alpha(theme.palette.success.main, 0.1)
                    : alpha(theme.palette.error.main, 0.1),
                borderRadius: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 2,
              }}
            >
              {data.improvement_rate >= 0 ? (
                <TrendingUpIcon sx={{ color: theme.palette.success.main, fontSize: 40 }} />
              ) : (
                <TrendingDownIcon sx={{ color: theme.palette.error.main, fontSize: 40 }} />
              )}
              <Box>
                <Typography variant="h6" fontWeight={700}>
                  {Math.abs(data.improvement_rate)}%{' '}
                  {data.improvement_rate >= 0 ? 'Improvement' : 'More Mistakes'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Compared to previous period
                </Typography>
              </Box>
            </Box>
          </Grid>

          {data.most_improved_area && (
            <Grid item xs={12}>
              <Box
                sx={{
                  p: 2,
                  bgcolor: alpha(theme.palette.success.main, 0.05),
                  border: `1px solid ${theme.palette.success.main}`,
                  borderRadius: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <CheckCircleIcon sx={{ color: theme.palette.success.main }} />
                <Box>
                  <Typography variant="body2" fontWeight={600}>
                    Most Improved Area
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {data.most_improved_area}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          )}
        </Grid>
      </CardContent>
    </Card>
  );
}

export default function MistakeReplay() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [replayData, setReplayData] = useState<MistakeReplayData | null>(null);

  const currentDate = new Date();
  const [selectedMonth] = useState(currentDate.toLocaleString('default', { month: 'long' }));
  const [selectedYear] = useState(currentDate.getFullYear());

  useEffect(() => {
    const fetchReplayData = async () => {
      try {
        setLoading(true);
        const studentId = user?.id ? parseInt(user.id, 10) : 1;
        const data = await mistakeAnalysisApi.getMistakeReplay(
          studentId,
          selectedMonth,
          selectedYear
        );
        setReplayData(data);
        setError(null);
      } catch (err: unknown) {
        const error = err as { response?: { data?: { detail?: string } } };
        setError(error.response?.data?.detail || 'Failed to load mistake replay data');
      } finally {
        setLoading(false);
      }
    };

    fetchReplayData();
  }, [user, selectedMonth, selectedYear]);

  const handleMasteryTest = (patternId: number) => {
    console.log('Starting mastery test for pattern:', patternId);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!replayData) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">No mistake data available for the selected period</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Mistake Replay - Monthly Highlight Reel
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Review your mistakes organized by severity and learn from patterns
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <BeforeAfterCard data={replayData} />
        </Grid>

        <Grid item xs={12}>
          <SeverityHeader
            severity="critical"
            count={replayData.patterns_by_severity.critical.length}
            totalMarksLost={replayData.patterns_by_severity.critical.reduce(
              (sum, p) => sum + p.total_marks_lost,
              0
            )}
          />
          {replayData.patterns_by_severity.critical.length > 0 ? (
            replayData.patterns_by_severity.critical.map((pattern) => (
              <PatternCard key={pattern.id} pattern={pattern} onMasteryTest={handleMasteryTest} />
            ))
          ) : (
            <Alert severity="success" sx={{ mb: 3 }}>
              No critical mistakes this period! Keep up the excellent work!
            </Alert>
          )}
        </Grid>

        <Grid item xs={12}>
          <SeverityHeader
            severity="moderate"
            count={replayData.patterns_by_severity.moderate.length}
            totalMarksLost={replayData.patterns_by_severity.moderate.reduce(
              (sum, p) => sum + p.total_marks_lost,
              0
            )}
          />
          {replayData.patterns_by_severity.moderate.length > 0 ? (
            replayData.patterns_by_severity.moderate.map((pattern) => (
              <PatternCard key={pattern.id} pattern={pattern} onMasteryTest={handleMasteryTest} />
            ))
          ) : (
            <Alert severity="success" sx={{ mb: 3 }}>
              No moderate mistakes this period!
            </Alert>
          )}
        </Grid>

        <Grid item xs={12}>
          <SeverityHeader
            severity="minor"
            count={replayData.patterns_by_severity.minor.length}
            totalMarksLost={replayData.patterns_by_severity.minor.reduce(
              (sum, p) => sum + p.total_marks_lost,
              0
            )}
          />
          {replayData.patterns_by_severity.minor.length > 0 ? (
            replayData.patterns_by_severity.minor.map((pattern) => (
              <PatternCard key={pattern.id} pattern={pattern} onMasteryTest={handleMasteryTest} />
            ))
          ) : (
            <Alert severity="success" sx={{ mb: 3 }}>
              No minor mistakes this period!
            </Alert>
          )}
        </Grid>
      </Grid>
    </Box>
  );
}

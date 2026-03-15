import { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  LinearProgress,
  alpha,
  useTheme,
  Paper,
  Stack,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Avatar,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  AccountBalance as WalletIcon,
  Quiz as QuizIcon,
  EmojiEvents as ChallengeIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Star as StarIcon,
  LocalFireDepartment as FireIcon,
  Savings as SavingsIcon,
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

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

interface ScoreComponent {
  name: string;
  score: number;
  maxScore: number;
  weight: number;
  icon: React.ReactNode;
  color: string;
  recommendations: string[];
}

export default function FinancialHealthScore() {
  const theme = useTheme();

  const [components] = useState<ScoreComponent[]>([
    {
      name: 'Wallet Management',
      score: 85,
      maxScore: 100,
      weight: 30,
      icon: <WalletIcon />,
      color: theme.palette.primary.main,
      recommendations: [
        'Track all transactions consistently',
        'Maintain emergency fund at 10% of balance',
      ],
    },
    {
      name: 'Quiz Performance',
      score: 92,
      maxScore: 100,
      weight: 25,
      icon: <QuizIcon />,
      color: theme.palette.success.main,
      recommendations: [
        'Excellent quiz scores! Keep learning',
        'Review investing module questions',
      ],
    },
    {
      name: 'Challenge Completion',
      score: 70,
      maxScore: 100,
      weight: 25,
      icon: <ChallengeIcon />,
      color: theme.palette.warning.main,
      recommendations: ['Complete "Budget Master" challenge', 'Maintain your 8-day streak'],
    },
    {
      name: 'Savings Habits',
      score: 78,
      maxScore: 100,
      weight: 20,
      icon: <SavingsIcon />,
      color: theme.palette.info.main,
      recommendations: ['Increase monthly savings by 5%', 'Set up automatic savings transfers'],
    },
  ]);

  const overallScore = Math.round(
    components.reduce((sum, comp) => sum + (comp.score * comp.weight) / 100, 0)
  );

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Great';
    if (score >= 70) return 'Good';
    if (score >= 60) return 'Fair';
    return 'Needs Improvement';
  };

  const radarData = {
    labels: components.map((c) => c.name),
    datasets: [
      {
        label: 'Your Score',
        data: components.map((c) => c.score),
        backgroundColor: alpha(theme.palette.primary.main, 0.2),
        borderColor: theme.palette.primary.main,
        borderWidth: 2,
        pointBackgroundColor: theme.palette.primary.main,
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: theme.palette.primary.main,
      },
      {
        label: 'Class Average',
        data: [75, 80, 72, 68],
        backgroundColor: alpha(theme.palette.grey[500], 0.1),
        borderColor: theme.palette.grey[500],
        borderWidth: 1,
        borderDash: [5, 5],
        pointBackgroundColor: theme.palette.grey[500],
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: theme.palette.grey[500],
      },
    ],
  };

  const achievements = [
    { name: 'Perfect Quiz Streak', icon: <StarIcon />, color: theme.palette.warning.main },
    { name: 'Savings Superstar', icon: <SavingsIcon />, color: theme.palette.success.main },
    { name: '30-Day Streak', icon: <FireIcon />, color: theme.palette.error.main },
  ];

  const milestones = [
    { score: 60, label: 'Financial Beginner', achieved: true },
    { score: 70, label: 'Money Manager', achieved: true },
    { score: 80, label: 'Finance Pro', achieved: true },
    { score: 90, label: 'Financial Expert', achieved: false },
    { score: 95, label: 'Finance Master', achieved: false },
  ];

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Financial Health Score
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Track your financial literacy progress across all activities
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={5}>
          <Card
            sx={{
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
              color: 'white',
              mb: 3,
            }}
          >
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" sx={{ opacity: 0.9, mb: 2 }}>
                Overall Financial Health Score
              </Typography>
              <Box
                sx={{
                  position: 'relative',
                  display: 'inline-flex',
                  mb: 2,
                }}
              >
                <Box
                  sx={{
                    width: 200,
                    height: 200,
                    borderRadius: '50%',
                    background: alpha('#fff', 0.1),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Typography variant="h1" fontWeight={700}>
                    {overallScore}
                  </Typography>
                </Box>
              </Box>
              <Typography variant="h5" fontWeight={600} sx={{ mb: 1 }}>
                {getScoreLabel(overallScore)}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                You&apos;re performing better than 75% of your class
              </Typography>
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Score Breakdown" avatar={<TrendingUpIcon color="primary" />} />
            <CardContent>
              <Stack spacing={3}>
                {components.map((component) => (
                  <Box key={component.name}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar
                          sx={{
                            bgcolor: alpha(component.color, 0.1),
                            color: component.color,
                            width: 32,
                            height: 32,
                          }}
                        >
                          {component.icon}
                        </Avatar>
                        <Typography variant="body2" fontWeight={600}>
                          {component.name}
                        </Typography>
                      </Box>
                      <Typography variant="body2" fontWeight={700} color={component.color}>
                        {component.score}/{component.maxScore}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={(component.score / component.maxScore) * 100}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        bgcolor: alpha(component.color, 0.1),
                        '& .MuiLinearProgress-bar': {
                          bgcolor: component.color,
                        },
                      }}
                    />
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ mt: 0.5, display: 'block' }}
                    >
                      Weighted: {component.weight}%
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={7}>
          <Card sx={{ mb: 3 }}>
            <CardHeader title="Performance Comparison" />
            <CardContent>
              <Box sx={{ maxWidth: 600, mx: 'auto' }}>
                <Radar
                  data={radarData}
                  options={{
                    scales: {
                      r: {
                        min: 0,
                        max: 100,
                        beginAtZero: true,
                      },
                    },
                    plugins: {
                      legend: {
                        position: 'bottom',
                      },
                    },
                  }}
                />
              </Box>
            </CardContent>
          </Card>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader title="Recommendations" avatar={<InfoIcon color="info" />} />
                <CardContent>
                  <List>
                    {components
                      .filter((c) => c.score < 85)
                      .flatMap((c) => c.recommendations)
                      .slice(0, 5)
                      .map((rec, index) => (
                        <ListItem key={index} sx={{ px: 0 }}>
                          <ListItemIcon>
                            <WarningIcon color="warning" />
                          </ListItemIcon>
                          <ListItemText primary={rec} />
                        </ListItem>
                      ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader title="Recent Achievements" avatar={<StarIcon color="warning" />} />
                <CardContent>
                  <Stack spacing={2}>
                    {achievements.map((achievement, index) => (
                      <Paper
                        key={index}
                        sx={{
                          p: 2,
                          border: `1px solid ${theme.palette.divider}`,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2,
                        }}
                      >
                        <Avatar
                          sx={{
                            bgcolor: alpha(achievement.color, 0.1),
                            color: achievement.color,
                          }}
                        >
                          {achievement.icon}
                        </Avatar>
                        <Typography variant="body2" fontWeight={600}>
                          {achievement.name}
                        </Typography>
                      </Paper>
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Card sx={{ mt: 3 }}>
            <CardHeader title="Progress Milestones" />
            <CardContent>
              <Stack spacing={2}>
                {milestones.map((milestone, index) => (
                  <Box key={index}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar
                        sx={{
                          bgcolor: milestone.achieved
                            ? alpha(theme.palette.success.main, 0.1)
                            : alpha(theme.palette.grey[500], 0.1),
                          color: milestone.achieved
                            ? theme.palette.success.main
                            : theme.palette.grey[500],
                        }}
                      >
                        {milestone.achieved ? <CheckIcon /> : <StarIcon />}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography
                          variant="body2"
                          fontWeight={600}
                          sx={{
                            textDecoration: milestone.achieved ? 'none' : 'none',
                            opacity: milestone.achieved ? 1 : 0.6,
                          }}
                        >
                          {milestone.label}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Score: {milestone.score}
                        </Typography>
                      </Box>
                      {milestone.achieved ? (
                        <Chip label="Achieved" color="success" size="small" />
                      ) : (
                        <Chip
                          label={`${milestone.score - overallScore} points to go`}
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </Box>
                    {index < milestones.length - 1 && <Divider sx={{ my: 2 }} />}
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Grid container spacing={3}>
                <Grid item xs={12} md={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h3" fontWeight={700} color="primary.main">
                      12
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Modules Completed
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h3" fontWeight={700} color="success.main">
                      18
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Quizzes Passed
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h3" fontWeight={700} color="warning.main">
                      5
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Challenges Completed
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h3" fontWeight={700} color="info.main">
                      8
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Day Streak
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}

import { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Button,
  Chip,
  LinearProgress,
  Avatar,
  alpha,
  useTheme,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  Tooltip,
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as UncheckedIcon,
  Star as StarIcon,
  LocalFireDepartment as FireIcon,
  Leaderboard as LeaderboardIcon,
  Timer as TimerIcon,
  TrendingUp as TrendingUpIcon,
  AccountBalance as BankIcon,
  Savings as SavingsIcon,
  ShowChart as InvestIcon,
  CreditCard as CreditIcon,
} from '@mui/icons-material';

interface Challenge {
  id: number;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  points: number;
  tasks: ChallengeTask[];
  deadline: string;
  status: 'active' | 'completed' | 'locked';
  icon: React.ReactNode;
}

interface ChallengeTask {
  id: number;
  description: string;
  completed: boolean;
}

interface Reward {
  id: number;
  name: string;
  description: string;
  points: number;
  icon: React.ReactNode;
  earnedDate: string;
}

interface LeaderboardEntry {
  rank: number;
  name: string;
  points: number;
  challengesCompleted: number;
  streak: number;
  isCurrentUser?: boolean;
}

export default function FinanceChallengesDashboard() {
  const theme = useTheme();

  const [challenges] = useState<Challenge[]>([
    {
      id: 1,
      title: '30-Day Savings Challenge',
      description: 'Save a portion of your allowance every day for 30 days',
      difficulty: 'easy',
      category: 'Savings',
      points: 100,
      deadline: '2024-02-15',
      status: 'active',
      icon: <SavingsIcon />,
      tasks: [
        { id: 1, description: 'Set up savings goal in virtual wallet', completed: true },
        { id: 2, description: 'Save for 7 consecutive days', completed: true },
        { id: 3, description: 'Save for 14 consecutive days', completed: true },
        { id: 4, description: 'Save for 21 consecutive days', completed: false },
        { id: 5, description: 'Complete 30 days of savings', completed: false },
      ],
    },
    {
      id: 2,
      title: 'Budget Master',
      description: 'Create and stick to a monthly budget without overspending',
      difficulty: 'medium',
      category: 'Budgeting',
      points: 150,
      deadline: '2024-02-28',
      status: 'active',
      icon: <BankIcon />,
      tasks: [
        { id: 1, description: 'Create a monthly budget plan', completed: true },
        { id: 2, description: 'Track all expenses for 1 week', completed: true },
        { id: 3, description: 'Stay within budget for 2 weeks', completed: false },
        { id: 4, description: 'Complete the month within budget', completed: false },
      ],
    },
    {
      id: 3,
      title: 'Investment Explorer',
      description: 'Learn about investing by building a virtual stock portfolio',
      difficulty: 'hard',
      category: 'Investing',
      points: 200,
      deadline: '2024-03-15',
      status: 'active',
      icon: <InvestIcon />,
      tasks: [
        { id: 1, description: 'Complete "Introduction to Investing" module', completed: false },
        { id: 2, description: 'Research and select 3 stocks', completed: false },
        { id: 3, description: 'Build a diversified portfolio', completed: false },
        { id: 4, description: 'Achieve 5% return in simulation', completed: false },
      ],
    },
    {
      id: 4,
      title: 'Credit Card Smart User',
      description: 'Learn responsible credit card usage through scenarios',
      difficulty: 'medium',
      category: 'Credit',
      points: 125,
      deadline: '2024-02-20',
      status: 'locked',
      icon: <CreditIcon />,
      tasks: [
        { id: 1, description: 'Complete credit card basics quiz', completed: false },
        { id: 2, description: 'Make 5 correct decisions in scenarios', completed: false },
        { id: 3, description: 'Calculate interest on sample balances', completed: false },
      ],
    },
  ]);

  const [rewards] = useState<Reward[]>([
    {
      id: 1,
      name: 'First Steps',
      description: 'Completed your first financial challenge',
      points: 50,
      icon: <StarIcon />,
      earnedDate: '2024-01-10',
    },
    {
      id: 2,
      name: 'Savings Starter',
      description: 'Saved for 7 consecutive days',
      points: 75,
      icon: <SavingsIcon />,
      earnedDate: '2024-01-15',
    },
    {
      id: 3,
      name: 'Budget Pro',
      description: 'Created your first monthly budget',
      points: 100,
      icon: <BankIcon />,
      earnedDate: '2024-01-20',
    },
  ]);

  const [leaderboard] = useState<LeaderboardEntry[]>([
    { rank: 1, name: 'Sarah Chen', points: 1250, challengesCompleted: 8, streak: 15 },
    { rank: 2, name: 'Michael Rodriguez', points: 1180, challengesCompleted: 7, streak: 12 },
    { rank: 3, name: 'Emma Thompson', points: 1050, challengesCompleted: 6, streak: 10 },
    { rank: 4, name: 'You', points: 825, challengesCompleted: 5, streak: 8, isCurrentUser: true },
    { rank: 5, name: 'James Wilson', points: 790, challengesCompleted: 5, streak: 6 },
    { rank: 6, name: 'Olivia Davis', points: 720, challengesCompleted: 4, streak: 5 },
    { rank: 7, name: 'Liam Brown', points: 680, challengesCompleted: 4, streak: 4 },
    { rank: 8, name: 'Sophia Martinez', points: 650, challengesCompleted: 3, streak: 7 },
  ]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return theme.palette.success.main;
      case 'medium':
        return theme.palette.warning.main;
      case 'hard':
        return theme.palette.error.main;
      default:
        return theme.palette.grey[500];
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Savings':
        return <SavingsIcon />;
      case 'Budgeting':
        return <BankIcon />;
      case 'Investing':
        return <InvestIcon />;
      case 'Credit':
        return <CreditIcon />;
      default:
        return <TrophyIcon />;
    }
  };

  const totalPoints = rewards.reduce((sum, reward) => sum + reward.points, 0) + 825;
  const activeChallenges = challenges.filter((c) => c.status === 'active').length;
  const completedChallenges = challenges.filter((c) => c.status === 'completed').length;

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Finance Challenges
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Complete challenges to earn points, unlock achievements, and improve your financial skills
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  mb: 2,
                }}
              >
                <Typography variant="h6">Total Points</Typography>
                <TrophyIcon sx={{ fontSize: 40, color: theme.palette.warning.main }} />
              </Box>
              <Typography variant="h3" fontWeight={700} color="primary.main">
                {totalPoints}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Rank #4 in class
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  mb: 2,
                }}
              >
                <Typography variant="h6">Active</Typography>
                <TimerIcon sx={{ fontSize: 40, color: theme.palette.info.main }} />
              </Box>
              <Typography variant="h3" fontWeight={700} color="info.main">
                {activeChallenges}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Challenges in progress
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  mb: 2,
                }}
              >
                <Typography variant="h6">Completed</Typography>
                <CheckCircleIcon sx={{ fontSize: 40, color: theme.palette.success.main }} />
              </Box>
              <Typography variant="h3" fontWeight={700} color="success.main">
                {completedChallenges}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Challenges finished
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  mb: 2,
                }}
              >
                <Typography variant="h6">Streak</Typography>
                <FireIcon sx={{ fontSize: 40, color: theme.palette.error.main }} />
              </Box>
              <Typography variant="h3" fontWeight={700} color="error.main">
                8
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Days in a row
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={8}>
          <Card>
            <CardHeader
              title="Active Challenges"
              subheader={`${activeChallenges} challenges in progress`}
            />
            <CardContent>
              <Stack spacing={3}>
                {challenges
                  .filter((c) => c.status === 'active')
                  .map((challenge) => {
                    const completedTasks = challenge.tasks.filter((t) => t.completed).length;
                    const totalTasks = challenge.tasks.length;
                    const progress = (completedTasks / totalTasks) * 100;

                    return (
                      <Paper
                        key={challenge.id}
                        sx={{
                          p: 3,
                          border: `2px solid ${theme.palette.divider}`,
                          transition: 'all 0.3s',
                          '&:hover': {
                            borderColor: theme.palette.primary.main,
                            boxShadow: theme.shadows[4],
                          },
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
                          <Avatar
                            sx={{
                              bgcolor: alpha(theme.palette.primary.main, 0.1),
                              color: theme.palette.primary.main,
                              width: 56,
                              height: 56,
                            }}
                          >
                            {challenge.icon}
                          </Avatar>
                          <Box sx={{ flex: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                              <Typography variant="h6" fontWeight={600}>
                                {challenge.title}
                              </Typography>
                              <Chip
                                label={challenge.difficulty}
                                size="small"
                                sx={{
                                  bgcolor: alpha(getDifficultyColor(challenge.difficulty), 0.1),
                                  color: getDifficultyColor(challenge.difficulty),
                                  fontWeight: 600,
                                }}
                              />
                            </Box>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              {challenge.description}
                            </Typography>
                            <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                              <Chip
                                icon={getCategoryIcon(challenge.category)}
                                label={challenge.category}
                                size="small"
                                variant="outlined"
                              />
                              <Chip
                                icon={<TrophyIcon />}
                                label={`${challenge.points} points`}
                                size="small"
                                variant="outlined"
                                color="warning"
                              />
                              <Chip
                                icon={<TimerIcon />}
                                label={`Due ${new Date(challenge.deadline).toLocaleDateString()}`}
                                size="small"
                                variant="outlined"
                              />
                            </Stack>
                          </Box>
                        </Box>

                        <Divider sx={{ my: 2 }} />

                        <Typography variant="subtitle2" gutterBottom>
                          Progress: {completedTasks}/{totalTasks} tasks
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={progress}
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            mb: 2,
                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                          }}
                        />

                        <List dense>
                          {challenge.tasks.map((task) => (
                            <ListItem key={task.id} disablePadding>
                              <ListItemIcon sx={{ minWidth: 36 }}>
                                <Checkbox
                                  edge="start"
                                  checked={task.completed}
                                  disabled
                                  icon={<UncheckedIcon />}
                                  checkedIcon={<CheckCircleIcon color="success" />}
                                />
                              </ListItemIcon>
                              <ListItemText
                                primary={task.description}
                                sx={{
                                  textDecoration: task.completed ? 'line-through' : 'none',
                                  opacity: task.completed ? 0.7 : 1,
                                }}
                              />
                            </ListItem>
                          ))}
                        </List>

                        <Button
                          variant="contained"
                          fullWidth
                          sx={{ mt: 2 }}
                          disabled={progress === 100}
                        >
                          {progress === 100 ? 'Completed' : 'Continue Challenge'}
                        </Button>
                      </Paper>
                    );
                  })}

                {challenges.filter((c) => c.status === 'locked').length > 0 && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="h6" gutterBottom>
                      Locked Challenges
                    </Typography>
                    {challenges
                      .filter((c) => c.status === 'locked')
                      .map((challenge) => (
                        <Paper
                          key={challenge.id}
                          sx={{
                            p: 3,
                            border: `2px dashed ${theme.palette.divider}`,
                            opacity: 0.6,
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar
                              sx={{
                                bgcolor: alpha(theme.palette.grey[500], 0.1),
                                color: theme.palette.grey[500],
                                width: 56,
                                height: 56,
                              }}
                            >
                              {challenge.icon}
                            </Avatar>
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="h6" fontWeight={600} gutterBottom>
                                {challenge.title}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Complete &quot;Budget Master&quot; challenge to unlock
                              </Typography>
                            </Box>
                            <Chip label="Locked" />
                          </Box>
                        </Paper>
                      ))}
                  </>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Stack spacing={3}>
            <Card>
              <CardHeader
                title="Rewards Earned"
                avatar={<StarIcon color="warning" />}
                subheader={`${rewards.length} achievements unlocked`}
              />
              <CardContent>
                <List>
                  {rewards.map((reward, index) => (
                    <Box key={reward.id}>
                      <ListItem sx={{ px: 0 }}>
                        <ListItemIcon>
                          <Avatar
                            sx={{
                              bgcolor: alpha(theme.palette.warning.main, 0.1),
                              color: theme.palette.warning.main,
                            }}
                          >
                            {reward.icon}
                          </Avatar>
                        </ListItemIcon>
                        <ListItemText
                          primary={reward.name}
                          secondary={
                            <>
                              <Typography variant="caption" display="block" color="text.secondary">
                                {reward.description}
                              </Typography>
                              <Chip
                                label={`+${reward.points} pts`}
                                size="small"
                                sx={{ mt: 0.5, height: 20 }}
                              />
                            </>
                          }
                        />
                      </ListItem>
                      {index < rewards.length - 1 && <Divider />}
                    </Box>
                  ))}
                </List>
              </CardContent>
            </Card>

            <Card>
              <CardHeader title="Class Leaderboard" avatar={<LeaderboardIcon color="primary" />} />
              <CardContent sx={{ p: 0 }}>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Rank</TableCell>
                        <TableCell>Name</TableCell>
                        <TableCell align="right">Points</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {leaderboard.map((entry) => (
                        <TableRow
                          key={entry.rank}
                          sx={{
                            bgcolor: entry.isCurrentUser
                              ? alpha(theme.palette.primary.main, 0.1)
                              : 'transparent',
                            fontWeight: entry.isCurrentUser ? 700 : 400,
                          }}
                        >
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {entry.rank <= 3 && (
                                <TrophyIcon
                                  sx={{
                                    fontSize: 20,
                                    color:
                                      entry.rank === 1
                                        ? '#FFD700'
                                        : entry.rank === 2
                                          ? '#C0C0C0'
                                          : '#CD7F32',
                                  }}
                                />
                              )}
                              <Typography fontWeight={entry.isCurrentUser ? 700 : 400}>
                                {entry.rank}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box>
                              <Typography
                                variant="body2"
                                fontWeight={entry.isCurrentUser ? 700 : 400}
                              >
                                {entry.name}
                              </Typography>
                              <Stack direction="row" spacing={0.5} sx={{ mt: 0.5 }}>
                                <Tooltip title="Challenges completed">
                                  <Chip
                                    icon={<CheckCircleIcon />}
                                    label={entry.challengesCompleted}
                                    size="small"
                                    sx={{ height: 18, fontSize: '0.65rem' }}
                                  />
                                </Tooltip>
                                <Tooltip title="Day streak">
                                  <Chip
                                    icon={<FireIcon />}
                                    label={entry.streak}
                                    size="small"
                                    sx={{ height: 18, fontSize: '0.65rem' }}
                                  />
                                </Tooltip>
                              </Stack>
                            </Box>
                          </TableCell>
                          <TableCell align="right">
                            <Typography
                              variant="body2"
                              fontWeight={entry.isCurrentUser ? 700 : 600}
                              color="primary"
                            >
                              {entry.points.toLocaleString()}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Box sx={{ textAlign: 'center' }}>
                  <TrendingUpIcon sx={{ fontSize: 48, color: theme.palette.success.main, mb: 1 }} />
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    Keep Going!
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Complete 2 more challenges to reach Rank #3
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>
    </Container>
  );
}

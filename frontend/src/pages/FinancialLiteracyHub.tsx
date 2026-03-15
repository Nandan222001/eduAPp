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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Slider,
  Paper,
  Stack,
  Tabs,
  Tab,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Divider,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import {
  School as SchoolIcon,
  TrendingUp as TrendingUpIcon,
  AccountBalance as BankIcon,
  CreditCard as CreditCardIcon,
  Home as HomeIcon,
  Lock as LockIcon,
  CheckCircle as CheckCircleIcon,
  PlayArrow as PlayIcon,
  EmojiEvents as TrophyIcon,
  Star as StarIcon,
  Calculate as CalculatorIcon,
  Close as CloseIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';

interface Module {
  id: number;
  title: string;
  description: string;
  topics: number;
  completed: number;
  level: number;
  locked: boolean;
  category: 'basics' | 'budgeting' | 'investing' | 'credit' | 'advanced';
  icon: React.ReactNode;
}

interface Lesson {
  id: number;
  title: string;
  type: 'video' | 'interactive' | 'quiz';
  duration: number;
  completed: boolean;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function FinancialLiteracyHub() {
  const theme = useTheme();
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [lessonDialogOpen, setLessonDialogOpen] = useState(false);
  const [calculatorDialogOpen, setCalculatorDialogOpen] = useState(false);
  const [scenarioDialogOpen, setScenarioDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  const [budgetData, setBudgetData] = useState({
    income: 1000,
    housing: 300,
    food: 200,
    transportation: 100,
    entertainment: 100,
    savings: 300,
  });

  const [investmentData, setInvestmentData] = useState({
    principal: 1000,
    monthlyContribution: 100,
    years: 10,
    returnRate: 7,
  });

  const [scenarioChoice, setScenarioChoice] = useState<string>('');

  const modules: Module[] = [
    {
      id: 1,
      title: 'Money Basics',
      description: 'Learn the fundamentals of money, earning, and spending',
      topics: 6,
      completed: 6,
      level: 1,
      locked: false,
      category: 'basics',
      icon: <SchoolIcon />,
    },
    {
      id: 2,
      title: 'Budgeting 101',
      description: 'Master the art of creating and managing budgets',
      topics: 8,
      completed: 5,
      level: 2,
      locked: false,
      category: 'budgeting',
      icon: <CalculatorIcon />,
    },
    {
      id: 3,
      title: 'Saving & Banking',
      description: 'Understand savings accounts, interest, and banking',
      topics: 7,
      completed: 3,
      level: 2,
      locked: false,
      category: 'basics',
      icon: <BankIcon />,
    },
    {
      id: 4,
      title: 'Introduction to Investing',
      description: 'Learn about stocks, bonds, and compound interest',
      topics: 10,
      completed: 0,
      level: 3,
      locked: false,
      category: 'investing',
      icon: <TrendingUpIcon />,
    },
    {
      id: 5,
      title: 'Credit & Debt',
      description: 'Understanding credit cards, loans, and responsible borrowing',
      topics: 9,
      completed: 0,
      level: 3,
      locked: true,
      category: 'credit',
      icon: <CreditCardIcon />,
    },
    {
      id: 6,
      title: 'Real Estate Decisions',
      description: 'Rent vs. Buy and understanding mortgages',
      topics: 8,
      completed: 0,
      level: 4,
      locked: true,
      category: 'advanced',
      icon: <HomeIcon />,
    },
  ];

  const lessons: Lesson[] = [
    { id: 1, title: 'What is a Budget?', type: 'video', duration: 5, completed: true },
    { id: 2, title: 'Budget Simulator', type: 'interactive', duration: 15, completed: true },
    { id: 3, title: 'Track Your Spending', type: 'video', duration: 7, completed: false },
    { id: 4, title: 'Budget Practice Quiz', type: 'quiz', duration: 10, completed: false },
  ];

  const calculateInvestmentReturn = () => {
    const { principal, monthlyContribution, years, returnRate } = investmentData;
    const monthlyRate = returnRate / 100 / 12;
    const months = years * 12;

    const futureValue =
      principal * Math.pow(1 + monthlyRate, months) +
      monthlyContribution * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);

    const totalContributed = principal + monthlyContribution * months;
    const totalReturn = futureValue - totalContributed;

    return { futureValue, totalContributed, totalReturn };
  };

  const renderBudgetSimulator = () => {
    const totalExpenses =
      budgetData.housing +
      budgetData.food +
      budgetData.transportation +
      budgetData.entertainment +
      budgetData.savings;
    const remaining = budgetData.income - totalExpenses;

    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          Monthly Budget Simulator
        </Typography>

        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" gutterBottom>
            Monthly Income: ${budgetData.income}
          </Typography>
          <Slider
            value={budgetData.income}
            onChange={(_, value) => setBudgetData({ ...budgetData, income: value as number })}
            min={500}
            max={5000}
            step={100}
            valueLabelDisplay="auto"
            sx={{ mb: 3 }}
          />
        </Box>

        <Grid container spacing={2}>
          {[
            { key: 'housing', label: 'Housing', color: theme.palette.primary.main },
            { key: 'food', label: 'Food', color: theme.palette.success.main },
            { key: 'transportation', label: 'Transportation', color: theme.palette.warning.main },
            { key: 'entertainment', label: 'Entertainment', color: theme.palette.secondary.main },
            { key: 'savings', label: 'Savings', color: theme.palette.info.main },
          ].map(({ key, label, color }) => (
            <Grid item xs={12} key={key}>
              <Typography variant="body2" gutterBottom>
                {label}: ${budgetData[key as keyof typeof budgetData]}
              </Typography>
              <Slider
                value={budgetData[key as keyof typeof budgetData] as number}
                onChange={(_, value) => setBudgetData({ ...budgetData, [key]: value as number })}
                min={0}
                max={budgetData.income}
                step={50}
                valueLabelDisplay="auto"
                sx={{ color }}
              />
            </Grid>
          ))}
        </Grid>

        <Paper
          sx={{
            p: 2,
            mt: 3,
            bgcolor:
              remaining >= 0
                ? alpha(theme.palette.success.main, 0.1)
                : alpha(theme.palette.error.main, 0.1),
          }}
        >
          <Typography variant="h6" color={remaining >= 0 ? 'success.main' : 'error.main'}>
            {remaining >= 0 ? 'Surplus' : 'Deficit'}: ${Math.abs(remaining)}
          </Typography>
          {remaining < 0 && (
            <Typography variant="body2" color="error" sx={{ mt: 1 }}>
              You&apos;re spending more than you earn! Adjust your budget.
            </Typography>
          )}
        </Paper>
      </Box>
    );
  };

  const renderInvestmentCalculator = () => {
    const { futureValue, totalContributed, totalReturn } = calculateInvestmentReturn();

    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          Investment Growth Calculator
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Initial Investment"
              type="number"
              value={investmentData.principal}
              onChange={(e) =>
                setInvestmentData({ ...investmentData, principal: Number(e.target.value) })
              }
              InputProps={{ startAdornment: '$' }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Monthly Contribution"
              type="number"
              value={investmentData.monthlyContribution}
              onChange={(e) =>
                setInvestmentData({
                  ...investmentData,
                  monthlyContribution: Number(e.target.value),
                })
              }
              InputProps={{ startAdornment: '$' }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" gutterBottom>
              Years: {investmentData.years}
            </Typography>
            <Slider
              value={investmentData.years}
              onChange={(_, value) =>
                setInvestmentData({ ...investmentData, years: value as number })
              }
              min={1}
              max={40}
              valueLabelDisplay="auto"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" gutterBottom>
              Annual Return: {investmentData.returnRate}%
            </Typography>
            <Slider
              value={investmentData.returnRate}
              onChange={(_, value) =>
                setInvestmentData({ ...investmentData, returnRate: value as number })
              }
              min={0}
              max={15}
              step={0.5}
              valueLabelDisplay="auto"
            />
          </Grid>
        </Grid>

        <Paper sx={{ p: 3, mt: 3, bgcolor: alpha(theme.palette.success.main, 0.05) }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <Typography variant="body2" color="text.secondary">
                Total Contributed
              </Typography>
              <Typography variant="h5" fontWeight={700}>
                ${totalContributed.toFixed(2)}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography variant="body2" color="text.secondary">
                Investment Return
              </Typography>
              <Typography variant="h5" fontWeight={700} color="success.main">
                +${totalReturn.toFixed(2)}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography variant="body2" color="text.secondary">
                Future Value
              </Typography>
              <Typography variant="h5" fontWeight={700} color="primary.main">
                ${futureValue.toFixed(2)}
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      </Box>
    );
  };

  const scenarios = [
    {
      id: 'credit-card-1',
      type: 'Credit Card',
      title: 'Credit Card Payment Decision',
      description:
        'You have a $500 credit card bill due. You have $600 in savings. What should you do?',
      options: [
        {
          id: 'a',
          text: 'Pay the minimum ($25) and keep the rest in savings',
          correct: false,
          explanation: 'This will result in high interest charges on the remaining balance.',
        },
        {
          id: 'b',
          text: 'Pay the full balance ($500)',
          correct: true,
          explanation:
            'This is the best choice to avoid interest charges while keeping some emergency savings.',
        },
        {
          id: 'c',
          text: 'Pay nothing this month',
          correct: false,
          explanation: 'This will hurt your credit score and result in late fees.',
        },
      ],
    },
    {
      id: 'rent-buy-1',
      type: 'Rent vs Buy',
      title: 'Housing Decision',
      description:
        'You earn $3,000/month. Rent for an apartment is $900/month. A house mortgage would be $1,200/month plus $300 maintenance. What should you choose?',
      options: [
        {
          id: 'a',
          text: 'Buy the house - it&apos;s an investment',
          correct: false,
          explanation: 'The total cost ($1,500) is 50% of your income, which is too high.',
        },
        {
          id: 'b',
          text: 'Rent the apartment',
          correct: true,
          explanation:
            'This keeps housing at 30% of income, leaving room for other expenses and savings.',
        },
        {
          id: 'c',
          text: 'Buy a cheaper house',
          correct: false,
          explanation: 'Good thinking, but based on the options given, renting is better now.',
        },
      ],
    },
  ];

  const renderScenarioDecisionMaking = () => {
    const currentScenario = scenarios[0];

    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          {currentScenario.title}
        </Typography>
        <Chip label={currentScenario.type} color="primary" size="small" sx={{ mb: 2 }} />

        <Paper sx={{ p: 2, mb: 3, bgcolor: alpha(theme.palette.info.main, 0.05) }}>
          <Typography variant="body1">{currentScenario.description}</Typography>
        </Paper>

        <Typography variant="subtitle2" gutterBottom>
          Choose the best option:
        </Typography>

        <ToggleButtonGroup
          value={scenarioChoice}
          exclusive
          onChange={(_, value) => setScenarioChoice(value)}
          orientation="vertical"
          sx={{ width: '100%', mb: 2 }}
        >
          {currentScenario.options.map((option) => (
            <ToggleButton
              key={option.id}
              value={option.id}
              sx={{
                justifyContent: 'flex-start',
                textAlign: 'left',
                p: 2,
                textTransform: 'none',
              }}
            >
              <Typography>{option.text}</Typography>
            </ToggleButton>
          ))}
        </ToggleButtonGroup>

        {scenarioChoice && (
          <Paper
            sx={{
              p: 2,
              bgcolor: currentScenario.options.find((o) => o.id === scenarioChoice)?.correct
                ? alpha(theme.palette.success.main, 0.1)
                : alpha(theme.palette.error.main, 0.1),
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
              {currentScenario.options.find((o) => o.id === scenarioChoice)?.correct ? (
                <>
                  <CheckCircleIcon color="success" />
                  <Typography variant="subtitle1" color="success.main" fontWeight={700}>
                    Correct!
                  </Typography>
                </>
              ) : (
                <>
                  <CloseIcon color="error" />
                  <Typography variant="subtitle1" color="error.main" fontWeight={700}>
                    Not quite
                  </Typography>
                </>
              )}
            </Stack>
            <Typography variant="body2">
              {currentScenario.options.find((o) => o.id === scenarioChoice)?.explanation}
            </Typography>
          </Paper>
        )}
      </Box>
    );
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'basics':
        return theme.palette.info.main;
      case 'budgeting':
        return theme.palette.success.main;
      case 'investing':
        return theme.palette.primary.main;
      case 'credit':
        return theme.palette.warning.main;
      case 'advanced':
        return theme.palette.secondary.main;
      default:
        return theme.palette.grey[500];
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Financial Literacy Hub
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Learn essential money skills through interactive lessons and real-world scenarios
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <Grid container spacing={3}>
            {modules.map((module) => (
              <Grid item xs={12} sm={6} key={module.id}>
                <Card
                  sx={{
                    height: '100%',
                    border: `2px solid ${module.locked ? theme.palette.divider : getCategoryColor(module.category)}`,
                    opacity: module.locked ? 0.6 : 1,
                    transition: 'all 0.3s',
                    '&:hover': !module.locked
                      ? {
                          transform: 'translateY(-4px)',
                          boxShadow: theme.shadows[4],
                        }
                      : {},
                  }}
                >
                  <CardHeader
                    avatar={
                      <Avatar
                        sx={{
                          bgcolor: alpha(getCategoryColor(module.category), 0.1),
                          color: getCategoryColor(module.category),
                        }}
                      >
                        {module.locked ? <LockIcon /> : module.icon}
                      </Avatar>
                    }
                    title={module.title}
                    subheader={`Level ${module.level} • ${module.topics} topics`}
                    action={
                      <Chip
                        label={`${module.completed}/${module.topics}`}
                        size="small"
                        color={module.completed === module.topics ? 'success' : 'default'}
                      />
                    }
                  />
                  <CardContent>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {module.description}
                    </Typography>

                    <Box sx={{ mt: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          Progress
                        </Typography>
                        <Typography variant="caption" fontWeight={600}>
                          {Math.round((module.completed / module.topics) * 100)}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={(module.completed / module.topics) * 100}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          bgcolor: alpha(getCategoryColor(module.category), 0.1),
                          '& .MuiLinearProgress-bar': {
                            bgcolor: getCategoryColor(module.category),
                          },
                        }}
                      />
                    </Box>

                    <Button
                      fullWidth
                      variant={module.completed === module.topics ? 'outlined' : 'contained'}
                      disabled={module.locked}
                      onClick={() => {
                        setSelectedModule(module);
                        setLessonDialogOpen(true);
                      }}
                      sx={{ mt: 2 }}
                      endIcon={module.locked ? <LockIcon /> : <ArrowForwardIcon />}
                    >
                      {module.locked
                        ? 'Locked'
                        : module.completed === module.topics
                          ? 'Review'
                          : 'Continue'}
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Stack spacing={3}>
            <Card>
              <CardHeader title="Interactive Tools" avatar={<CalculatorIcon color="primary" />} />
              <CardContent>
                <Stack spacing={2}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<CalculatorIcon />}
                    onClick={() => setCalculatorDialogOpen(true)}
                  >
                    Budget Simulator
                  </Button>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<TrendingUpIcon />}
                    onClick={() => setCalculatorDialogOpen(true)}
                  >
                    Investment Calculator
                  </Button>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<CreditCardIcon />}
                    onClick={() => setScenarioDialogOpen(true)}
                  >
                    Decision Scenarios
                  </Button>
                </Stack>
              </CardContent>
            </Card>

            <Card>
              <CardHeader title="Your Progress" avatar={<TrophyIcon color="warning" />} />
              <CardContent>
                <Box sx={{ textAlign: 'center', mb: 2 }}>
                  <Typography variant="h3" fontWeight={700} color="primary.main">
                    Level 2
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Financial Apprentice
                  </Typography>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Stack spacing={2}>
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Modules Completed</Typography>
                      <Typography variant="body2" fontWeight={600}>
                        2/6
                      </Typography>
                    </Box>
                    <LinearProgress variant="determinate" value={33} />
                  </Box>

                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Recent Achievements
                    </Typography>
                    <Stack direction="row" spacing={1}>
                      <Chip
                        icon={<StarIcon />}
                        label="Budget Master"
                        size="small"
                        color="warning"
                      />
                      <Chip icon={<StarIcon />} label="Saver" size="small" color="info" />
                    </Stack>
                  </Box>
                </Stack>
              </CardContent>
            </Card>

            <Card>
              <CardHeader title="Recommended Next" />
              <CardContent>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Based on your progress, we recommend:
                </Typography>
                <List>
                  <ListItem disablePadding>
                    <ListItemText primary="Complete Budgeting 101" secondary="3 topics remaining" />
                  </ListItem>
                  <ListItem disablePadding>
                    <ListItemText
                      primary="Start Introduction to Investing"
                      secondary="Unlock next level skills"
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>

      <Dialog
        open={lessonDialogOpen}
        onClose={() => setLessonDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedModule?.title}
          <IconButton
            onClick={() => setLessonDialogOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {selectedModule?.description}
          </Typography>

          <List>
            {lessons.map((lesson) => (
              <Box key={lesson.id}>
                <ListItem
                  sx={{
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 2,
                    mb: 1,
                  }}
                  secondaryAction={
                    <Button
                      variant={lesson.completed ? 'outlined' : 'contained'}
                      size="small"
                      startIcon={lesson.completed ? <CheckCircleIcon /> : <PlayIcon />}
                    >
                      {lesson.completed ? 'Review' : 'Start'}
                    </Button>
                  }
                >
                  <ListItemText
                    primary={lesson.title}
                    secondary={
                      <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                        <Chip label={lesson.type} size="small" />
                        <Chip label={`${lesson.duration} min`} size="small" variant="outlined" />
                      </Stack>
                    }
                  />
                </ListItem>
              </Box>
            ))}
          </List>
        </DialogContent>
      </Dialog>

      <Dialog
        open={calculatorDialogOpen}
        onClose={() => setCalculatorDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Interactive Tools
          <IconButton
            onClick={() => setCalculatorDialogOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 3 }}>
            <Tab label="Budget Simulator" />
            <Tab label="Investment Calculator" />
          </Tabs>

          <TabPanel value={activeTab} index={0}>
            {renderBudgetSimulator()}
          </TabPanel>

          <TabPanel value={activeTab} index={1}>
            {renderInvestmentCalculator()}
          </TabPanel>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCalculatorDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={scenarioDialogOpen}
        onClose={() => setScenarioDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Decision-Making Scenarios
          <IconButton
            onClick={() => setScenarioDialogOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>{renderScenarioDecisionMaking()}</DialogContent>
        <DialogActions>
          <Button onClick={() => setScenarioChoice('')}>Reset</Button>
          <Button onClick={() => setScenarioDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

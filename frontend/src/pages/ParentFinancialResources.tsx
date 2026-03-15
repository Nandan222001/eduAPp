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
  alpha,
  useTheme,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Paper,
  Stack,
  Avatar,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tab,
  Tabs,
  Divider,
} from '@mui/material';
import {
  ExpandMore as ExpandIcon,
  School as SchoolIcon,
  MenuBook as BookIcon,
  VideoLibrary as VideoIcon,
  Quiz as QuizIcon,
  Download as DownloadIcon,
  Chat as ChatIcon,
  TrendingUp as ProgressIcon,
  Lightbulb as TipIcon,
  Assignment as ActivityIcon,
  Print as PrintIcon,
  Share as ShareIcon,
  PlayCircle as PlayIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';

interface Resource {
  id: number;
  title: string;
  description: string;
  type: 'article' | 'video' | 'activity' | 'worksheet';
  topic: string;
  duration?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  icon: React.ReactNode;
}

interface ChildProgress {
  name: string;
  currentModule: string;
  score: number;
  recentActivity: string;
  recommendations: string[];
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

export default function ParentFinancialResources() {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [conversationDialogOpen, setConversationDialogOpen] = useState(false);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);

  const [childProgress] = useState<ChildProgress>({
    name: 'Emma Thompson',
    currentModule: 'Budgeting 101',
    score: 78,
    recentActivity: 'Completed "Budget Simulator" lesson',
    recommendations: [
      'Practice creating monthly budgets together',
      'Discuss wants vs needs when shopping',
      'Set up a savings jar for a specific goal',
    ],
  });

  const resources: Resource[] = [
    {
      id: 1,
      title: "Teaching Kids About Money: A Parent's Guide",
      description: 'Comprehensive guide to introducing financial concepts at home',
      type: 'article',
      topic: 'General',
      duration: '10 min read',
      difficulty: 'beginner',
      icon: <BookIcon />,
    },
    {
      id: 2,
      title: 'Family Budget Planning Activity',
      description: 'Interactive worksheet to plan a family budget together',
      type: 'activity',
      topic: 'Budgeting',
      duration: '30 min',
      difficulty: 'beginner',
      icon: <ActivityIcon />,
    },
    {
      id: 3,
      title: 'Understanding Allowances and Savings',
      description: 'Video guide on setting up allowance systems that teach money management',
      type: 'video',
      topic: 'Savings',
      duration: '15 min',
      difficulty: 'beginner',
      icon: <VideoIcon />,
    },
    {
      id: 4,
      title: 'Grocery Store Math Challenge',
      description: 'Turn shopping into a learning opportunity with this fun activity',
      type: 'worksheet',
      topic: 'Budgeting',
      duration: '45 min',
      difficulty: 'intermediate',
      icon: <ActivityIcon />,
    },
    {
      id: 5,
      title: 'Investment Basics for Families',
      description: 'Introduction to teaching kids about investing and compound growth',
      type: 'article',
      topic: 'Investing',
      duration: '12 min read',
      difficulty: 'intermediate',
      icon: <BookIcon />,
    },
  ];

  const conversationStarters = [
    {
      topic: 'Budgeting',
      question: 'What would you do if you had $100 to spend this month?',
      why: 'Helps children think about prioritizing expenses and saving',
    },
    {
      topic: 'Saving',
      question:
        'What&apos;s something you really want to buy? How long would it take to save for it?',
      why: 'Teaches goal-setting and delayed gratification',
    },
    {
      topic: 'Earning',
      question: 'How do you think people decide how much to pay someone for a job?',
      why: 'Introduces concepts of value and compensation',
    },
    {
      topic: 'Spending Wisely',
      question: 'Would you rather have one expensive toy or several small ones? Why?',
      why: 'Encourages thinking about value and trade-offs',
    },
  ];

  const weeklyTips = [
    {
      week: 'This Week',
      tip: "Set up a savings jar for your child's next goal",
      action: 'Have them track progress weekly',
    },
    {
      week: 'Next Week',
      tip: 'Practice comparing prices at the grocery store',
      action: 'Let them calculate savings from choosing generic brands',
    },
    {
      week: 'Week 3',
      tip: 'Discuss a recent family purchase decision',
      action: 'Explain the thought process behind it',
    },
  ];

  const activities = [
    {
      title: 'Lemonade Stand Simulation',
      description: 'Set up a pretend lemonade stand to teach pricing, profit, and expenses',
      materials: 'Paper, calculator, play money',
      duration: '1 hour',
    },
    {
      title: 'Shopping Budget Challenge',
      description:
        'Give your child a budget for a small shopping trip and help them stay within it',
      materials: 'Real or play money, shopping list',
      duration: '2 hours',
    },
    {
      title: 'Savings Goal Tracker',
      description: 'Create a visual tracker for a savings goal with weekly milestones',
      materials: 'Poster board, markers, stickers',
      duration: '30 minutes',
    },
  ];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return theme.palette.success.main;
      case 'intermediate':
        return theme.palette.warning.main;
      case 'advanced':
        return theme.palette.error.main;
      default:
        return theme.palette.grey[500];
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'article':
        return <BookIcon />;
      case 'video':
        return <VideoIcon />;
      case 'activity':
        return <ActivityIcon />;
      case 'worksheet':
        return <PrintIcon />;
      default:
        return <BookIcon />;
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Parent Resources
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Support your child&apos;s financial literacy journey at home
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card sx={{ mb: 3 }}>
            <CardHeader title="Your Child's Progress" avatar={<ProgressIcon color="primary" />} />
            <CardContent>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Paper sx={{ p: 2, bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Current Module
                    </Typography>
                    <Typography variant="h6" fontWeight={600}>
                      {childProgress.currentModule}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Paper sx={{ p: 2, bgcolor: alpha(theme.palette.success.main, 0.05) }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Health Score
                    </Typography>
                    <Typography variant="h6" fontWeight={600} color="success.main">
                      {childProgress.score}/100
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Recent Activity
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckIcon color="success" fontSize="small" />
                    <Typography variant="body2">{childProgress.recentActivity}</Typography>
                  </Box>
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />

              <Typography variant="subtitle2" gutterBottom>
                How You Can Help:
              </Typography>
              <List dense>
                {childProgress.recommendations.map((rec, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <TipIcon color="warning" />
                    </ListItemIcon>
                    <ListItemText primary={rec} />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>

          <Paper>
            <Tabs
              value={activeTab}
              onChange={(_, v) => setActiveTab(v)}
              sx={{ borderBottom: 1, borderColor: 'divider' }}
            >
              <Tab label="Learning Resources" />
              <Tab label="Activities" />
              <Tab label="Conversation Starters" />
            </Tabs>

            <TabPanel value={activeTab} index={0}>
              <Box sx={{ p: 2 }}>
                <Grid container spacing={2}>
                  {resources.map((resource) => (
                    <Grid item xs={12} key={resource.id}>
                      <Paper
                        sx={{
                          p: 2,
                          border: `1px solid ${theme.palette.divider}`,
                          transition: 'all 0.3s',
                          '&:hover': {
                            boxShadow: theme.shadows[4],
                            borderColor: theme.palette.primary.main,
                          },
                        }}
                      >
                        <Box sx={{ display: 'flex', gap: 2 }}>
                          <Avatar
                            sx={{
                              bgcolor: alpha(theme.palette.primary.main, 0.1),
                              color: theme.palette.primary.main,
                              width: 56,
                              height: 56,
                            }}
                          >
                            {getTypeIcon(resource.type)}
                          </Avatar>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="h6" fontWeight={600} gutterBottom>
                              {resource.title}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              {resource.description}
                            </Typography>
                            <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                              <Chip label={resource.type} size="small" variant="outlined" />
                              <Chip label={resource.topic} size="small" />
                              {resource.duration && (
                                <Chip label={resource.duration} size="small" variant="outlined" />
                              )}
                              <Chip
                                label={resource.difficulty}
                                size="small"
                                sx={{
                                  bgcolor: alpha(getDifficultyColor(resource.difficulty), 0.1),
                                  color: getDifficultyColor(resource.difficulty),
                                }}
                              />
                            </Stack>
                          </Box>
                          <Stack spacing={1}>
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={resource.type === 'video' ? <PlayIcon /> : <BookIcon />}
                              onClick={() => setSelectedResource(resource)}
                            >
                              {resource.type === 'video' ? 'Watch' : 'Read'}
                            </Button>
                            <Button variant="outlined" size="small" startIcon={<DownloadIcon />}>
                              Download
                            </Button>
                          </Stack>
                        </Box>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            </TabPanel>

            <TabPanel value={activeTab} index={1}>
              <Box sx={{ p: 2 }}>
                <Stack spacing={3}>
                  {activities.map((activity, index) => (
                    <Card key={index} variant="outlined">
                      <CardContent>
                        <Typography variant="h6" fontWeight={600} gutterBottom>
                          {activity.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" paragraph>
                          {activity.description}
                        </Typography>
                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={6}>
                            <Typography variant="caption" color="text.secondary">
                              Materials Needed:
                            </Typography>
                            <Typography variant="body2">{activity.materials}</Typography>
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <Typography variant="caption" color="text.secondary">
                              Duration:
                            </Typography>
                            <Typography variant="body2">{activity.duration}</Typography>
                          </Grid>
                        </Grid>
                        <Button
                          variant="contained"
                          size="small"
                          sx={{ mt: 2 }}
                          startIcon={<DownloadIcon />}
                        >
                          Download Activity Guide
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              </Box>
            </TabPanel>

            <TabPanel value={activeTab} index={2}>
              <Box sx={{ p: 2 }}>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Use these conversation starters to reinforce financial concepts at home. Each
                  question is designed to be age-appropriate and thought-provoking.
                </Typography>

                <Stack spacing={2}>
                  {conversationStarters.map((starter, index) => (
                    <Accordion key={index}>
                      <AccordionSummary expandIcon={<ExpandIcon />}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                          <ChatIcon color="primary" />
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="subtitle2" fontWeight={600}>
                              {starter.question}
                            </Typography>
                            <Chip label={starter.topic} size="small" sx={{ mt: 0.5 }} />
                          </Box>
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Paper sx={{ p: 2, bgcolor: alpha(theme.palette.info.main, 0.05) }}>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            display="block"
                            gutterBottom
                          >
                            Why this question matters:
                          </Typography>
                          <Typography variant="body2">{starter.why}</Typography>
                        </Paper>
                        <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                          <Button size="small" variant="outlined" startIcon={<ShareIcon />}>
                            Share with Teacher
                          </Button>
                          <Button size="small" variant="outlined" startIcon={<PrintIcon />}>
                            Print
                          </Button>
                        </Box>
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </Stack>

                <Button
                  fullWidth
                  variant="contained"
                  sx={{ mt: 3 }}
                  onClick={() => setConversationDialogOpen(true)}
                >
                  Get More Conversation Ideas
                </Button>
              </Box>
            </TabPanel>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Stack spacing={3}>
            <Card>
              <CardHeader title="Weekly Tips" avatar={<TipIcon color="warning" />} />
              <CardContent>
                <Stack spacing={2}>
                  {weeklyTips.map((tip, index) => (
                    <Paper
                      key={index}
                      sx={{
                        p: 2,
                        border: `1px solid ${theme.palette.divider}`,
                        bgcolor:
                          index === 0 ? alpha(theme.palette.warning.main, 0.05) : 'transparent',
                      }}
                    >
                      <Chip
                        label={tip.week}
                        size="small"
                        color={index === 0 ? 'warning' : 'default'}
                        sx={{ mb: 1 }}
                      />
                      <Typography variant="body2" fontWeight={600} gutterBottom>
                        {tip.tip}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {tip.action}
                      </Typography>
                    </Paper>
                  ))}
                </Stack>
              </CardContent>
            </Card>

            <Card>
              <CardHeader title="Quick Links" />
              <CardContent>
                <Stack spacing={1}>
                  <Button fullWidth variant="outlined" startIcon={<SchoolIcon />}>
                    View Learning Modules
                  </Button>
                  <Button fullWidth variant="outlined" startIcon={<ProgressIcon />}>
                    Full Progress Report
                  </Button>
                  <Button fullWidth variant="outlined" startIcon={<QuizIcon />}>
                    Practice Quizzes
                  </Button>
                  <Button fullWidth variant="outlined" startIcon={<ChatIcon />}>
                    Contact Teacher
                  </Button>
                </Stack>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Box sx={{ textAlign: 'center' }}>
                  <BookIcon sx={{ fontSize: 48, color: theme.palette.primary.main, mb: 1 }} />
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    Need More Help?
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Access our full library of parent resources and join our community forum
                  </Typography>
                  <Button variant="contained" fullWidth>
                    Explore Resource Library
                  </Button>
                </Box>
              </CardContent>
            </Card>

            <Card sx={{ bgcolor: alpha(theme.palette.success.main, 0.05) }}>
              <CardContent>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                  💡 Pro Tip
                </Typography>
                <Typography variant="body2">
                  Make financial learning a natural part of daily life. Involve your child in
                  age-appropriate money decisions and explain your thinking process.
                </Typography>
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>

      <Dialog
        open={conversationDialogOpen}
        onClose={() => setConversationDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Request Custom Conversation Starters</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Child's Current Learning Topic"
              placeholder="e.g., Budgeting, Saving, Investing"
            />
            <TextField
              fullWidth
              label="Specific Area of Interest"
              multiline
              rows={3}
              placeholder="What aspect of financial literacy would you like to discuss with your child?"
            />
            <TextField
              fullWidth
              label="Any Challenges?"
              multiline
              rows={2}
              placeholder="Are there any specific concepts your child finds difficult?"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConversationDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => setConversationDialogOpen(false)}>
            Get Personalized Suggestions
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(selectedResource)}
        onClose={() => setSelectedResource(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>{selectedResource?.title}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" paragraph>
            {selectedResource?.description}
          </Typography>
          <Paper sx={{ p: 3, bgcolor: alpha(theme.palette.grey[500], 0.05) }}>
            <Typography variant="body2" textAlign="center">
              {selectedResource?.type === 'video'
                ? 'Video player would appear here'
                : 'Article content would appear here'}
            </Typography>
          </Paper>
        </DialogContent>
        <DialogActions>
          <Button startIcon={<DownloadIcon />}>Download</Button>
          <Button startIcon={<ShareIcon />}>Share</Button>
          <Button onClick={() => setSelectedResource(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

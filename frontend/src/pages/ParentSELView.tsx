import { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Avatar,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  useTheme,
  alpha,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tabs,
  Tab,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Psychology as PsychologyIcon,
  EmojiPeople as EmojiPeopleIcon,
  Favorite as FavoriteIcon,
  Groups as GroupsIcon,
  QuestionMark as QuestionMarkIcon,
  ExpandMore as ExpandMoreIcon,
  TrendingUp as TrendingUpIcon,
  School as SchoolIcon,
  Home as HomeIcon,
  CheckCircle as CheckCircleIcon,
  LocalFireDepartment as FireIcon,
  SentimentVerySatisfied,
  SentimentSatisfied,
  SentimentNeutral,
  SentimentDissatisfied,
  SentimentVeryDissatisfied,
  Lightbulb as LightbulbIcon,
  FamilyRestroom as FamilyIcon,
  MenuBook as BookIcon,
  Psychology as BrainIcon,
} from '@mui/icons-material';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface SELCompetency {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  currentScore: number;
  previousScore: number;
  trend: 'up' | 'down' | 'stable';
}

interface TeacherObservation {
  id: number;
  date: Date;
  competency: string;
  rating: number;
  notes: string;
  context: string;
}

interface HomeActivity {
  id: number;
  competency: string;
  title: string;
  description: string;
  ageAppropriate: string;
  duration: string;
  materials: string[];
}

interface MoodData {
  date: string;
  mood: number;
}

const CHILD_DATA = {
  id: 1,
  name: 'Sarah Johnson',
  grade: '10',
  section: 'A',
  photo: undefined,
};

const SEL_COMPETENCIES: SELCompetency[] = [
  {
    id: 'self-awareness',
    name: 'Self-Awareness',
    icon: <PsychologyIcon />,
    color: '#9C27B0',
    currentScore: 78,
    previousScore: 66,
    trend: 'up',
  },
  {
    id: 'self-management',
    name: 'Self-Management',
    icon: <EmojiPeopleIcon />,
    color: '#2196F3',
    currentScore: 65,
    previousScore: 57,
    trend: 'up',
  },
  {
    id: 'social-awareness',
    name: 'Social Awareness',
    icon: <GroupsIcon />,
    color: '#4CAF50',
    currentScore: 82,
    previousScore: 67,
    trend: 'up',
  },
  {
    id: 'relationship-skills',
    name: 'Relationship Skills',
    icon: <FavoriteIcon />,
    color: '#FF5722',
    currentScore: 90,
    previousScore: 85,
    trend: 'up',
  },
  {
    id: 'responsible-decision',
    name: 'Responsible Decision-Making',
    icon: <QuestionMarkIcon />,
    color: '#FF9800',
    currentScore: 72,
    previousScore: 62,
    trend: 'up',
  },
];

const TEACHER_OBSERVATIONS: TeacherObservation[] = [
  {
    id: 1,
    date: new Date('2024-01-20'),
    competency: 'Relationship Skills',
    rating: 5,
    notes: 'Outstanding collaboration and communication with peers during group project',
    context: 'Team project',
  },
  {
    id: 2,
    date: new Date('2024-01-18'),
    competency: 'Social Awareness',
    rating: 4,
    notes: 'Showed empathy and understanding when a classmate was struggling',
    context: 'Class discussion',
  },
  {
    id: 3,
    date: new Date('2024-01-15'),
    competency: 'Self-Management',
    rating: 3,
    notes: 'Working on impulse control during transitions. Improving with reminders.',
    context: 'Classroom transition',
  },
];

const MOOD_DATA: MoodData[] = [
  { date: '1/14', mood: 4 },
  { date: '1/15', mood: 3 },
  { date: '1/16', mood: 5 },
  { date: '1/17', mood: 4 },
  { date: '1/18', mood: 4 },
  { date: '1/19', mood: 5 },
  { date: '1/20', mood: 5 },
];

const HOME_ACTIVITIES: HomeActivity[] = [
  {
    id: 1,
    competency: 'Self-Awareness',
    title: 'Feelings Journal',
    description:
      'Help your child keep a daily journal where they identify and name their emotions. Ask them to draw or write about what made them feel that way.',
    ageAppropriate: 'Ages 8-18',
    duration: '10-15 minutes daily',
    materials: ['Journal or notebook', 'Colored pencils or markers'],
  },
  {
    id: 2,
    competency: 'Self-Awareness',
    title: 'Strengths and Goals Discussion',
    description:
      'Have weekly conversations about what your child is good at and what they want to improve. Create a chart together tracking their progress.',
    ageAppropriate: 'Ages 10-18',
    duration: '20 minutes weekly',
    materials: ['Paper', 'Markers', 'Progress chart'],
  },
  {
    id: 3,
    competency: 'Self-Management',
    title: 'Breathing Buddy Practice',
    description:
      'Teach your child deep breathing exercises. Have them practice with a stuffed animal on their belly, watching it rise and fall with their breath.',
    ageAppropriate: 'Ages 5-12',
    duration: '5-10 minutes as needed',
    materials: ['Stuffed animal or breathing buddy', 'Quiet space'],
  },
  {
    id: 4,
    competency: 'Self-Management',
    title: 'Family Goal Board',
    description:
      'Create a family goal board where everyone, including your child, sets weekly goals. Review and celebrate achievements together.',
    ageAppropriate: 'Ages 8-18',
    duration: '15 minutes weekly',
    materials: ['Poster board', 'Sticky notes', 'Markers'],
  },
  {
    id: 5,
    competency: 'Social Awareness',
    title: 'Perspective Taking Games',
    description:
      'Play "What Would You Do?" scenarios where you discuss different peoples perspectives in various situations.',
    ageAppropriate: 'Ages 8-18',
    duration: '15-20 minutes',
    materials: ['Scenario cards (can make your own)'],
  },
  {
    id: 6,
    competency: 'Social Awareness',
    title: 'Gratitude Practice',
    description:
      'Start a family tradition of sharing three things youre grateful for at dinner. Encourage appreciation for others.',
    ageAppropriate: 'All ages',
    duration: '10 minutes daily',
    materials: ['None required', 'Optional: gratitude jar'],
  },
  {
    id: 7,
    competency: 'Relationship Skills',
    title: 'Active Listening Practice',
    description:
      'Practice active listening skills by having one person share about their day while others listen without interrupting, then reflect back what they heard.',
    ageAppropriate: 'Ages 8-18',
    duration: '15-20 minutes',
    materials: ['Timer (optional)'],
  },
  {
    id: 8,
    competency: 'Relationship Skills',
    title: 'Family Problem-Solving Time',
    description:
      'Set aside time to address conflicts or challenges. Model constructive communication and collaborative problem-solving.',
    ageAppropriate: 'Ages 10-18',
    duration: '20-30 minutes as needed',
    materials: ['Paper for brainstorming', 'Calm environment'],
  },
  {
    id: 9,
    competency: 'Responsible Decision-Making',
    title: 'Consequence Mapping',
    description:
      'When facing a decision, help your child map out possible choices and their potential consequences before acting.',
    ageAppropriate: 'Ages 10-18',
    duration: '15 minutes as needed',
    materials: ['Paper', 'Pencil'],
  },
  {
    id: 10,
    competency: 'Responsible Decision-Making',
    title: 'Family Decision Time',
    description:
      'Involve your child in age-appropriate family decisions. Discuss pros and cons together and explain your final choice.',
    ageAppropriate: 'Ages 8-18',
    duration: '20 minutes as needed',
    materials: ['None required'],
  },
];

const PARENTING_TIPS = [
  {
    category: 'Daily Support',
    tips: [
      'Model emotional awareness by sharing your own feelings: "I feel frustrated because..."',
      'Validate your childs emotions before problem-solving: "I can see youre really upset."',
      'Create a calm-down corner at home with comfort items and breathing tools',
      'Establish consistent routines to help with self-management',
      'Celebrate effort and progress, not just achievements',
    ],
  },
  {
    category: 'Communication',
    tips: [
      'Ask open-ended questions: "Tell me more about that" instead of yes/no questions',
      'Practice active listening by giving full attention during conversations',
      'Use "I notice..." statements instead of accusations: "I notice youre having trouble..."',
      'Have regular check-ins about feelings, even when things are going well',
      'Avoid dismissing emotions with "youre fine" or "dont cry"',
    ],
  },
  {
    category: 'Building Skills',
    tips: [
      'Let your child make age-appropriate choices to build decision-making skills',
      'Discuss characters emotions and choices when reading or watching shows together',
      'Encourage helping others and discuss how it feels to be kind',
      'Practice conflict resolution by walking through problems step-by-step',
      'Teach and model apologies and making amends',
    ],
  },
  {
    category: 'Working with School',
    tips: [
      'Stay in regular contact with your childs teacher about SEL progress',
      'Reinforce school SEL concepts at home when possible',
      'Share insights about your childs emotional life at home with teachers',
      'Attend parent workshops on social-emotional learning if offered',
      'Ask the teacher for specific ways to support SEL at home',
    ],
  },
];

interface SELOverviewProps {
  competencies: SELCompetency[];
}

function SELOverview({ competencies }: SELOverviewProps) {
  const theme = useTheme();

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    if (trend === 'up') return <TrendingUpIcon sx={{ color: 'success.main', fontSize: 16 }} />;
    return null;
  };

  return (
    <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
      <CardHeader
        title="SEL Competency Development"
        subheader="Your childs progress across key areas"
        avatar={<SchoolIcon color="primary" />}
      />
      <CardContent>
        <Grid container spacing={3}>
          {competencies.map((competency) => (
            <Grid item xs={12} md={6} key={competency.id}>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  border: `1px solid ${theme.palette.divider}`,
                  borderLeft: `4px solid ${competency.color}`,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Box sx={{ color: competency.color }}>{competency.icon}</Box>
                  <Typography variant="subtitle1" fontWeight={600}>
                    {competency.name}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 1,
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Current Score
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {getTrendIcon(competency.trend)}
                    <Typography variant="h6" fontWeight={700}>
                      {competency.currentScore}%
                    </Typography>
                    {competency.trend === 'up' && (
                      <Typography variant="caption" color="success.main">
                        (+{competency.currentScore - competency.previousScore}%)
                      </Typography>
                    )}
                  </Box>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={competency.currentScore}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    bgcolor: alpha(competency.color, 0.1),
                    '& .MuiLinearProgress-bar': {
                      bgcolor: competency.color,
                    },
                  }}
                />
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mt: 1, display: 'block' }}
                >
                  Previous: {competency.previousScore}%
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
}

interface MoodTrackerProps {
  moodData: MoodData[];
}

function MoodTracker({ moodData }: MoodTrackerProps) {
  const theme = useTheme();

  const getMoodIcon = (mood: number) => {
    switch (mood) {
      case 5:
        return <SentimentVerySatisfied sx={{ color: '#4caf50' }} />;
      case 4:
        return <SentimentSatisfied sx={{ color: '#8bc34a' }} />;
      case 3:
        return <SentimentNeutral sx={{ color: '#ffc107' }} />;
      case 2:
        return <SentimentDissatisfied sx={{ color: '#ff9800' }} />;
      case 1:
        return <SentimentVeryDissatisfied sx={{ color: '#f44336' }} />;
      default:
        return <SentimentNeutral />;
    }
  };

  const chartData = {
    labels: moodData.map((d) => d.date),
    datasets: [
      {
        label: 'Daily Mood',
        data: moodData.map((d) => d.mood),
        borderColor: theme.palette.primary.main,
        backgroundColor: alpha(theme.palette.primary.main, 0.1),
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        min: 1,
        max: 5,
        ticks: {
          stepSize: 1,
        },
      },
    },
  };

  const avgMood = moodData.reduce((sum, d) => sum + d.mood, 0) / moodData.length;

  return (
    <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
      <CardHeader
        title="Mood Tracker"
        subheader="Your childs daily check-ins"
        action={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {getMoodIcon(Math.round(avgMood))}
            <Typography variant="body2" color="text.secondary">
              Avg: {avgMood.toFixed(1)}
            </Typography>
          </Box>
        }
      />
      <CardContent>
        <Box sx={{ height: 250 }}>
          <Line data={chartData} options={chartOptions} />
        </Box>
        <Alert severity="info" sx={{ mt: 2 }}>
          Your child has been tracking their mood daily. Recent trends show consistent positive
          emotions.
        </Alert>
      </CardContent>
    </Card>
  );
}

interface TeacherObservationsProps {
  observations: TeacherObservation[];
}

function TeacherObservations({ observations }: TeacherObservationsProps) {
  const theme = useTheme();

  return (
    <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
      <CardHeader
        title="Teacher Observations"
        subheader="Recent SEL notes from the classroom"
        avatar={<SchoolIcon color="primary" />}
      />
      <CardContent>
        <List>
          {observations.map((obs, index) => (
            <Box key={obs.id}>
              <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle2" fontWeight={600}>
                          {obs.competency}
                        </Typography>
                        <Chip
                          label={`${obs.rating}/5`}
                          size="small"
                          color={
                            obs.rating >= 4 ? 'success' : obs.rating >= 3 ? 'warning' : 'error'
                          }
                        />
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        {obs.date.toLocaleDateString()}
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <>
                      <Chip label={obs.context} size="small" sx={{ mb: 1, fontSize: '0.7rem' }} />
                      <Typography variant="body2" color="text.secondary">
                        {obs.notes}
                      </Typography>
                    </>
                  }
                />
              </ListItem>
              {index < observations.length - 1 && <Divider />}
            </Box>
          ))}
        </List>
      </CardContent>
    </Card>
  );
}

interface HomeActivitiesProps {
  activities: HomeActivity[];
  selectedCompetency: string;
}

function HomeActivities({ activities, selectedCompetency }: HomeActivitiesProps) {
  const theme = useTheme();

  const filteredActivities =
    selectedCompetency === 'all'
      ? activities
      : activities.filter((a) => a.competency === selectedCompetency);

  return (
    <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
      <CardHeader
        title="Activities for Home"
        subheader="Support your childs SEL development at home"
        avatar={<HomeIcon color="primary" />}
      />
      <CardContent>
        <Grid container spacing={2}>
          {filteredActivities.map((activity) => (
            <Grid item xs={12} md={6} key={activity.id}>
              <Accordion elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box>
                    <Typography variant="subtitle2" fontWeight={600}>
                      {activity.title}
                    </Typography>
                    <Chip label={activity.competency} size="small" sx={{ mt: 0.5 }} />
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body2" paragraph>
                    {activity.description}
                  </Typography>
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      Age Range:
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {activity.ageAppropriate}
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      Duration:
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {activity.duration}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      Materials Needed:
                    </Typography>
                    <Box component="ul" sx={{ mt: 0.5, pl: 2, mb: 0 }}>
                      {activity.materials.map((material, idx) => (
                        <Typography
                          component="li"
                          variant="caption"
                          color="text.secondary"
                          key={idx}
                        >
                          {material}
                        </Typography>
                      ))}
                    </Box>
                  </Box>
                </AccordionDetails>
              </Accordion>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
}

interface ParentingTipsProps {
  tips: typeof PARENTING_TIPS;
}

function ParentingTips({ tips }: ParentingTipsProps) {
  const theme = useTheme();

  const categoryIcons: { [key: string]: React.ReactNode } = {
    'Daily Support': <FamilyIcon />,
    Communication: <BrainIcon />,
    'Building Skills': <LightbulbIcon />,
    'Working with School': <SchoolIcon />,
  };

  return (
    <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
      <CardHeader
        title="Parenting Tips & Strategies"
        subheader="Evidence-based approaches to support SEL at home"
        avatar={<BookIcon color="primary" />}
      />
      <CardContent>
        <Grid container spacing={2}>
          {tips.map((category, idx) => (
            <Grid item xs={12} md={6} key={idx}>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  border: `1px solid ${theme.palette.divider}`,
                  height: '100%',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1) }}>
                    {categoryIcons[category.category]}
                  </Avatar>
                  <Typography variant="h6" fontWeight={600}>
                    {category.category}
                  </Typography>
                </Box>
                <List dense>
                  {category.tips.map((tip, tipIdx) => (
                    <ListItem key={tipIdx} sx={{ px: 0, py: 0.5 }}>
                      <ListItemAvatar sx={{ minWidth: 32 }}>
                        <CheckCircleIcon sx={{ fontSize: 16, color: 'success.main' }} />
                      </ListItemAvatar>
                      <ListItemText primary={tip} primaryTypographyProps={{ variant: 'body2' }} />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
}

export default function ParentSELView() {
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [selectedCompetency, setSelectedCompetency] = useState('all');

  const competencyList = ['all', ...SEL_COMPETENCIES.map((c) => c.name)];

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          {CHILD_DATA.name}&apos;s SEL Journey
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Track your child&apos;s social-emotional development and discover ways to support them at
          home
        </Typography>
      </Box>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            elevation={0}
            sx={{
              border: `1px solid ${theme.palette.divider}`,
              background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`,
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: theme.palette.primary.main, width: 56, height: 56 }}>
                  <TrendingUpIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight={700}>
                    76%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Overall Progress
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            elevation={0}
            sx={{
              border: `1px solid ${theme.palette.divider}`,
              background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.1)} 0%, ${alpha(theme.palette.success.main, 0.05)} 100%)`,
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: theme.palette.success.main, width: 56, height: 56 }}>
                  <CheckCircleIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight={700}>
                    12
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Daily Check-ins
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            elevation={0}
            sx={{
              border: `1px solid ${theme.palette.divider}`,
              background: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.1)} 0%, ${alpha(theme.palette.warning.main, 0.05)} 100%)`,
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: theme.palette.warning.main, width: 56, height: 56 }}>
                  <FireIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight={700}>
                    7
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Day Streak
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            elevation={0}
            sx={{
              border: `1px solid ${theme.palette.divider}`,
              background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.1)} 0%, ${alpha(theme.palette.info.main, 0.05)} 100%)`,
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: theme.palette.info.main, width: 56, height: 56 }}>
                  <SchoolIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight={700}>
                    15
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Teacher Notes
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
          <Tab label="Overview" />
          <Tab label="Activities & Tips" />
          <Tab label="Progress Details" />
        </Tabs>
      </Box>

      {tabValue === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <SELOverview competencies={SEL_COMPETENCIES} />
          </Grid>
          <Grid item xs={12} md={6}>
            <MoodTracker moodData={MOOD_DATA} />
          </Grid>
          <Grid item xs={12} md={6}>
            <TeacherObservations observations={TEACHER_OBSERVATIONS} />
          </Grid>
        </Grid>
      )}

      {tabValue === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Box sx={{ mb: 3 }}>
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>Filter by Competency</InputLabel>
                <Select
                  value={selectedCompetency}
                  onChange={(e) => setSelectedCompetency(e.target.value)}
                  label="Filter by Competency"
                >
                  {competencyList.map((comp) => (
                    <MenuItem key={comp} value={comp}>
                      {comp === 'all' ? 'All Competencies' : comp}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <HomeActivities activities={HOME_ACTIVITIES} selectedCompetency={selectedCompetency} />
          </Grid>
          <Grid item xs={12}>
            <ParentingTips tips={PARENTING_TIPS} />
          </Grid>
        </Grid>
      )}

      {tabValue === 2 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <SELOverview competencies={SEL_COMPETENCIES} />
          </Grid>
          <Grid item xs={12}>
            <TeacherObservations observations={TEACHER_OBSERVATIONS} />
          </Grid>
          <Grid item xs={12}>
            <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
              <CardHeader
                title="Detailed Progress Report"
                subheader="Comprehensive SEL development analysis"
              />
              <CardContent>
                <Alert severity="success" sx={{ mb: 3 }}>
                  <Typography variant="body2" fontWeight={600} gutterBottom>
                    Overall Assessment: Strong Progress
                  </Typography>
                  <Typography variant="body2">
                    Your child is showing excellent growth in Relationship Skills and Social
                    Awareness. Self-Management is an area of focus, with targeted support from both
                    home and school.
                  </Typography>
                </Alert>

                {SEL_COMPETENCIES.map((competency) => (
                  <Paper
                    key={competency.id}
                    elevation={0}
                    sx={{
                      p: 2,
                      mb: 2,
                      border: `1px solid ${theme.palette.divider}`,
                      borderLeft: `4px solid ${competency.color}`,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Box sx={{ color: competency.color }}>{competency.icon}</Box>
                      <Typography variant="h6" fontWeight={600}>
                        {competency.name}
                      </Typography>
                      <Chip
                        label={`${competency.currentScore}%`}
                        size="small"
                        sx={{
                          bgcolor: alpha(competency.color, 0.1),
                          color: competency.color,
                        }}
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {competency.name === 'Relationship Skills'
                        ? 'Demonstrates exceptional ability to collaborate, communicate clearly, and build positive relationships with peers and adults.'
                        : competency.name === 'Social Awareness'
                          ? 'Shows strong empathy and understanding of others perspectives. Actively demonstrates respect and appreciation for diversity.'
                          : competency.name === 'Self-Management'
                            ? 'Working on emotional regulation and impulse control. Shows improvement with consistent support and practice.'
                            : competency.name === 'Self-Awareness'
                              ? 'Growing ability to identify and express emotions. Becoming more aware of personal strengths and areas for improvement.'
                              : 'Developing skills in considering consequences and making thoughtful choices. Continues to build ethical reasoning.'}
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={competency.currentScore}
                      sx={{
                        height: 6,
                        borderRadius: 3,
                        bgcolor: alpha(competency.color, 0.1),
                        '& .MuiLinearProgress-bar': {
                          bgcolor: competency.color,
                        },
                      }}
                    />
                  </Paper>
                ))}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
}

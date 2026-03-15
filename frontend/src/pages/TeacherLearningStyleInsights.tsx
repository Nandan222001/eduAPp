import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
  Paper,
  Chip,
  List,
  ListItem,
  ListItemText,
  useTheme,
  alpha,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Hearing as HearingIcon,
  TouchApp as TouchIcon,
  MenuBook as BookIcon,
  Group as GroupIcon,
  TipsAndUpdates as TipsIcon,
} from '@mui/icons-material';
import { Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import learningStyleApi from '@/api/learningStyle';
import { ClassLearningStyleDistribution } from '@/types/learningStyle';

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

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

const differentiationStrategies = {
  visual: [
    'Use diagrams, charts, and infographics',
    'Provide written instructions and notes',
    'Use color-coding for organization',
    'Show videos and demonstrations',
    'Use mind maps and concept maps',
  ],
  auditory: [
    'Encourage class discussions and debates',
    'Use verbal explanations and lectures',
    'Incorporate audio recordings and podcasts',
    'Use music and rhymes for memorization',
    'Provide opportunities for group presentations',
  ],
  kinesthetic: [
    'Include hands-on activities and experiments',
    'Use role-playing and simulations',
    'Incorporate movement and breaks',
    'Provide manipulatives and models',
    'Use real-world applications and field trips',
  ],
  reading_writing: [
    'Assign reading assignments and research',
    'Encourage note-taking and journaling',
    'Use written assignments and essays',
    'Provide handouts and study guides',
    'Use lists, definitions, and glossaries',
  ],
};

export default function TeacherLearningStyleInsights() {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState<number>(1);
  const [distribution, setDistribution] = useState<ClassLearningStyleDistribution | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadClassDistribution();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClass]);

  const loadClassDistribution = async () => {
    try {
      setLoading(true);
      const data = await learningStyleApi.getClassDistribution(selectedClass);
      setDistribution(data);
    } catch (err) {
      setError('Failed to load class distribution');
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

  if (!distribution) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Alert severity="error">{error || 'Distribution data not available'}</Alert>
      </Container>
    );
  }

  const doughnutData = {
    labels: ['Visual', 'Auditory', 'Kinesthetic', 'Reading/Writing'],
    datasets: [
      {
        data: [
          distribution.distribution.visual,
          distribution.distribution.auditory,
          distribution.distribution.kinesthetic,
          distribution.distribution.reading_writing,
        ],
        backgroundColor: [
          styleColors.visual,
          styleColors.auditory,
          styleColors.kinesthetic,
          styleColors.reading_writing,
        ],
        borderWidth: 2,
        borderColor: '#fff',
      },
    ],
  };

  const barData = {
    labels: ['Visual', 'Auditory', 'Kinesthetic', 'Reading/Writing'],
    datasets: [
      {
        label: 'Number of Students',
        data: [
          distribution.distribution.visual,
          distribution.distribution.auditory,
          distribution.distribution.kinesthetic,
          distribution.distribution.reading_writing,
        ],
        backgroundColor: [
          alpha(styleColors.visual, 0.8),
          alpha(styleColors.auditory, 0.8),
          alpha(styleColors.kinesthetic, 0.8),
          alpha(styleColors.reading_writing, 0.8),
        ],
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
    },
  };

  const getDominantStyle = () => {
    const dist = distribution.distribution;
    const styles = [
      { name: 'visual', count: dist.visual },
      { name: 'auditory', count: dist.auditory },
      { name: 'kinesthetic', count: dist.kinesthetic },
      { name: 'reading_writing', count: dist.reading_writing },
    ];
    return styles.sort((a, b) => b.count - a.count)[0];
  };

  const dominantStyle = getDominantStyle();

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', py: 4 }}>
      <Container maxWidth="xl">
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <GroupIcon sx={{ fontSize: 40, color: 'primary.main' }} />
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h4" fontWeight={700}>
                Learning Style Insights
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Understand your class distribution and differentiate instruction
              </Typography>
            </Box>
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Select Class</InputLabel>
              <Select
                value={selectedClass}
                label="Select Class"
                onChange={(e) => setSelectedClass(e.target.value as number)}
              >
                <MenuItem value={1}>Class 10-A</MenuItem>
                <MenuItem value={2}>Class 10-B</MenuItem>
                <MenuItem value={3}>Class 11-A</MenuItem>
                <MenuItem value={4}>Class 12-A</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Class Summary */}
          <Grid item xs={12}>
            <Paper
              elevation={2}
              sx={{
                p: 3,
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                color: 'white',
              }}
            >
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={3}>
                  <Typography variant="h3" fontWeight={700}>
                    {distribution.total_students}
                  </Typography>
                  <Typography variant="body1">Total Students</Typography>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Typography variant="h5" fontWeight={700} sx={{ textTransform: 'capitalize' }}>
                    {dominantStyle.name.replace('_', ' ')}
                  </Typography>
                  <Typography variant="body2">Dominant Learning Style</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    {distribution.class_name}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>
                    Use multiple teaching strategies to reach all learners
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Distribution Charts */}
          <Grid item xs={12} md={6}>
            <Card elevation={2}>
              <CardHeader title="Learning Style Distribution" />
              <CardContent>
                <Box sx={{ height: 300 }}>
                  <Doughnut data={doughnutData} options={chartOptions} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card elevation={2}>
              <CardHeader title="Student Count by Style" />
              <CardContent>
                <Box sx={{ height: 300 }}>
                  <Bar data={barData} options={chartOptions} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Style Breakdown */}
          <Grid item xs={12}>
            <Card elevation={2}>
              <CardHeader title="Detailed Breakdown" />
              <CardContent>
                <Grid container spacing={2}>
                  {Object.entries(distribution.distribution).map(([style, count]) => {
                    const percentage = ((count / distribution.total_students) * 100).toFixed(1);
                    return (
                      <Grid item xs={12} sm={6} md={3} key={style}>
                        <Paper
                          elevation={0}
                          sx={{
                            p: 2,
                            border: `1px solid ${theme.palette.divider}`,
                            borderLeft: `4px solid ${styleColors[style]}`,
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Avatar
                              sx={{
                                bgcolor: alpha(styleColors[style], 0.1),
                                color: styleColors[style],
                                width: 40,
                                height: 40,
                              }}
                            >
                              {styleIcons[style]}
                            </Avatar>
                            <Typography
                              variant="h6"
                              fontWeight={700}
                              sx={{ textTransform: 'capitalize' }}
                            >
                              {style.replace('_', ' ')}
                            </Typography>
                          </Box>
                          <Typography variant="h4" fontWeight={700} color="primary.main">
                            {count}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {percentage}% of class
                          </Typography>
                        </Paper>
                      </Grid>
                    );
                  })}
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Differentiation Strategies */}
          <Grid item xs={12}>
            <Card elevation={2}>
              <CardHeader
                title="Differentiation Strategies"
                avatar={<TipsIcon sx={{ color: theme.palette.warning.main }} />}
                subheader="Teaching approaches for different learning styles"
              />
              <CardContent>
                <Grid container spacing={2}>
                  {Object.entries(differentiationStrategies).map(([style, strategies]) => (
                    <Grid item xs={12} md={6} key={style}>
                      <Paper
                        elevation={0}
                        sx={{
                          p: 2,
                          border: `1px solid ${theme.palette.divider}`,
                          borderTop: `4px solid ${styleColors[style]}`,
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                          <Avatar
                            sx={{
                              bgcolor: alpha(styleColors[style], 0.1),
                              color: styleColors[style],
                              width: 32,
                              height: 32,
                            }}
                          >
                            {styleIcons[style]}
                          </Avatar>
                          <Typography
                            variant="h6"
                            fontWeight={600}
                            sx={{ textTransform: 'capitalize' }}
                          >
                            {style.replace('_', ' ')} Learners
                          </Typography>
                          <Chip
                            label={`${distribution.distribution[style as keyof typeof distribution.distribution]} students`}
                            size="small"
                          />
                        </Box>
                        <List dense>
                          {strategies.map((strategy, idx) => (
                            <ListItem key={idx} sx={{ px: 0 }}>
                              <ListItemText
                                primary={strategy}
                                primaryTypographyProps={{ variant: 'body2' }}
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

          {/* Class Recommendations */}
          <Grid item xs={12}>
            <Card elevation={2}>
              <CardHeader title="Recommendations for This Class" />
              <CardContent>
                <List>
                  {distribution.recommendations.map((rec, idx) => (
                    <ListItem key={idx}>
                      <ListItemText primary={rec} primaryTypographyProps={{ variant: 'body1' }} />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Student Table */}
          <Grid item xs={12}>
            <Card elevation={2}>
              <CardHeader title="Student Learning Styles" subheader="Individual student profiles" />
              <CardContent>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Student Name</TableCell>
                        <TableCell>Primary Style</TableCell>
                        <TableCell>Secondary Style</TableCell>
                        <TableCell>Preferred Formats</TableCell>
                        <TableCell>Assessment Date</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {/* Sample data - would come from API */}
                      {[
                        {
                          name: 'John Doe',
                          primary: 'visual',
                          secondary: 'reading_writing',
                          formats: ['video', 'article'],
                          date: '2024-01-15',
                        },
                        {
                          name: 'Jane Smith',
                          primary: 'auditory',
                          secondary: 'kinesthetic',
                          formats: ['audio', 'activity'],
                          date: '2024-01-16',
                        },
                        {
                          name: 'Bob Johnson',
                          primary: 'kinesthetic',
                          secondary: 'visual',
                          formats: ['activity', 'video'],
                          date: '2024-01-17',
                        },
                      ].map((student, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{student.name}</TableCell>
                          <TableCell>
                            <Chip
                              icon={styleIcons[student.primary]}
                              label={student.primary.replace('_', ' ')}
                              size="small"
                              sx={{
                                bgcolor: alpha(styleColors[student.primary], 0.1),
                                color: styleColors[student.primary],
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              icon={styleIcons[student.secondary]}
                              label={student.secondary.replace('_', ' ')}
                              size="small"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            {student.formats.map((format, i) => (
                              <Chip key={i} label={format} size="small" sx={{ mr: 0.5 }} />
                            ))}
                          </TableCell>
                          <TableCell>{new Date(student.date).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tabs,
  Tab,
  Rating,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  useTheme,
  alpha,
  Autocomplete,
  Stack,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Close as CloseIcon,
  Psychology as PsychologyIcon,
  EmojiPeople as EmojiPeopleIcon,
  Favorite as FavoriteIcon,
  Groups as GroupsIcon,
  QuestionMark as QuestionMarkIcon,
  Lightbulb as LightbulbIcon,
  CheckCircle as CheckCircleIcon,
  Assignment as AssignmentIcon,
} from '@mui/icons-material';

interface SELCompetency {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  description: string;
  behavioralIndicators: string[];
}

const SEL_COMPETENCIES: SELCompetency[] = [
  {
    id: 'self-awareness',
    name: 'Self-Awareness',
    icon: <PsychologyIcon />,
    color: '#9C27B0',
    description: 'Understanding emotions, thoughts, and values',
    behavioralIndicators: [
      'Identifies and names their emotions accurately',
      'Recognizes personal strengths and areas for growth',
      'Shows self-confidence in abilities',
      'Demonstrates awareness of thoughts and feelings',
    ],
  },
  {
    id: 'self-management',
    name: 'Self-Management',
    icon: <EmojiPeopleIcon />,
    color: '#2196F3',
    description: 'Managing emotions and behaviors effectively',
    behavioralIndicators: [
      'Controls impulses and delays gratification',
      'Manages stress effectively',
      'Shows self-discipline and motivation',
      'Sets and works toward goals',
    ],
  },
  {
    id: 'social-awareness',
    name: 'Social Awareness',
    icon: <GroupsIcon />,
    color: '#4CAF50',
    description: 'Understanding and empathizing with others',
    behavioralIndicators: [
      'Takes perspective of others',
      'Shows empathy and compassion',
      'Appreciates diversity',
      'Respects others and their property',
    ],
  },
  {
    id: 'relationship-skills',
    name: 'Relationship Skills',
    icon: <FavoriteIcon />,
    color: '#FF5722',
    description: 'Building healthy relationships',
    behavioralIndicators: [
      'Communicates clearly and effectively',
      'Listens actively to others',
      'Cooperates with peers',
      'Resolves conflicts constructively',
      'Seeks and offers help when needed',
    ],
  },
  {
    id: 'responsible-decision',
    name: 'Responsible Decision-Making',
    icon: <QuestionMarkIcon />,
    color: '#FF9800',
    description: 'Making constructive choices',
    behavioralIndicators: [
      'Considers consequences of actions',
      'Makes ethical and safe choices',
      'Evaluates benefits and consequences',
      'Reflects on decisions made',
    ],
  },
];

interface SELObservation {
  id: number;
  studentId: number;
  studentName: string;
  studentPhoto?: string;
  competencyId: string;
  rating: number;
  notes: string;
  context: string;
  timestamp: Date;
}

interface Student {
  id: number;
  name: string;
  photo?: string;
  grade: string;
  section: string;
}

interface ClassData {
  id: number;
  name: string;
  section: string;
  students: Student[];
}

const MOCK_CLASSES: ClassData[] = [
  {
    id: 1,
    name: 'Class 10',
    section: 'A',
    students: [
      { id: 1, name: 'John Doe', grade: '10', section: 'A' },
      { id: 2, name: 'Jane Smith', grade: '10', section: 'A' },
      { id: 3, name: 'Mike Johnson', grade: '10', section: 'A' },
      { id: 4, name: 'Sarah Williams', grade: '10', section: 'A' },
      { id: 5, name: 'David Brown', grade: '10', section: 'A' },
    ],
  },
  {
    id: 2,
    name: 'Class 10',
    section: 'B',
    students: [
      { id: 6, name: 'Emily Davis', grade: '10', section: 'B' },
      { id: 7, name: 'Alex Wilson', grade: '10', section: 'B' },
      { id: 8, name: 'Olivia Martinez', grade: '10', section: 'B' },
    ],
  },
];

const MOCK_OBSERVATIONS: SELObservation[] = [
  {
    id: 1,
    studentId: 1,
    studentName: 'John Doe',
    competencyId: 'self-awareness',
    rating: 4,
    notes: 'Excellent at identifying emotions and expressing feelings',
    context: 'Group discussion',
    timestamp: new Date('2024-01-20T10:30:00'),
  },
  {
    id: 2,
    studentId: 2,
    studentName: 'Jane Smith',
    competencyId: 'relationship-skills',
    rating: 5,
    notes: 'Outstanding collaboration and communication with peers',
    context: 'Team project',
    timestamp: new Date('2024-01-20T11:00:00'),
  },
  {
    id: 3,
    studentId: 1,
    studentName: 'John Doe',
    competencyId: 'self-management',
    rating: 3,
    notes: 'Needs support with impulse control during transitions',
    context: 'Classroom transition',
    timestamp: new Date('2024-01-19T09:15:00'),
  },
];

interface QuickCaptureDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (observation: Omit<SELObservation, 'id' | 'timestamp'>) => void;
  students: Student[];
}

function QuickCaptureDialog({ open, onClose, onSave, students }: QuickCaptureDialogProps) {
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedCompetency, setSelectedCompetency] = useState<string>('');
  const [rating, setRating] = useState<number>(3);
  const [notes, setNotes] = useState('');
  const [context, setContext] = useState('');

  const handleSave = () => {
    if (!selectedStudent || !selectedCompetency) return;

    onSave({
      studentId: selectedStudent.id,
      studentName: selectedStudent.name,
      studentPhoto: selectedStudent.photo,
      competencyId: selectedCompetency,
      rating,
      notes,
      context,
    });

    setSelectedStudent(null);
    setSelectedCompetency('');
    setRating(3);
    setNotes('');
    setContext('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Quick SEL Observation</Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={3} sx={{ mt: 0.5 }}>
          <Grid item xs={12}>
            <Autocomplete
              options={students}
              getOptionLabel={(option) => option.name}
              value={selectedStudent}
              onChange={(_, newValue) => setSelectedStudent(newValue)}
              renderInput={(params) => <TextField {...params} label="Select Student" required />}
              renderOption={(props, option) => (
                <Box component="li" {...props}>
                  <Avatar sx={{ mr: 2, width: 32, height: 32 }}>{option.name.charAt(0)}</Avatar>
                  {option.name}
                </Box>
              )}
            />
          </Grid>

          <Grid item xs={12}>
            <FormControl fullWidth required>
              <InputLabel>SEL Competency</InputLabel>
              <Select
                value={selectedCompetency}
                onChange={(e) => setSelectedCompetency(e.target.value)}
                label="SEL Competency"
              >
                {SEL_COMPETENCIES.map((competency) => (
                  <MenuItem key={competency.id} value={competency.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ color: competency.color }}>{competency.icon}</Box>
                      {competency.name}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {selectedCompetency && (
            <Grid item xs={12}>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  bgcolor: alpha(
                    SEL_COMPETENCIES.find((c) => c.id === selectedCompetency)?.color || '#000',
                    0.05
                  ),
                  border: `1px solid ${alpha(SEL_COMPETENCIES.find((c) => c.id === selectedCompetency)?.color || '#000', 0.2)}`,
                }}
              >
                <Typography variant="subtitle2" gutterBottom>
                  Behavioral Indicators:
                </Typography>
                <List dense>
                  {SEL_COMPETENCIES.find(
                    (c) => c.id === selectedCompetency
                  )?.behavioralIndicators.map((indicator, idx) => (
                    <ListItem key={idx} sx={{ py: 0.5 }}>
                      <ListItemText
                        primary={`• ${indicator}`}
                        primaryTypographyProps={{ variant: 'body2' }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Grid>
          )}

          <Grid item xs={12}>
            <Box>
              <Typography variant="body2" gutterBottom>
                Rating (1-5)
              </Typography>
              <Rating
                value={rating}
                onChange={(_, newValue) => setRating(newValue || 3)}
                size="large"
                max={5}
              />
              <Box sx={{ mt: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  1 = Needs Significant Support | 3 = Developing | 5 = Exemplary
                </Typography>
              </Box>
            </Box>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Context"
              placeholder="e.g., Group work, Recess, Class discussion"
              value={context}
              onChange={(e) => setContext(e.target.value)}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Notes"
              placeholder="Describe the observed behavior..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={!selectedStudent || !selectedCompetency}
        >
          Save Observation
        </Button>
      </DialogActions>
    </Dialog>
  );
}

interface SELHeatmapProps {
  observations: SELObservation[];
  students: Student[];
}

function SELHeatmap({ observations, students }: SELHeatmapProps) {
  const theme = useTheme();

  const getStudentCompetencyScore = (studentId: number, competencyId: string): number | null => {
    const studentObs = observations.filter(
      (obs) => obs.studentId === studentId && obs.competencyId === competencyId
    );
    if (studentObs.length === 0) return null;
    const avg = studentObs.reduce((sum, obs) => sum + obs.rating, 0) / studentObs.length;
    return avg;
  };

  const getScoreColor = (score: number | null): string => {
    if (score === null) return theme.palette.grey[100];
    if (score >= 4.5) return alpha(theme.palette.success.main, 0.8);
    if (score >= 3.5) return alpha(theme.palette.success.main, 0.5);
    if (score >= 2.5) return alpha(theme.palette.warning.main, 0.5);
    return alpha(theme.palette.error.main, 0.5);
  };

  return (
    <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
      <CardHeader title="Class SEL Heatmap" subheader="Competency distribution across students" />
      <CardContent>
        <Box sx={{ overflowX: 'auto' }}>
          <Box sx={{ minWidth: 700 }}>
            <Grid container spacing={0}>
              <Grid item xs={3}>
                <Box sx={{ p: 1, fontWeight: 600, bgcolor: theme.palette.grey[50] }}>Student</Box>
              </Grid>
              {SEL_COMPETENCIES.map((competency) => (
                <Grid item xs={1.8} key={competency.id}>
                  <Tooltip title={competency.name}>
                    <Box
                      sx={{
                        p: 1,
                        textAlign: 'center',
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        bgcolor: alpha(competency.color, 0.1),
                        color: competency.color,
                      }}
                    >
                      {competency.name.split(' ')[0]}
                    </Box>
                  </Tooltip>
                </Grid>
              ))}
            </Grid>

            {students.slice(0, 10).map((student) => (
              <Grid container spacing={0} key={student.id}>
                <Grid item xs={3}>
                  <Box
                    sx={{
                      p: 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      borderBottom: `1px solid ${theme.palette.divider}`,
                    }}
                  >
                    <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>
                      {student.name.charAt(0)}
                    </Avatar>
                    <Typography variant="body2" noWrap>
                      {student.name}
                    </Typography>
                  </Box>
                </Grid>
                {SEL_COMPETENCIES.map((competency) => {
                  const score = getStudentCompetencyScore(student.id, competency.id);
                  return (
                    <Grid item xs={1.8} key={competency.id}>
                      <Tooltip
                        title={
                          score
                            ? `${competency.name}: ${score.toFixed(1)}/5`
                            : 'No observations yet'
                        }
                      >
                        <Box
                          sx={{
                            p: 1,
                            textAlign: 'center',
                            bgcolor: getScoreColor(score),
                            borderBottom: `1px solid ${theme.palette.divider}`,
                            cursor: 'pointer',
                            '&:hover': {
                              opacity: 0.8,
                            },
                          }}
                        >
                          <Typography variant="body2" fontWeight={600}>
                            {score ? score.toFixed(1) : '-'}
                          </Typography>
                        </Box>
                      </Tooltip>
                    </Grid>
                  );
                })}
              </Grid>
            ))}
          </Box>
        </Box>

        <Box sx={{ mt: 3, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Typography variant="caption" color="text.secondary">
            Legend:
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box
              sx={{
                width: 20,
                height: 20,
                bgcolor: alpha(theme.palette.success.main, 0.8),
                borderRadius: 0.5,
              }}
            />
            <Typography variant="caption">Exemplary (4.5-5)</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box
              sx={{
                width: 20,
                height: 20,
                bgcolor: alpha(theme.palette.success.main, 0.5),
                borderRadius: 0.5,
              }}
            />
            <Typography variant="caption">Proficient (3.5-4.4)</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box
              sx={{
                width: 20,
                height: 20,
                bgcolor: alpha(theme.palette.warning.main, 0.5),
                borderRadius: 0.5,
              }}
            />
            <Typography variant="caption">Developing (2.5-3.4)</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box
              sx={{
                width: 20,
                height: 20,
                bgcolor: alpha(theme.palette.error.main, 0.5),
                borderRadius: 0.5,
              }}
            />
            <Typography variant="caption">Needs Support (&lt;2.5)</Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

interface InterventionRecommendationsProps {
  observations: SELObservation[];
  students: Student[];
}

function InterventionRecommendations({ observations, students }: InterventionRecommendationsProps) {
  const theme = useTheme();

  const getStudentsNeedingSupport = () => {
    const studentScores: {
      [studentId: number]: {
        student: Student;
        competencies: { competency: SELCompetency; avgScore: number }[];
      };
    } = {};

    students.forEach((student) => {
      SEL_COMPETENCIES.forEach((competency) => {
        const studentObs = observations.filter(
          (obs) => obs.studentId === student.id && obs.competencyId === competency.id
        );

        if (studentObs.length > 0) {
          const avgScore = studentObs.reduce((sum, obs) => sum + obs.rating, 0) / studentObs.length;

          if (avgScore < 3) {
            if (!studentScores[student.id]) {
              studentScores[student.id] = { student, competencies: [] };
            }
            studentScores[student.id].competencies.push({ competency, avgScore });
          }
        }
      });
    });

    return Object.values(studentScores);
  };

  const getInterventionStrategy = (competencyId: string): string[] => {
    const strategies: { [key: string]: string[] } = {
      'self-awareness': [
        'Use emotion charts and feeling wheels',
        'Practice mindfulness exercises',
        'Implement daily reflection journals',
        'Use "I feel..." sentence starters',
      ],
      'self-management': [
        'Teach deep breathing techniques',
        'Create a calming corner in classroom',
        'Use visual timers for transitions',
        'Implement goal-setting activities',
      ],
      'social-awareness': [
        'Role-playing different perspectives',
        'Read books about diverse characters',
        'Discuss current events with empathy focus',
        'Practice active listening exercises',
      ],
      'relationship-skills': [
        'Structured cooperative learning activities',
        'Peer mediation training',
        'Communication skills practice',
        'Team-building exercises',
      ],
      'responsible-decision': [
        'Use decision-making frameworks',
        'Analyze cause and effect scenarios',
        'Discuss ethical dilemmas',
        'Reflect on past decisions',
      ],
    };

    return strategies[competencyId] || [];
  };

  const studentsNeedingSupport = getStudentsNeedingSupport();

  return (
    <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
      <CardHeader
        title="Intervention Recommendations"
        subheader="Students who may benefit from additional support"
        avatar={<LightbulbIcon sx={{ color: theme.palette.warning.main }} />}
      />
      <CardContent>
        {studentsNeedingSupport.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CheckCircleIcon sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
            <Typography variant="body2" color="text.secondary">
              Great work! All students are showing strong SEL development.
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={2}>
            {studentsNeedingSupport.map(({ student, competencies }) => (
              <Grid item xs={12} md={6} key={student.id}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    border: `1px solid ${theme.palette.divider}`,
                    borderLeft: `4px solid ${theme.palette.warning.main}`,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Avatar src={student.photo}>{student.name.charAt(0)}</Avatar>
                    <Box>
                      <Typography variant="subtitle1" fontWeight={600}>
                        {student.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {student.grade} - Section {student.section}
                      </Typography>
                    </Box>
                  </Box>

                  {competencies.map(({ competency, avgScore }) => (
                    <Box key={competency.id} sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Box sx={{ color: competency.color }}>{competency.icon}</Box>
                        <Typography variant="body2" fontWeight={600}>
                          {competency.name}
                        </Typography>
                        <Chip
                          label={avgScore.toFixed(1)}
                          size="small"
                          sx={{
                            bgcolor: alpha(theme.palette.warning.main, 0.1),
                            color: theme.palette.warning.main,
                          }}
                        />
                      </Box>
                      <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                        Recommended Strategies:
                      </Typography>
                      <Box component="ul" sx={{ m: 0, pl: 2 }}>
                        {getInterventionStrategy(competency.id)
                          .slice(0, 2)
                          .map((strategy, idx) => (
                            <Typography
                              component="li"
                              variant="caption"
                              color="text.secondary"
                              key={idx}
                            >
                              {strategy}
                            </Typography>
                          ))}
                      </Box>
                    </Box>
                  ))}
                </Paper>
              </Grid>
            ))}
          </Grid>
        )}
      </CardContent>
    </Card>
  );
}

export default function SELTracking() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [quickCaptureOpen, setQuickCaptureOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassData>(MOCK_CLASSES[0]);
  const [observations, setObservations] = useState<SELObservation[]>(MOCK_OBSERVATIONS);
  const [filterCompetency, setFilterCompetency] = useState<string>('all');
  const [filterStudent, setFilterStudent] = useState<string>('all');

  const handleSaveObservation = (observation: Omit<SELObservation, 'id' | 'timestamp'>) => {
    const newObservation: SELObservation = {
      ...observation,
      id: observations.length + 1,
      timestamp: new Date(),
    };
    setObservations([newObservation, ...observations]);
  };

  const filteredObservations = observations.filter((obs) => {
    const competencyMatch = filterCompetency === 'all' || obs.competencyId === filterCompetency;
    const studentMatch = filterStudent === 'all' || obs.studentId === parseInt(filterStudent);
    return competencyMatch && studentMatch;
  });

  const getCompetencyStats = () => {
    return SEL_COMPETENCIES.map((competency) => {
      const competencyObs = observations.filter((obs) => obs.competencyId === competency.id);
      const avgRating =
        competencyObs.length > 0
          ? competencyObs.reduce((sum, obs) => sum + obs.rating, 0) / competencyObs.length
          : 0;
      return {
        ...competency,
        count: competencyObs.length,
        avgRating,
      };
    });
  };

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            SEL Tracking & Observation
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Track Social-Emotional Learning development across your class
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<AssignmentIcon />}
            onClick={() => navigate('/student-sel-journey')}
          >
            Student View
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setQuickCaptureOpen(true)}
          >
            Quick Capture
          </Button>
        </Stack>
      </Box>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel>Select Class</InputLabel>
            <Select
              value={selectedClass.id}
              onChange={(e) => {
                const classData = MOCK_CLASSES.find((c) => c.id === e.target.value);
                if (classData) setSelectedClass(classData);
              }}
              label="Select Class"
            >
              {MOCK_CLASSES.map((classData) => (
                <MenuItem key={classData.id} value={classData.id}>
                  {classData.name} - Section {classData.section}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={8}>
          <Card
            elevation={0}
            sx={{
              border: `1px solid ${theme.palette.divider}`,
              height: '100%',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <CardContent sx={{ width: '100%' }}>
              <Grid container spacing={2}>
                {getCompetencyStats().map((stat) => (
                  <Grid item xs={6} sm={2.4} key={stat.id}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Box sx={{ color: stat.color, mb: 0.5 }}>{stat.icon}</Box>
                      <Typography variant="h6" fontWeight={700}>
                        {stat.avgRating.toFixed(1)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" noWrap>
                        {stat.name.split(' ')[0]}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
          <Tab label="Recent Observations" />
          <Tab label="Class Heatmap" />
          <Tab label="Interventions" />
        </Tabs>
      </Box>

      {tabValue === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
              <CardHeader
                title="Recent Observations"
                subheader={`${filteredObservations.length} observations recorded`}
                action={
                  <Stack direction="row" spacing={1}>
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                      <InputLabel>Competency</InputLabel>
                      <Select
                        value={filterCompetency}
                        onChange={(e) => setFilterCompetency(e.target.value)}
                        label="Competency"
                      >
                        <MenuItem value="all">All Competencies</MenuItem>
                        {SEL_COMPETENCIES.map((comp) => (
                          <MenuItem key={comp.id} value={comp.id}>
                            {comp.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                      <InputLabel>Student</InputLabel>
                      <Select
                        value={filterStudent}
                        onChange={(e) => setFilterStudent(e.target.value)}
                        label="Student"
                      >
                        <MenuItem value="all">All Students</MenuItem>
                        {selectedClass.students.map((student) => (
                          <MenuItem key={student.id} value={student.id.toString()}>
                            {student.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Stack>
                }
              />
              <CardContent>
                <List>
                  {filteredObservations.map((obs, index) => {
                    const competency = SEL_COMPETENCIES.find((c) => c.id === obs.competencyId);
                    return (
                      <Box key={obs.id}>
                        <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                          <ListItemAvatar>
                            <Avatar src={obs.studentPhoto}>{obs.studentName.charAt(0)}</Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Box
                                sx={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  mb: 1,
                                }}
                              >
                                <Typography variant="subtitle1" fontWeight={600}>
                                  {obs.studentName}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {obs.timestamp.toLocaleDateString()} at{' '}
                                  {obs.timestamp.toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </Typography>
                              </Box>
                            }
                            secondary={
                              <>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                  <Box sx={{ color: competency?.color }}>{competency?.icon}</Box>
                                  <Typography variant="body2" fontWeight={600}>
                                    {competency?.name}
                                  </Typography>
                                  <Rating value={obs.rating} readOnly size="small" />
                                </Box>
                                {obs.context && (
                                  <Chip
                                    label={obs.context}
                                    size="small"
                                    sx={{ mb: 1, fontSize: '0.7rem' }}
                                  />
                                )}
                                <Typography variant="body2" color="text.secondary">
                                  {obs.notes}
                                </Typography>
                              </>
                            }
                          />
                        </ListItem>
                        {index < filteredObservations.length - 1 && <Divider />}
                      </Box>
                    );
                  })}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {tabValue === 1 && (
        <SELHeatmap observations={observations} students={selectedClass.students} />
      )}

      {tabValue === 2 && (
        <InterventionRecommendations
          observations={observations}
          students={selectedClass.students}
        />
      )}

      <QuickCaptureDialog
        open={quickCaptureOpen}
        onClose={() => setQuickCaptureOpen(false)}
        onSave={handleSaveObservation}
        students={selectedClass.students}
      />
    </Box>
  );
}

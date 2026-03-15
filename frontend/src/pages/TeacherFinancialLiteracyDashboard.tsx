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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Stack,
  Avatar,
  LinearProgress,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  Checkbox,
  ListItemText,
  List,
  ListItem,
  Divider,
  Tabs,
  Tab,
} from '@mui/material';
import {
  School as SchoolIcon,
  Assignment as AssignmentIcon,
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  Add as AddIcon,
  MoreVert as MoreIcon,
  Warning as WarningIcon,
  EmojiEvents as TrophyIcon,
  Analytics as AnalyticsIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

interface Student {
  id: number;
  name: string;
  score: number;
  modulesCompleted: number;
  totalModules: number;
  challengesCompleted: number;
  lastActive: string;
  status: 'excellent' | 'good' | 'needs-attention';
}

interface ModuleAssignment {
  id: number;
  moduleName: string;
  assignedTo: string[];
  dueDate: string;
  completionRate: number;
  status: 'active' | 'completed' | 'overdue';
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

export default function TeacherFinancialLiteracyDashboard() {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);

  const [students] = useState<Student[]>([
    {
      id: 1,
      name: 'Sarah Chen',
      score: 92,
      modulesCompleted: 5,
      totalModules: 6,
      challengesCompleted: 4,
      lastActive: '2024-01-15',
      status: 'excellent',
    },
    {
      id: 2,
      name: 'Michael Rodriguez',
      score: 85,
      modulesCompleted: 4,
      totalModules: 6,
      challengesCompleted: 3,
      lastActive: '2024-01-15',
      status: 'good',
    },
    {
      id: 3,
      name: 'Emma Thompson',
      score: 78,
      modulesCompleted: 4,
      totalModules: 6,
      challengesCompleted: 2,
      lastActive: '2024-01-14',
      status: 'good',
    },
    {
      id: 4,
      name: 'James Wilson',
      score: 65,
      modulesCompleted: 2,
      totalModules: 6,
      challengesCompleted: 1,
      lastActive: '2024-01-10',
      status: 'needs-attention',
    },
    {
      id: 5,
      name: 'Olivia Davis',
      score: 88,
      modulesCompleted: 5,
      totalModules: 6,
      challengesCompleted: 3,
      lastActive: '2024-01-15',
      status: 'excellent',
    },
    {
      id: 6,
      name: 'Liam Brown',
      score: 72,
      modulesCompleted: 3,
      totalModules: 6,
      challengesCompleted: 2,
      lastActive: '2024-01-13',
      status: 'good',
    },
  ]);

  const [assignments] = useState<ModuleAssignment[]>([
    {
      id: 1,
      moduleName: 'Budgeting 101',
      assignedTo: ['All Students'],
      dueDate: '2024-01-20',
      completionRate: 83,
      status: 'active',
    },
    {
      id: 2,
      moduleName: 'Introduction to Investing',
      assignedTo: ['Sarah Chen', 'Emma Thompson', 'Olivia Davis'],
      dueDate: '2024-01-25',
      completionRate: 33,
      status: 'active',
    },
    {
      id: 3,
      moduleName: 'Money Basics',
      assignedTo: ['All Students'],
      dueDate: '2024-01-10',
      completionRate: 100,
      status: 'completed',
    },
  ]);

  const classAverageScore = Math.round(
    students.reduce((sum, s) => sum + s.score, 0) / students.length
  );
  const totalStudents = students.length;
  const activeStudents = students.filter((s) => {
    const lastActive = new Date(s.lastActive);
    const daysSince = Math.floor(
      (new Date().getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysSince <= 7;
  }).length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent':
        return theme.palette.success.main;
      case 'good':
        return theme.palette.info.main;
      case 'needs-attention':
        return theme.palette.warning.main;
      default:
        return theme.palette.grey[500];
    }
  };

  const moduleCompletionData = {
    labels: [
      'Money Basics',
      'Budgeting 101',
      'Saving & Banking',
      'Investing',
      'Credit & Debt',
      'Real Estate',
    ],
    datasets: [
      {
        label: 'Completion Rate',
        data: [100, 83, 67, 33, 17, 0],
        backgroundColor: alpha(theme.palette.primary.main, 0.8),
      },
    ],
  };

  const scoreDistributionData = {
    labels: ['0-60', '61-70', '71-80', '81-90', '91-100'],
    datasets: [
      {
        label: 'Number of Students',
        data: [1, 0, 2, 1, 2],
        backgroundColor: [
          alpha(theme.palette.error.main, 0.8),
          alpha(theme.palette.warning.main, 0.8),
          alpha(theme.palette.info.main, 0.8),
          alpha(theme.palette.success.main, 0.8),
          alpha(theme.palette.primary.main, 0.8),
        ],
      },
    ],
  };

  const progressOverTimeData = {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    datasets: [
      {
        label: 'Class Average Score',
        data: [65, 72, 78, classAverageScore],
        borderColor: theme.palette.primary.main,
        backgroundColor: alpha(theme.palette.primary.main, 0.1),
        tension: 0.4,
      },
    ],
  };

  const modules = [
    'Money Basics',
    'Budgeting 101',
    'Saving & Banking',
    'Introduction to Investing',
    'Credit & Debt',
    'Real Estate Decisions',
  ];

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Financial Literacy Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Monitor student progress and assign learning modules
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setAssignDialogOpen(true)}
        >
          Assign Module
        </Button>
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
                <Typography variant="h6">Class Average</Typography>
                <TrendingUpIcon sx={{ fontSize: 40, color: theme.palette.primary.main }} />
              </Box>
              <Typography variant="h3" fontWeight={700} color="primary.main">
                {classAverageScore}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Financial Health Score
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
                <Typography variant="h6">Total Students</Typography>
                <PeopleIcon sx={{ fontSize: 40, color: theme.palette.info.main }} />
              </Box>
              <Typography variant="h3" fontWeight={700} color="info.main">
                {totalStudents}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {activeStudents} active this week
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
                <Typography variant="h6">Assignments</Typography>
                <AssignmentIcon sx={{ fontSize: 40, color: theme.palette.success.main }} />
              </Box>
              <Typography variant="h3" fontWeight={700} color="success.main">
                {assignments.filter((a) => a.status === 'active').length}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Active assignments
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
                <Typography variant="h6">Avg Completion</Typography>
                <SchoolIcon sx={{ fontSize: 40, color: theme.palette.warning.main }} />
              </Box>
              <Typography variant="h3" fontWeight={700} color="warning.main">
                67%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Module completion rate
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Paper>
            <Tabs
              value={activeTab}
              onChange={(_, v) => setActiveTab(v)}
              sx={{ borderBottom: 1, borderColor: 'divider' }}
            >
              <Tab label="Student Progress" />
              <Tab label="Module Analytics" />
              <Tab label="Assignments" />
            </Tabs>

            <TabPanel value={activeTab} index={0}>
              <Box sx={{ p: 2 }}>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Student Name</TableCell>
                        <TableCell>Health Score</TableCell>
                        <TableCell>Modules Progress</TableCell>
                        <TableCell>Challenges</TableCell>
                        <TableCell>Last Active</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {students.map((student) => (
                        <TableRow key={student.id} hover>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Avatar
                                sx={{
                                  bgcolor: alpha(getStatusColor(student.status), 0.1),
                                  color: getStatusColor(student.status),
                                }}
                              >
                                {student.name
                                  .split(' ')
                                  .map((n) => n[0])
                                  .join('')}
                              </Avatar>
                              <Typography fontWeight={600}>{student.name}</Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="h6" fontWeight={700} color="primary">
                              {student.score}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ minWidth: 200 }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="body2">
                                  {student.modulesCompleted}/{student.totalModules}
                                </Typography>
                                <Typography variant="body2" fontWeight={600}>
                                  {Math.round(
                                    (student.modulesCompleted / student.totalModules) * 100
                                  )}
                                  %
                                </Typography>
                              </Box>
                              <LinearProgress
                                variant="determinate"
                                value={(student.modulesCompleted / student.totalModules) * 100}
                                sx={{ height: 6, borderRadius: 3 }}
                              />
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip
                              icon={<TrophyIcon />}
                              label={student.challengesCompleted}
                              size="small"
                              color="warning"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {new Date(student.lastActive).toLocaleDateString()}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={student.status.replace('-', ' ')}
                              size="small"
                              sx={{
                                bgcolor: alpha(getStatusColor(student.status), 0.1),
                                color: getStatusColor(student.status),
                                fontWeight: 600,
                                textTransform: 'capitalize',
                              }}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <IconButton size="small" onClick={(e) => setAnchorEl(e.currentTarget)}>
                              <MoreIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            </TabPanel>

            <TabPanel value={activeTab} index={1}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardHeader title="Module Completion Rates" />
                    <CardContent>
                      <Bar
                        data={moduleCompletionData}
                        options={{
                          responsive: true,
                          plugins: {
                            legend: {
                              display: false,
                            },
                          },
                          scales: {
                            y: {
                              beginAtZero: true,
                              max: 100,
                            },
                          },
                        }}
                      />
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Card>
                    <CardHeader title="Score Distribution" />
                    <CardContent>
                      <Bar
                        data={scoreDistributionData}
                        options={{
                          responsive: true,
                          plugins: {
                            legend: {
                              display: false,
                            },
                          },
                          scales: {
                            y: {
                              beginAtZero: true,
                              ticks: {
                                stepSize: 1,
                              },
                            },
                          },
                        }}
                      />
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12}>
                  <Card>
                    <CardHeader title="Progress Over Time" />
                    <CardContent>
                      <Line
                        data={progressOverTimeData}
                        options={{
                          responsive: true,
                          plugins: {
                            legend: {
                              display: false,
                            },
                          },
                          scales: {
                            y: {
                              beginAtZero: false,
                              min: 60,
                              max: 100,
                            },
                          },
                        }}
                      />
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12}>
                  <Card>
                    <CardHeader
                      title="Students Needing Attention"
                      avatar={<WarningIcon color="warning" />}
                    />
                    <CardContent>
                      <List>
                        {students
                          .filter((s) => s.status === 'needs-attention')
                          .map((student) => (
                            <ListItem key={student.id}>
                              <ListItemText
                                primary={student.name}
                                secondary={`Score: ${student.score} | ${student.modulesCompleted}/${student.totalModules} modules completed`}
                              />
                              <Button variant="outlined" size="small">
                                Send Reminder
                              </Button>
                            </ListItem>
                          ))}
                      </List>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </TabPanel>

            <TabPanel value={activeTab} index={2}>
              <Box sx={{ p: 2 }}>
                <Stack spacing={3}>
                  {assignments.map((assignment) => (
                    <Paper
                      key={assignment.id}
                      sx={{
                        p: 3,
                        border: `1px solid ${theme.palette.divider}`,
                      }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          mb: 2,
                        }}
                      >
                        <Box>
                          <Typography variant="h6" fontWeight={600} gutterBottom>
                            {assignment.moduleName}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Assigned to: {assignment.assignedTo.join(', ')}
                          </Typography>
                        </Box>
                        <Chip
                          label={assignment.status}
                          size="small"
                          color={
                            assignment.status === 'completed'
                              ? 'success'
                              : assignment.status === 'overdue'
                                ? 'error'
                                : 'default'
                          }
                          sx={{ textTransform: 'capitalize' }}
                        />
                      </Box>

                      <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            Completion Rate
                          </Typography>
                          <Typography variant="body2" fontWeight={600}>
                            {assignment.completionRate}%
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={assignment.completionRate}
                          sx={{ height: 8, borderRadius: 4 }}
                        />
                      </Box>

                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <Typography variant="caption" color="text.secondary">
                          Due: {new Date(assignment.dueDate).toLocaleDateString()}
                        </Typography>
                        <Stack direction="row" spacing={1}>
                          <Button size="small" variant="outlined">
                            View Details
                          </Button>
                          <IconButton size="small">
                            <MoreIcon />
                          </IconButton>
                        </Stack>
                      </Box>
                    </Paper>
                  ))}
                </Stack>
              </Box>
            </TabPanel>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardHeader title="Quick Actions" avatar={<AnalyticsIcon color="primary" />} />
            <CardContent>
              <Stack direction="row" spacing={2}>
                <Button variant="outlined" startIcon={<DownloadIcon />}>
                  Export Class Report
                </Button>
                <Button variant="outlined" startIcon={<AssignmentIcon />}>
                  View All Assignments
                </Button>
                <Button variant="outlined" startIcon={<TrendingUpIcon />}>
                  Generate Progress Report
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Dialog
        open={assignDialogOpen}
        onClose={() => setAssignDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Assign Learning Module</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Select Module</InputLabel>
              <Select label="Select Module">
                {modules.map((module) => (
                  <MenuItem key={module} value={module}>
                    {module}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Assign To</InputLabel>
              <Select
                multiple
                value={selectedStudents}
                onChange={(e) => setSelectedStudents(e.target.value as number[])}
                renderValue={(selected) =>
                  selected.length === students.length
                    ? 'All Students'
                    : `${selected.length} students selected`
                }
              >
                <MenuItem value="all">
                  <Checkbox checked={selectedStudents.length === students.length} />
                  <ListItemText primary="All Students" />
                </MenuItem>
                <Divider />
                {students.map((student) => (
                  <MenuItem key={student.id} value={student.id}>
                    <Checkbox checked={selectedStudents.includes(student.id)} />
                    <ListItemText primary={student.name} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField fullWidth label="Due Date" type="date" InputLabelProps={{ shrink: true }} />

            <TextField
              fullWidth
              label="Instructions (Optional)"
              multiline
              rows={3}
              placeholder="Add any specific instructions for students..."
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => setAssignDialogOpen(false)}>
            Assign Module
          </Button>
        </DialogActions>
      </Dialog>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
        <MenuItem onClick={() => setAnchorEl(null)}>View Details</MenuItem>
        <MenuItem onClick={() => setAnchorEl(null)}>Send Message</MenuItem>
        <MenuItem onClick={() => setAnchorEl(null)}>Export Report</MenuItem>
      </Menu>
    </Container>
  );
}

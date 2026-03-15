import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  TextField,
  MenuItem,
  Paper,
  LinearProgress,
  Stack,
  Avatar,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  alpha,
} from '@mui/material';
import {
  Download as DownloadIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon,
  Groups as GroupsIcon,
  Email as EmailIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import communityServiceApi from '@/api/communityService';
import { GraduationRequirementProgress, ServiceStats } from '@/types/communityService';

export default function AdminGraduationRequirementDashboard() {
  const [students, setStudents] = useState<GraduationRequirementProgress[]>([]);
  const [stats, setStats] = useState<ServiceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [gradeFilter, setGradeFilter] = useState<string>('');
  const [atRiskFilter, setAtRiskFilter] = useState<boolean | undefined>(undefined);
  const [selectedStudent, setSelectedStudent] = useState<GraduationRequirementProgress | null>(
    null
  );
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [requiredHours, setRequiredHours] = useState(0);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [progressData, statsData] = await Promise.all([
        communityServiceApi.getGraduationProgress({
          grade: gradeFilter || undefined,
          at_risk: atRiskFilter,
        }),
        communityServiceApi.getServiceStats(),
      ]);
      setStudents(progressData);
      setStats(statsData);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setError('Failed to load graduation requirement data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gradeFilter, atRiskFilter]);

  const handleEditRequirement = (student: GraduationRequirementProgress) => {
    setSelectedStudent(student);
    setRequiredHours(student.required_hours);
    setNotes(student.notes || '');
    setEditDialogOpen(true);
  };

  const handleSaveRequirement = async () => {
    if (!selectedStudent) return;

    try {
      await communityServiceApi.updateRequiredHours(
        selectedStudent.student_id,
        requiredHours,
        notes
      );
      setEditDialogOpen(false);
      await fetchData();
    } catch (err) {
      console.error('Failed to update requirement:', err);
      alert('Failed to update requirement');
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'success';
    if (percentage >= 75) return 'info';
    if (percentage >= 50) return 'warning';
    return 'error';
  };

  const atRiskStudents = students.filter((s) => s.is_at_risk);

  if (loading) {
    return (
      <Box
        sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight={700}>
          Graduation Requirement Dashboard
        </Typography>
        <Button variant="outlined" startIcon={<DownloadIcon />}>
          Export Report
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Total Students
                  </Typography>
                  <Typography variant="h4" fontWeight={700}>
                    {stats?.total_students || 0}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1) }}>
                  <GroupsIcon color="primary" />
                </Avatar>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Completion Rate
                  </Typography>
                  <Typography variant="h4" fontWeight={700} color="success.main">
                    {stats?.completion_rate.toFixed(1) || 0}%
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: (theme) => alpha(theme.palette.success.main, 0.1) }}>
                  <CheckCircleIcon color="success" />
                </Avatar>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    At-Risk Students
                  </Typography>
                  <Typography variant="h4" fontWeight={700} color="error.main">
                    {atRiskStudents.length}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: (theme) => alpha(theme.palette.error.main, 0.1) }}>
                  <WarningIcon color="error" />
                </Avatar>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Total Hours Logged
                  </Typography>
                  <Typography variant="h4" fontWeight={700}>
                    {stats?.total_hours.toLocaleString() || 0}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: (theme) => alpha(theme.palette.info.main, 0.1) }}>
                  <TrendingUpIcon color="info" />
                </Avatar>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* At-Risk Alert */}
      {atRiskStudents.length > 0 && (
        <Alert severity="warning" icon={<WarningIcon />} sx={{ mb: 3 }}>
          <Typography variant="subtitle2" fontWeight={600}>
            {atRiskStudents.length} student{atRiskStudents.length !== 1 ? 's are' : ' is'} at risk
            of not meeting graduation requirements
          </Typography>
          <Typography variant="body2">
            These students need immediate attention and support to complete their community service
            hours.
          </Typography>
        </Alert>
      )}

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4} md={3}>
            <TextField
              fullWidth
              select
              label="Filter by Grade"
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value)}
              size="small"
            >
              <MenuItem value="">All Grades</MenuItem>
              <MenuItem value="9">Grade 9</MenuItem>
              <MenuItem value="10">Grade 10</MenuItem>
              <MenuItem value="11">Grade 11</MenuItem>
              <MenuItem value="12">Grade 12</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={4} md={3}>
            <TextField
              fullWidth
              select
              label="Filter by Status"
              value={atRiskFilter === undefined ? '' : atRiskFilter ? 'at-risk' : 'on-track'}
              onChange={(e) => {
                if (e.target.value === '') setAtRiskFilter(undefined);
                else setAtRiskFilter(e.target.value === 'at-risk');
              }}
              size="small"
            >
              <MenuItem value="">All Students</MenuItem>
              <MenuItem value="on-track">On Track</MenuItem>
              <MenuItem value="at-risk">At Risk</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </Paper>

      {/* Students Table */}
      <Card>
        <CardHeader title="Student Progress" subheader={`${students.length} students`} />
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Student Name</TableCell>
                <TableCell>Grade</TableCell>
                <TableCell align="right">Required</TableCell>
                <TableCell align="right">Completed</TableCell>
                <TableCell align="right">Pending</TableCell>
                <TableCell>Progress</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Last Activity</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {students.map((student) => (
                <TableRow
                  key={student.student_id}
                  sx={{
                    bgcolor: student.is_at_risk
                      ? (theme) => alpha(theme.palette.error.main, 0.05)
                      : 'transparent',
                  }}
                >
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {student.is_at_risk && (
                        <Tooltip title="At Risk">
                          <WarningIcon color="error" fontSize="small" />
                        </Tooltip>
                      )}
                      <Typography variant="body2" fontWeight={600}>
                        {student.student_name}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{student.grade}</TableCell>
                  <TableCell align="right">{student.required_hours} hrs</TableCell>
                  <TableCell align="right">
                    <Typography
                      variant="body2"
                      fontWeight={600}
                      color={student.percentage_complete >= 100 ? 'success.main' : 'text.primary'}
                    >
                      {student.completed_hours} hrs
                    </Typography>
                  </TableCell>
                  <TableCell align="right">{student.pending_hours} hrs</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 150 }}>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(student.percentage_complete, 100)}
                        color={getProgressColor(student.percentage_complete)}
                        sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
                      />
                      <Typography variant="caption" fontWeight={600}>
                        {student.percentage_complete.toFixed(0)}%
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    {student.percentage_complete >= 100 ? (
                      <Chip
                        size="small"
                        label="Completed"
                        color="success"
                        icon={<CheckCircleIcon />}
                      />
                    ) : student.is_at_risk ? (
                      <Chip size="small" label="At Risk" color="error" icon={<WarningIcon />} />
                    ) : student.is_on_track ? (
                      <Chip size="small" label="On Track" color="info" />
                    ) : (
                      <Chip size="small" label="Needs Attention" color="warning" />
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">
                      {student.last_activity_date
                        ? format(parseISO(student.last_activity_date), 'MMM d, yyyy')
                        : 'No activity'}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                      <Tooltip title="View Details">
                        <IconButton size="small">
                          <ViewIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit Requirement">
                        <IconButton size="small" onClick={() => handleEditRequirement(student)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Send Reminder">
                        <IconButton size="small">
                          <EmailIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {students.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <AssessmentIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              No students found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Try adjusting your filters
            </Typography>
          </Box>
        )}
      </Card>

      {/* Edit Requirement Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Graduation Requirement</DialogTitle>
        <DialogContent>
          {selectedStudent && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Typography variant="body2">
                Student: <strong>{selectedStudent.student_name}</strong>
              </Typography>
              <TextField
                fullWidth
                label="Required Hours"
                type="number"
                value={requiredHours}
                onChange={(e) => setRequiredHours(parseInt(e.target.value) || 0)}
                inputProps={{ min: 0 }}
              />
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                helperText="Add any special notes or considerations for this student"
              />
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveRequirement}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

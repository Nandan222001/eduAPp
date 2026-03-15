import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Avatar,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  CircularProgress,
  Alert,
  useTheme,
  alpha,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FileUpload as FileUploadIcon,
  FilterList as FilterListIcon,
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import studentsApi, { Student } from '@/api/students';
import { isDemoUser, demoDataApi } from '@/api/demoDataApi';

export default function StudentList() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [classFilter, setClassFilter] = useState<string>('');
  const [sectionFilter, setSectionFilter] = useState<string>('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = isDemoUser()
        ? await demoDataApi.institutionAdmin.getStudentList({
            skip: page * rowsPerPage,
            limit: rowsPerPage,
            search: search || undefined,
            status: statusFilter,
          })
        : await studentsApi.listStudents({
            skip: page * rowsPerPage,
            limit: rowsPerPage,
            search: search || undefined,
            status: statusFilter,
          });
      setStudents(response.items);
      setTotal(response.total);
      setError(null);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || 'Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage, search, statusFilter, classFilter, sectionFilter]);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, student: Student) => {
    setAnchorEl(event.currentTarget);
    setSelectedStudent(student);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleView = () => {
    if (selectedStudent) {
      navigate(`/admin/users/students/${selectedStudent.id}`);
    }
    handleMenuClose();
  };

  const handleEdit = () => {
    if (selectedStudent) {
      navigate(`/admin/users/students/${selectedStudent.id}/edit`);
    }
    handleMenuClose();
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleDeleteConfirm = async () => {
    if (!selectedStudent) return;

    try {
      if (!isDemoUser()) {
        await studentsApi.deleteStudent(selectedStudent.id);
      }
      setDeleteDialogOpen(false);
      setSelectedStudent(null);
      fetchStudents();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || 'Failed to delete student');
    }
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'default';
      case 'graduated':
        return 'info';
      case 'transferred':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Students
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your institution&apos;s student roster
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<FileUploadIcon />}
            onClick={() => navigate('/admin/users/students/bulk-import')}
          >
            Import
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/admin/users/students/new')}
          >
            Add Student
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
        <Box sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField
            placeholder="Search students..."
            size="small"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ flexGrow: 1, maxWidth: 400 }}
          />
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Class</InputLabel>
            <Select
              value={classFilter}
              label="Class"
              onChange={(e) => {
                setClassFilter(e.target.value);
                setPage(0);
              }}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="6">6th Grade</MenuItem>
              <MenuItem value="7">7th Grade</MenuItem>
              <MenuItem value="8">8th Grade</MenuItem>
              <MenuItem value="9">9th Grade</MenuItem>
              <MenuItem value="10">10th Grade</MenuItem>
              <MenuItem value="11">11th Grade</MenuItem>
              <MenuItem value="12">12th Grade</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Section</InputLabel>
            <Select
              value={sectionFilter}
              label="Section"
              onChange={(e) => {
                setSectionFilter(e.target.value);
                setPage(0);
              }}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="A">A</MenuItem>
              <MenuItem value="B">B</MenuItem>
              <MenuItem value="C">C</MenuItem>
              <MenuItem value="D">D</MenuItem>
              <MenuItem value="E">E</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            startIcon={<FilterListIcon />}
            onClick={() => {
              setStatusFilter(statusFilter === 'active' ? undefined : 'active');
              setPage(0);
            }}
          >
            {statusFilter === 'active' ? 'Active Only' : 'All'}
          </Button>
          <IconButton onClick={fetchStudents}>
            <RefreshIcon />
          </IconButton>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Student</TableCell>
                    <TableCell>Admission No.</TableCell>
                    <TableCell>Class/Section</TableCell>
                    <TableCell>Roll No.</TableCell>
                    <TableCell>Parent Contact</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {students.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        <Typography variant="body2" color="text.secondary" py={4}>
                          No students found
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    students.map((student) => (
                      <TableRow
                        key={student.id}
                        hover
                        sx={{ cursor: 'pointer' }}
                        onClick={() => navigate(`/admin/users/students/${student.id}`)}
                      >
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar
                              src={student.photo_url}
                              sx={{
                                bgcolor: alpha(theme.palette.primary.main, 0.1),
                                color: theme.palette.primary.main,
                              }}
                            >
                              {getInitials(student.first_name, student.last_name)}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight={600}>
                                {student.first_name} {student.last_name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {student.email || '-'}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{student.admission_number || '-'}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {student.section
                              ? `${student.section.grade?.name || ''} - ${student.section.name}`
                              : '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{student.roll_number || '-'}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{student.parent_phone || '-'}</Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={student.status}
                            color={getStatusColor(student.status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <IconButton
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMenuOpen(e, student);
                            }}
                          >
                            <MoreVertIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50]}
              component="div"
              count={total}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </>
        )}
      </Paper>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={handleView}>
          <VisibilityIcon sx={{ mr: 1 }} fontSize="small" />
          View
        </MenuItem>
        <MenuItem onClick={handleEdit}>
          <EditIcon sx={{ mr: 1 }} fontSize="small" />
          Edit
        </MenuItem>
        <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 1 }} fontSize="small" />
          Delete
        </MenuItem>
      </Menu>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Delete Student
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Are you sure you want to delete {selectedStudent?.first_name}{' '}
            {selectedStudent?.last_name}? This action cannot be undone.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
            <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="contained" color="error" onClick={handleDeleteConfirm}>
              Delete
            </Button>
          </Box>
        </Box>
      </Dialog>
    </Box>
  );
}

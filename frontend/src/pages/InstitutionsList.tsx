import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  TextField,
  InputAdornment,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  TableSortLabel,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import superAdminApi, { InstitutionListItem } from '@/api/superAdmin';

type SortField = 'name' | 'created_at' | 'total_users' | 'revenue';
type SortOrder = 'asc' | 'desc';

export default function InstitutionsList() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [institutions, setInstitutions] = useState<InstitutionListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');
  const [sortBy, setSortBy] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  useEffect(() => {
    fetchInstitutions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage, statusFilter, planFilter, sortBy, sortOrder]);

  const fetchInstitutions = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await superAdminApi.listInstitutions({
        page: page + 1,
        page_size: rowsPerPage,
        search: search || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter,
        plan: planFilter === 'all' ? undefined : planFilter,
        sort_by: sortBy,
        sort_order: sortOrder,
      });
      setInstitutions(response.items);
      setTotal(response.total);
    } catch (err) {
      setError('Failed to load institutions. Please try again.');
      console.error('Error fetching institutions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(0);
    fetchInstitutions();
  };

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const getStatusChip = (status: string | null, isActive: boolean) => {
    if (!isActive) {
      return <Chip label="Inactive" color="default" size="small" icon={<CancelIcon />} />;
    }

    if (!status) {
      return <Chip label="No Subscription" color="default" size="small" />;
    }

    const statusConfig: Record<
      string,
      { color: 'success' | 'info' | 'error' | 'warning'; icon: React.ReactElement }
    > = {
      active: { color: 'success', icon: <CheckCircleIcon /> },
      trial: { color: 'info', icon: <ScheduleIcon /> },
      expired: { color: 'error', icon: <CancelIcon /> },
      cancelled: { color: 'warning', icon: <WarningIcon /> },
    };

    const config = statusConfig[status.toLowerCase()] || {
      color: 'info' as const,
      icon: <ScheduleIcon />,
    };

    return (
      <Chip
        label={status.charAt(0).toUpperCase() + status.slice(1)}
        color={config.color}
        size="small"
        icon={config.icon}
      />
    );
  };

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Institutions Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage all institutions across the platform
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          size="large"
          onClick={() => navigate('/super-admin/institutions/create')}
        >
          Add Institution
        </Button>
      </Box>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Stack spacing={2}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField
              placeholder="Search by name, slug, or domain..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ flex: 1 }}
            />
            <Button variant="contained" onClick={handleSearch}>
              Search
            </Button>
          </Stack>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="Status"
              >
                <MenuItem value="all">All Statuses</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </Select>
            </FormControl>

            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Plan</InputLabel>
              <Select
                value={planFilter}
                onChange={(e) => setPlanFilter(e.target.value)}
                label="Plan"
              >
                <MenuItem value="all">All Plans</MenuItem>
                <MenuItem value="Basic">Basic</MenuItem>
                <MenuItem value="Pro">Pro</MenuItem>
                <MenuItem value="Enterprise">Enterprise</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </Stack>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper>
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
                    <TableCell>
                      <TableSortLabel
                        active={sortBy === 'name'}
                        direction={sortBy === 'name' ? sortOrder : 'asc'}
                        onClick={() => handleSort('name')}
                      >
                        Institution Name
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>Domain</TableCell>
                    <TableCell>Plan</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">
                      <TableSortLabel
                        active={sortBy === 'total_users'}
                        direction={sortBy === 'total_users' ? sortOrder : 'asc'}
                        onClick={() => handleSort('total_users')}
                      >
                        Users
                      </TableSortLabel>
                    </TableCell>
                    <TableCell align="right">Revenue (₹)</TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={sortBy === 'created_at'}
                        direction={sortBy === 'created_at' ? sortOrder : 'asc'}
                        onClick={() => handleSort('created_at')}
                      >
                        Created
                      </TableSortLabel>
                    </TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {institutions.map((institution) => (
                    <TableRow key={institution.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {institution.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {institution.slug}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{institution.domain || '-'}</Typography>
                      </TableCell>
                      <TableCell>
                        {institution.subscription_plan ? (
                          <Chip
                            label={institution.subscription_plan}
                            size="small"
                            variant="outlined"
                          />
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        {getStatusChip(institution.subscription_status, institution.is_active)}
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2">
                          {institution.active_users} / {institution.total_users}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          active
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        {institution.total_revenue > 0
                          ? `₹${institution.total_revenue.toLocaleString()}`
                          : '-'}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {new Date(institution.created_at).toLocaleDateString()}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          onClick={() => navigate(`/super-admin/institutions/${institution.id}`)}
                          color="primary"
                        >
                          <ViewIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() =>
                            navigate(`/super-admin/institutions/${institution.id}/edit`)
                          }
                          color="primary"
                        >
                          <EditIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={total}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              rowsPerPageOptions={[10, 20, 50, 100]}
            />
          </>
        )}
      </Paper>
    </Box>
  );
}

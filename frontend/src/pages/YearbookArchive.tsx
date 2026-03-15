import { useState } from 'react';
import {
  Box,
  Typography,
  Container,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Button,
  TextField,
  InputAdornment,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Stack,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
  alpha,
  Avatar,
  Divider,
} from '@mui/material';
import {
  Search as SearchIcon,
  Download as DownloadIcon,
  Visibility as ViewIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
  CalendarToday as CalendarIcon,
  People as PeopleIcon,
  MenuBook as BookIcon,
  Close as CloseIcon,
  Login as LoginIcon,
} from '@mui/icons-material';
import { ArchivedYearbook } from '@/types/yearbook';

const mockArchivedYearbooks: ArchivedYearbook[] = [
  {
    id: 1,
    year: '2023-2024',
    title: 'Memories Forever',
    coverImage: 'https://via.placeholder.com/400x500/1976d2/ffffff?text=2024',
    totalPages: 120,
    schoolName: 'Lincoln High School',
    accessLevel: 'public',
    viewCount: 1543,
    downloadCount: 234,
  },
  {
    id: 2,
    year: '2022-2023',
    title: 'Journey Together',
    coverImage: 'https://via.placeholder.com/400x500/2e7d32/ffffff?text=2023',
    totalPages: 115,
    schoolName: 'Lincoln High School',
    accessLevel: 'alumni',
    viewCount: 2341,
    downloadCount: 456,
  },
  {
    id: 3,
    year: '2021-2022',
    title: 'Rising Strong',
    coverImage: 'https://via.placeholder.com/400x500/ed6c02/ffffff?text=2022',
    totalPages: 110,
    schoolName: 'Lincoln High School',
    accessLevel: 'alumni',
    viewCount: 1876,
    downloadCount: 321,
  },
  {
    id: 4,
    year: '2020-2021',
    title: 'Unstoppable Spirit',
    coverImage: 'https://via.placeholder.com/400x500/9c27b0/ffffff?text=2021',
    totalPages: 105,
    schoolName: 'Lincoln High School',
    accessLevel: 'restricted',
    viewCount: 1234,
    downloadCount: 189,
  },
  {
    id: 5,
    year: '2019-2020',
    title: 'Boundless Dreams',
    coverImage: 'https://via.placeholder.com/400x500/d32f2f/ffffff?text=2020',
    totalPages: 108,
    schoolName: 'Lincoln High School',
    accessLevel: 'alumni',
    viewCount: 987,
    downloadCount: 145,
  },
];

export default function YearbookArchive() {
  const theme = useTheme();
  const [yearbooks] = useState<ArchivedYearbook[]>(mockArchivedYearbooks);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterYear, setFilterYear] = useState('all');
  const [filterAccess, setFilterAccess] = useState('all');
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [selectedYearbook, setSelectedYearbook] = useState<ArchivedYearbook | null>(null);
  const [isAlumni, setIsAlumni] = useState(false);

  const filteredYearbooks = yearbooks.filter((yearbook) => {
    const matchesSearch =
      searchQuery === '' ||
      yearbook.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      yearbook.year.includes(searchQuery);
    const matchesYear = filterYear === 'all' || yearbook.year === filterYear;
    const matchesAccess = filterAccess === 'all' || yearbook.accessLevel === filterAccess;
    return matchesSearch && matchesYear && matchesAccess;
  });

  const years = Array.from(new Set(yearbooks.map((yb) => yb.year)))
    .sort()
    .reverse();

  const handleViewYearbook = (yearbook: ArchivedYearbook) => {
    if (yearbook.accessLevel === 'restricted' || (yearbook.accessLevel === 'alumni' && !isAlumni)) {
      setSelectedYearbook(yearbook);
      setLoginDialogOpen(true);
    } else {
      window.open(`/yearbook/${yearbook.id}`, '_blank');
    }
  };

  const handleAlumniLogin = () => {
    setIsAlumni(true);
    setLoginDialogOpen(false);
    if (selectedYearbook) {
      window.open(`/yearbook/${selectedYearbook.id}`, '_blank');
    }
  };

  const getAccessIcon = (accessLevel: ArchivedYearbook['accessLevel']) => {
    switch (accessLevel) {
      case 'public':
        return <LockOpenIcon />;
      case 'alumni':
        return <PeopleIcon />;
      default:
        return <LockIcon />;
    }
  };

  const getAccessColor = (accessLevel: ArchivedYearbook['accessLevel']) => {
    switch (accessLevel) {
      case 'public':
        return 'success';
      case 'alumni':
        return 'info';
      default:
        return 'warning';
    }
  };

  const totalViews = yearbooks.reduce((sum, yb) => sum + yb.viewCount, 0);
  const totalDownloads = yearbooks.reduce((sum, yb) => sum + yb.downloadCount, 0);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom fontWeight={700}>
          Yearbook Archive
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Explore yearbooks from past years and relive memories
        </Typography>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <BookIcon sx={{ color: theme.palette.primary.main, fontSize: 28 }} />
                </Box>
                <Box>
                  <Typography variant="h4" fontWeight={700}>
                    {yearbooks.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Yearbooks
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.info.main, 0.1),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <ViewIcon sx={{ color: theme.palette.info.main, fontSize: 28 }} />
                </Box>
                <Box>
                  <Typography variant="h4" fontWeight={700}>
                    {totalViews.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Views
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.success.main, 0.1),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <DownloadIcon sx={{ color: theme.palette.success.main, fontSize: 28 }} />
                </Box>
                <Box>
                  <Typography variant="h4" fontWeight={700}>
                    {totalDownloads.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Downloads
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.warning.main, 0.1),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <CalendarIcon sx={{ color: theme.palette.warning.main, fontSize: 28 }} />
                </Box>
                <Box>
                  <Typography variant="h4" fontWeight={700}>
                    {years.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Years Archived
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={5}>
            <TextField
              fullWidth
              placeholder="Search yearbooks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Year</InputLabel>
              <Select
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
                label="Year"
              >
                <MenuItem value="all">All Years</MenuItem>
                {years.map((year) => (
                  <MenuItem key={year} value={year}>
                    {year}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth>
              <InputLabel>Access Level</InputLabel>
              <Select
                value={filterAccess}
                onChange={(e) => setFilterAccess(e.target.value)}
                label="Access Level"
              >
                <MenuItem value="all">All Access Levels</MenuItem>
                <MenuItem value="public">Public</MenuItem>
                <MenuItem value="alumni">Alumni Only</MenuItem>
                <MenuItem value="restricted">Restricted</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      <Grid container spacing={3}>
        {filteredYearbooks.map((yearbook) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={yearbook.id}>
            <Card
              elevation={0}
              sx={{
                border: `1px solid ${theme.palette.divider}`,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: theme.shadows[8],
                },
              }}
            >
              <CardMedia
                component="img"
                height="320"
                image={yearbook.coverImage}
                alt={yearbook.title}
              />
              <CardContent sx={{ flex: 1 }}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'start',
                    mb: 1,
                  }}
                >
                  <Typography variant="h6" fontWeight={600}>
                    {yearbook.year}
                  </Typography>
                  <Chip
                    icon={getAccessIcon(yearbook.accessLevel)}
                    label={yearbook.accessLevel}
                    size="small"
                    color={getAccessColor(yearbook.accessLevel)}
                  />
                </Box>
                <Typography variant="body1" gutterBottom>
                  {yearbook.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {yearbook.schoolName}
                </Typography>

                <Divider sx={{ my: 2 }} />

                <Grid container spacing={1}>
                  <Grid item xs={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <ViewIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="caption" color="text.secondary">
                        {yearbook.viewCount.toLocaleString()} views
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <DownloadIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="caption" color="text.secondary">
                        {yearbook.downloadCount} downloads
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <BookIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="caption" color="text.secondary">
                        {yearbook.totalPages} pages
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
              <CardActions sx={{ p: 2, pt: 0 }}>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<ViewIcon />}
                  onClick={() => handleViewYearbook(yearbook)}
                >
                  View Yearbook
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {filteredYearbooks.length === 0 && (
        <Paper
          elevation={0}
          sx={{
            border: `1px solid ${theme.palette.divider}`,
            p: 8,
            textAlign: 'center',
          }}
        >
          <BookIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No yearbooks found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Try adjusting your search or filters
          </Typography>
        </Paper>
      )}

      <Dialog
        open={loginDialogOpen}
        onClose={() => setLoginDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Alumni Login Required
          <IconButton
            onClick={() => setLoginDialogOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <Avatar
              sx={{
                width: 80,
                height: 80,
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                color: theme.palette.primary.main,
                mx: 'auto',
                mb: 3,
              }}
            >
              <LockIcon sx={{ fontSize: 40 }} />
            </Avatar>
            <Typography variant="h6" gutterBottom>
              This yearbook requires alumni access
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              {selectedYearbook?.title} ({selectedYearbook?.year}) is restricted to verified alumni.
              Please log in with your alumni credentials to view.
            </Typography>

            <Stack spacing={2} sx={{ mt: 4 }}>
              <TextField label="Email" type="email" fullWidth />
              <TextField label="Graduation Year" type="number" fullWidth />
              <TextField label="Student ID (Optional)" fullWidth />
            </Stack>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLoginDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" startIcon={<LoginIcon />} onClick={handleAlumniLogin}>
            Verify & Access
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

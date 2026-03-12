import { useLocation, Link as RouterLink } from 'react-router-dom';
import { Breadcrumbs, Link, Typography, Box } from '@mui/material';
import { NavigateNext as NavigateNextIcon, Home as HomeIcon } from '@mui/icons-material';

interface BreadcrumbMapping {
  [key: string]: string;
}

const breadcrumbNameMap: BreadcrumbMapping = {
  '/teacher': 'Teacher Portal',
  '/teacher/dashboard': 'Dashboard',
  '/teacher/attendance': 'Mark Attendance',
  '/teacher/grading': 'Grading Queue',
  '/teacher/classes': 'My Classes',
  '/teacher/assignments': 'Assignments',
  '/teacher/assignments/create': 'Create Assignment',
  '/teacher/assignments/manage': 'Manage Assignments',
  '/teacher/assignments/submissions': 'Submissions',
  '/teacher/tests': 'Tests & Exams',
  '/teacher/tests/create': 'Create Test',
  '/teacher/tests/manage': 'Manage Tests',
  '/teacher/tests/results': 'Test Results',
  '/teacher/performance': 'Class Performance',
  '/teacher/students': 'Student Management',
  '/teacher/resources': 'Teaching Resources',
  '/teacher/schedule': 'My Schedule',
  '/teacher/analytics': 'Analytics',
  '/teacher/messages': 'Messages',
  '/teacher/profile': 'Profile',
  '/teacher/settings': 'Settings',
};

export default function TeacherBreadcrumb() {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  if (pathnames.length === 0 || location.pathname === '/teacher/dashboard') {
    return null;
  }

  const breadcrumbs = [];

  breadcrumbs.push(
    <Link
      component={RouterLink}
      to="/teacher/dashboard"
      color="inherit"
      sx={{
        display: 'flex',
        alignItems: 'center',
        textDecoration: 'none',
        '&:hover': { textDecoration: 'underline' },
      }}
      key="home"
    >
      <HomeIcon sx={{ mr: 0.5, fontSize: '1.2rem' }} />
      Dashboard
    </Link>
  );

  let currentPath = '';
  pathnames.forEach((value, index) => {
    currentPath += `/${value}`;
    const isLast = index === pathnames.length - 1;
    const breadcrumbName = breadcrumbNameMap[currentPath] || value;

    if (isLast) {
      breadcrumbs.push(
        <Typography key={currentPath} color="text.primary" fontWeight={600}>
          {breadcrumbName}
        </Typography>
      );
    } else if (breadcrumbNameMap[currentPath]) {
      breadcrumbs.push(
        <Link
          component={RouterLink}
          to={currentPath}
          color="inherit"
          sx={{
            textDecoration: 'none',
            '&:hover': { textDecoration: 'underline' },
          }}
          key={currentPath}
        >
          {breadcrumbName}
        </Link>
      );
    }
  });

  return (
    <Box sx={{ px: 3, py: 2, bgcolor: 'background.paper' }}>
      <Breadcrumbs
        separator={<NavigateNextIcon fontSize="small" />}
        aria-label="breadcrumb"
        sx={{
          '& .MuiBreadcrumbs-separator': {
            mx: 1,
          },
        }}
      >
        {breadcrumbs}
      </Breadcrumbs>
    </Box>
  );
}

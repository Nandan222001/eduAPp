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
  Avatar,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Stack,
  Divider,
  LinearProgress,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Tabs,
  Tab,
  Tooltip,
  alpha,
} from '@mui/material';
import {
  Business as BusinessIcon,
  People as PeopleIcon,
  AttachMoney as MoneyIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Lightbulb as IdeaIcon,
  RocketLaunch as LaunchIcon,
  EmojiEvents as TrophyIcon,
  Close as CloseIcon,
  Description as DocumentIcon,
  Language as WebIcon,
  Star as StarIcon,
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import entrepreneurshipApi from '@/api/entrepreneurship';
import { StudentVenture, VentureStatus } from '@/types/entrepreneurship';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
};

export default function EntrepreneurshipIncubator() {
  const [activeTab, setActiveTab] = useState(0);
  const [ventures, setVentures] = useState<StudentVenture[]>([]);
  const [filteredVentures, setFilteredVentures] = useState<StudentVenture[]>([]);
  const [selectedVenture, setSelectedVenture] = useState<StudentVenture | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [followedVentures, setFollowedVentures] = useState<Set<number>>(new Set());

  const institutionId = parseInt(localStorage.getItem('institution_id') || '1');

  useEffect(() => {
    fetchVentures();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    filterVentures();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, ventures]);

  const fetchVentures = async () => {
    try {
      setLoading(true);
      const data = await entrepreneurshipApi.getVentures(institutionId);
      setVentures(data);
    } catch (error) {
      console.error('Failed to fetch ventures:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterVentures = () => {
    let filtered = ventures;
    switch (activeTab) {
      case 0:
        filtered = ventures;
        break;
      case 1:
        filtered = ventures.filter((v) => v.is_featured);
        break;
      case 2:
        filtered = ventures.filter((v) => v.venture_status === VentureStatus.IDEA);
        break;
      case 3:
        filtered = ventures.filter((v) => v.venture_status === VentureStatus.DEVELOPMENT);
        break;
      case 4:
        filtered = ventures.filter((v) => v.venture_status === VentureStatus.LAUNCHED);
        break;
    }
    setFilteredVentures(filtered);
  };

  const handleViewVenture = async (venture: StudentVenture) => {
    try {
      const fullVenture = await entrepreneurshipApi.getVenture(institutionId, venture.id);
      setSelectedVenture(fullVenture);
      setDetailDialogOpen(true);
    } catch (error) {
      console.error('Failed to fetch venture details:', error);
    }
  };

  const handleFollowVenture = async (ventureId: number) => {
    try {
      if (followedVentures.has(ventureId)) {
        await entrepreneurshipApi.unfollowVenture(institutionId, ventureId);
        setFollowedVentures((prev) => {
          const next = new Set(prev);
          next.delete(ventureId);
          return next;
        });
      } else {
        await entrepreneurshipApi.followVenture(institutionId, ventureId);
        setFollowedVentures((prev) => new Set(prev).add(ventureId));
      }
    } catch (error) {
      console.error('Failed to toggle follow:', error);
    }
  };

  const getStatusColor = (status: VentureStatus) => {
    switch (status) {
      case VentureStatus.IDEA:
        return 'info';
      case VentureStatus.DEVELOPMENT:
        return 'warning';
      case VentureStatus.LAUNCHED:
        return 'success';
      case VentureStatus.FUNDED:
        return 'secondary';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: VentureStatus) => {
    switch (status) {
      case VentureStatus.IDEA:
        return <IdeaIcon />;
      case VentureStatus.DEVELOPMENT:
        return <BusinessIcon />;
      case VentureStatus.LAUNCHED:
        return <LaunchIcon />;
      case VentureStatus.FUNDED:
        return <MoneyIcon />;
      default:
        return <BusinessIcon />;
    }
  };

  if (loading) {
    return (
      <Box sx={{ width: '100%', mt: 4 }}>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h3" fontWeight={700} gutterBottom>
              Entrepreneurship Incubator
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Explore student ventures and innovative business ideas
            </Typography>
          </Box>
          <Avatar
            sx={{
              width: 64,
              height: 64,
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
            }}
          >
            <BusinessIcon sx={{ fontSize: 36, color: 'primary.main' }} />
          </Avatar>
        </Stack>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Total Ventures
                  </Typography>
                  <Typography variant="h3" fontWeight={700}>
                    {ventures.length}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1) }}>
                  <BusinessIcon color="primary" />
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
                    Launched
                  </Typography>
                  <Typography variant="h3" fontWeight={700} color="success.main">
                    {ventures.filter((v) => v.venture_status === VentureStatus.LAUNCHED).length}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: (theme) => alpha(theme.palette.success.main, 0.1) }}>
                  <LaunchIcon color="success" />
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
                    Total Revenue
                  </Typography>
                  <Typography variant="h3" fontWeight={700}>
                    ${ventures.reduce((sum, v) => sum + Number(v.revenue), 0).toLocaleString()}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: (theme) => alpha(theme.palette.warning.main, 0.1) }}>
                  <MoneyIcon color="warning" />
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
                    Total Customers
                  </Typography>
                  <Typography variant="h3" fontWeight={700}>
                    {ventures.reduce((sum, v) => sum + v.customers, 0).toLocaleString()}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: (theme) => alpha(theme.palette.info.main, 0.1) }}>
                  <PeopleIcon color="info" />
                </Avatar>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="All Ventures" />
          <Tab label="Featured" icon={<StarIcon />} iconPosition="start" />
          <Tab label="Ideas" />
          <Tab label="In Development" />
          <Tab label="Launched" />
        </Tabs>

        <TabPanel value={activeTab} index={activeTab}>
          <Grid container spacing={3}>
            {filteredVentures.map((venture) => (
              <Grid item xs={12} md={6} lg={4} key={venture.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardHeader
                    avatar={
                      venture.logo_url ? (
                        <Avatar src={venture.logo_url} sx={{ width: 56, height: 56 }} />
                      ) : (
                        <Avatar sx={{ width: 56, height: 56, bgcolor: 'primary.main' }}>
                          {venture.venture_name.charAt(0)}
                        </Avatar>
                      )
                    }
                    action={
                      <Stack direction="row" spacing={1}>
                        {venture.is_featured && (
                          <Chip icon={<StarIcon />} label="Featured" size="small" color="warning" />
                        )}
                        <IconButton
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFollowVenture(venture.id);
                          }}
                          color={followedVentures.has(venture.id) ? 'error' : 'default'}
                        >
                          {followedVentures.has(venture.id) ? (
                            <FavoriteIcon />
                          ) : (
                            <FavoriteBorderIcon />
                          )}
                        </IconButton>
                      </Stack>
                    }
                    title={
                      <Typography variant="h6" fontWeight={700}>
                        {venture.venture_name}
                      </Typography>
                    }
                    subheader={venture.tagline}
                  />
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Stack spacing={2}>
                      <Chip
                        icon={getStatusIcon(venture.venture_status)}
                        label={venture.venture_status.replace('_', ' ').toUpperCase()}
                        color={getStatusColor(venture.venture_status)}
                        size="small"
                      />

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {venture.business_idea}
                      </Typography>

                      <Divider />

                      <Stack direction="row" spacing={2}>
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Customers
                          </Typography>
                          <Typography variant="body2" fontWeight={600}>
                            {venture.customers}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Revenue
                          </Typography>
                          <Typography variant="body2" fontWeight={600}>
                            ${Number(venture.revenue).toLocaleString()}
                          </Typography>
                        </Box>
                      </Stack>

                      <Box>
                        <Typography variant="caption" color="text.secondary" gutterBottom>
                          Founders
                        </Typography>
                        <Stack direction="row" spacing={-1} sx={{ mt: 0.5 }}>
                          {venture.team_members?.slice(0, 3).map((member, idx) => (
                            <Tooltip key={idx} title={`${member.first_name} ${member.last_name}`}>
                              <Avatar
                                src={member.photo_url}
                                sx={{
                                  width: 32,
                                  height: 32,
                                  border: 2,
                                  borderColor: 'background.paper',
                                }}
                              >
                                {member.first_name.charAt(0)}
                              </Avatar>
                            </Tooltip>
                          ))}
                          {venture.founder_students.length > 3 && (
                            <Avatar
                              sx={{
                                width: 32,
                                height: 32,
                                border: 2,
                                borderColor: 'background.paper',
                              }}
                            >
                              +{venture.founder_students.length - 3}
                            </Avatar>
                          )}
                        </Stack>
                      </Box>
                    </Stack>
                  </CardContent>
                  <Box sx={{ p: 2, pt: 0 }}>
                    <Button fullWidth variant="outlined" onClick={() => handleViewVenture(venture)}>
                      View Details
                    </Button>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>
      </Paper>

      <Dialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedVenture && (
          <>
            <DialogTitle>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  {selectedVenture.logo_url ? (
                    <Avatar src={selectedVenture.logo_url} sx={{ width: 64, height: 64 }} />
                  ) : (
                    <Avatar sx={{ width: 64, height: 64, bgcolor: 'primary.main' }}>
                      {selectedVenture.venture_name.charAt(0)}
                    </Avatar>
                  )}
                  <Box>
                    <Typography variant="h5" fontWeight={700}>
                      {selectedVenture.venture_name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedVenture.tagline}
                    </Typography>
                  </Box>
                </Box>
                <IconButton onClick={() => setDetailDialogOpen(false)}>
                  <CloseIcon />
                </IconButton>
              </Stack>
            </DialogTitle>
            <DialogContent>
              <Stack spacing={3}>
                <Box>
                  <Chip
                    icon={getStatusIcon(selectedVenture.venture_status)}
                    label={selectedVenture.venture_status.replace('_', ' ').toUpperCase()}
                    color={getStatusColor(selectedVenture.venture_status)}
                  />
                </Box>

                <Box>
                  <Typography variant="h6" gutterBottom>
                    Business Description
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {selectedVenture.business_idea}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="h6" gutterBottom>
                    Problem Statement
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {selectedVenture.problem_statement}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="h6" gutterBottom>
                    Solution
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {selectedVenture.solution}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="h6" gutterBottom>
                    Target Market
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {selectedVenture.target_market}
                  </Typography>
                </Box>

                {selectedVenture.revenue_model && (
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      Revenue Model
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      {selectedVenture.revenue_model}
                    </Typography>
                  </Box>
                )}

                <Divider />

                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                      <Typography variant="caption" color="text.secondary">
                        Customers
                      </Typography>
                      <Typography variant="h4" fontWeight={700}>
                        {selectedVenture.customers}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6}>
                    <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                      <Typography variant="caption" color="text.secondary">
                        Revenue
                      </Typography>
                      <Typography variant="h4" fontWeight={700}>
                        ${Number(selectedVenture.revenue).toLocaleString()}
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>

                <Box>
                  <Typography variant="h6" gutterBottom>
                    Team
                  </Typography>
                  <List>
                    {selectedVenture.team_roles?.map((role, idx) => {
                      const member = selectedVenture.team_members?.find(
                        (m) => m.id === role.student_id
                      );
                      return (
                        <ListItem key={idx}>
                          <ListItemAvatar>
                            <Avatar src={member?.photo_url}>{member?.first_name.charAt(0)}</Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              member ? `${member.first_name} ${member.last_name}` : 'Team Member'
                            }
                            secondary={role.role}
                          />
                        </ListItem>
                      );
                    })}
                  </List>
                </Box>

                {selectedVenture.achievements && selectedVenture.achievements.length > 0 && (
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      Achievements
                    </Typography>
                    <Stack spacing={1}>
                      {selectedVenture.achievements.map((achievement) => (
                        <Paper key={achievement.id} sx={{ p: 2, bgcolor: 'background.default' }}>
                          <Stack direction="row" spacing={2} alignItems="center">
                            <TrophyIcon color="warning" />
                            <Box>
                              <Typography variant="subtitle2" fontWeight={600}>
                                {achievement.title}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {achievement.description}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {format(parseISO(achievement.date), 'MMM d, yyyy')}
                              </Typography>
                            </Box>
                          </Stack>
                        </Paper>
                      ))}
                    </Stack>
                  </Box>
                )}

                <Stack direction="row" spacing={2} flexWrap="wrap">
                  {selectedVenture.pitch_deck_url && (
                    <Button
                      variant="outlined"
                      startIcon={<DocumentIcon />}
                      href={selectedVenture.pitch_deck_url}
                      target="_blank"
                    >
                      View Pitch Deck
                    </Button>
                  )}
                  {selectedVenture.business_plan_url && (
                    <Button
                      variant="outlined"
                      startIcon={<DocumentIcon />}
                      href={selectedVenture.business_plan_url}
                      target="_blank"
                    >
                      Business Plan
                    </Button>
                  )}
                  {selectedVenture.website_url && (
                    <Button
                      variant="outlined"
                      startIcon={<WebIcon />}
                      href={selectedVenture.website_url}
                      target="_blank"
                    >
                      Visit Website
                    </Button>
                  )}
                </Stack>
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button
                variant="outlined"
                startIcon={
                  followedVentures.has(selectedVenture.id) ? (
                    <FavoriteIcon />
                  ) : (
                    <FavoriteBorderIcon />
                  )
                }
                onClick={() => handleFollowVenture(selectedVenture.id)}
                color={followedVentures.has(selectedVenture.id) ? 'error' : 'primary'}
              >
                {followedVentures.has(selectedVenture.id) ? 'Following' : 'Follow'}
              </Button>
              <Button variant="contained">Support Venture</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Container>
  );
}

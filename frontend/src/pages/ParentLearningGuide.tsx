import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Alert,
  Paper,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useTheme,
  alpha,
  Avatar,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  Divider,
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Hearing as HearingIcon,
  TouchApp as TouchIcon,
  MenuBook as BookIcon,
  Home as HomeIcon,
  CheckCircle as CheckCircleIcon,
  ExpandMore as ExpandMoreIcon,
  Star as StarIcon,
  Warning as WarningIcon,
  Lightbulb as LightbulbIcon,
  Chat as ChatIcon,
  Print as PrintIcon,
} from '@mui/icons-material';
import learningStyleApi from '@/api/learningStyle';
import { ParentLearningGuide as ParentGuideType } from '@/types/learningStyle';

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

export default function ParentLearningGuide() {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [guide, setGuide] = useState<ParentGuideType | null>(null);
  const [error, setError] = useState<string | null>(null);

  const studentId = parseInt(localStorage.getItem('selected_student_id') || '1');

  useEffect(() => {
    loadGuide();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadGuide = async () => {
    try {
      setLoading(true);
      const data = await learningStyleApi.getParentGuide(studentId);
      setGuide(data);
    } catch (err) {
      setError('Failed to load learning guide');
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

  if (error || !guide) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Alert severity="error">{error || 'Guide not available'}</Alert>
      </Container>
    );
  }

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', py: 4 }}>
      <Container maxWidth="lg">
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Paper
            elevation={3}
            sx={{
              p: 4,
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
              color: 'white',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <HomeIcon sx={{ fontSize: 48 }} />
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="h4" fontWeight={700} gutterBottom>
                  {guide.student_name}&apos;s Learning Style Guide
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9 }}>
                  Understand how your child learns best and how to support them at home
                </Typography>
              </Box>
              <Button
                variant="contained"
                startIcon={<PrintIcon />}
                onClick={() => window.print()}
                sx={{ bgcolor: 'white', color: 'primary.main', '&:hover': { bgcolor: 'grey.100' } }}
              >
                Print Guide
              </Button>
            </Box>
          </Paper>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Learning Style Overview */}
          <Grid item xs={12} md={6}>
            <Card elevation={2}>
              <CardHeader
                title="Learning Style Profile"
                subheader="Your child's preferred way of learning"
              />
              <CardContent>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="overline" color="text.secondary">
                    Primary Learning Style
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                    <Avatar
                      sx={{
                        width: 56,
                        height: 56,
                        bgcolor: alpha(styleColors[guide.primary_style], 0.1),
                        color: styleColors[guide.primary_style],
                      }}
                    >
                      {styleIcons[guide.primary_style]}
                    </Avatar>
                    <Typography variant="h5" fontWeight={700} sx={{ textTransform: 'capitalize' }}>
                      {guide.primary_style.replace('_', ' ')} Learner
                    </Typography>
                  </Box>
                </Box>

                {guide.secondary_style && (
                  <Box>
                    <Typography variant="overline" color="text.secondary">
                      Secondary Learning Style
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                      <Avatar
                        sx={{
                          width: 48,
                          height: 48,
                          bgcolor: alpha(styleColors[guide.secondary_style], 0.1),
                          color: styleColors[guide.secondary_style],
                        }}
                      >
                        {styleIcons[guide.secondary_style]}
                      </Avatar>
                      <Typography
                        variant="h6"
                        fontWeight={600}
                        sx={{ textTransform: 'capitalize' }}
                      >
                        {guide.secondary_style.replace('_', ' ')}
                      </Typography>
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Strengths and Challenges */}
          <Grid item xs={12} md={6}>
            <Card elevation={2}>
              <CardHeader title="Strengths & Challenges" />
              <CardContent>
                <Box sx={{ mb: 3 }}>
                  <Typography
                    variant="subtitle2"
                    fontWeight={600}
                    gutterBottom
                    sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                  >
                    <StarIcon sx={{ color: 'success.main', fontSize: 20 }} />
                    Strengths
                  </Typography>
                  <List dense>
                    {guide.strengths.map((strength, idx) => (
                      <ListItem key={idx} sx={{ px: 0 }}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          <CheckCircleIcon sx={{ fontSize: 16, color: 'success.main' }} />
                        </ListItemIcon>
                        <ListItemText
                          primary={strength}
                          primaryTypographyProps={{ variant: 'body2' }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Box>
                  <Typography
                    variant="subtitle2"
                    fontWeight={600}
                    gutterBottom
                    sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                  >
                    <WarningIcon sx={{ color: 'warning.main', fontSize: 20 }} />
                    Areas to Support
                  </Typography>
                  <List dense>
                    {guide.challenges.map((challenge, idx) => (
                      <ListItem key={idx} sx={{ px: 0 }}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          <WarningIcon sx={{ fontSize: 16, color: 'warning.main' }} />
                        </ListItemIcon>
                        <ListItemText
                          primary={challenge}
                          primaryTypographyProps={{ variant: 'body2' }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Home Environment Setup */}
          <Grid item xs={12}>
            <Card elevation={2}>
              <CardHeader
                title="Home Study Environment Setup"
                avatar={<HomeIcon sx={{ color: theme.palette.primary.main }} />}
                subheader="Create an optimal learning space"
              />
              <CardContent>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        border: `1px solid ${theme.palette.divider}`,
                        borderTop: `4px solid ${theme.palette.primary.main}`,
                      }}
                    >
                      <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                        💡 Lighting
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {guide.environment_setup.lighting}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        border: `1px solid ${theme.palette.divider}`,
                        borderTop: `4px solid ${theme.palette.success.main}`,
                      }}
                    >
                      <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                        🔇 Noise Level
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {guide.environment_setup.noise}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        border: `1px solid ${theme.palette.divider}`,
                        borderTop: `4px solid ${theme.palette.warning.main}`,
                      }}
                    >
                      <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                        🪑 Workspace
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {guide.environment_setup.workspace}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        border: `1px solid ${theme.palette.divider}`,
                        borderTop: `4px solid ${theme.palette.info.main}`,
                      }}
                    >
                      <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                        📚 Materials
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                        {guide.environment_setup.materials.map((material, idx) => (
                          <Chip key={idx} label={material} size="small" />
                        ))}
                      </Box>
                    </Paper>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Home Support Strategies */}
          <Grid item xs={12}>
            <Card elevation={2}>
              <CardHeader
                title="Home Support Strategies"
                avatar={<LightbulbIcon sx={{ color: theme.palette.warning.main }} />}
                subheader="Practical ways to help your child learn at home"
              />
              <CardContent>
                {guide.home_strategies.map((strategy, idx) => (
                  <Accordion key={idx}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography variant="subtitle1" fontWeight={600}>
                        {strategy.category}
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <List dense>
                        {strategy.strategies.map((item, itemIdx) => (
                          <ListItem key={itemIdx}>
                            <ListItemIcon>
                              <CheckCircleIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                            </ListItemIcon>
                            <ListItemText
                              primary={item}
                              primaryTypographyProps={{ variant: 'body2' }}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </AccordionDetails>
                  </Accordion>
                ))}
              </CardContent>
            </Card>
          </Grid>

          {/* Communication Tips */}
          <Grid item xs={12}>
            <Card elevation={2}>
              <CardHeader
                title="Communication Tips"
                avatar={<ChatIcon sx={{ color: theme.palette.info.main }} />}
                subheader="How to talk with your child about learning"
              />
              <CardContent>
                <Grid container spacing={2}>
                  {guide.communication_tips.map((tip, idx) => (
                    <Grid item xs={12} md={6} key={idx}>
                      <Paper
                        elevation={0}
                        sx={{
                          p: 2,
                          border: `1px solid ${theme.palette.divider}`,
                          borderLeft: `4px solid ${theme.palette.info.main}`,
                        }}
                      >
                        <Typography variant="body2">{tip}</Typography>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Quick Reference Card */}
          <Grid item xs={12}>
            <Paper
              elevation={2}
              sx={{
                p: 3,
                bgcolor: alpha(theme.palette.primary.main, 0.05),
                border: `2px solid ${theme.palette.primary.main}`,
              }}
            >
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Quick Reference: Best Practices for {guide.primary_style.replace('_', ' ')} Learners
              </Typography>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                    ✅ Do:
                  </Typography>
                  <List dense>
                    {guide.primary_style === 'visual' && (
                      <>
                        <ListItem sx={{ px: 0 }}>
                          <ListItemText primary="Use colorful charts and diagrams" />
                        </ListItem>
                        <ListItem sx={{ px: 0 }}>
                          <ListItemText primary="Watch educational videos together" />
                        </ListItem>
                        <ListItem sx={{ px: 0 }}>
                          <ListItemText primary="Create visual study aids" />
                        </ListItem>
                      </>
                    )}
                    {guide.primary_style === 'auditory' && (
                      <>
                        <ListItem sx={{ px: 0 }}>
                          <ListItemText primary="Discuss topics out loud" />
                        </ListItem>
                        <ListItem sx={{ px: 0 }}>
                          <ListItemText primary="Use audio recordings" />
                        </ListItem>
                        <ListItem sx={{ px: 0 }}>
                          <ListItemText primary="Encourage verbal explanations" />
                        </ListItem>
                      </>
                    )}
                    {guide.primary_style === 'kinesthetic' && (
                      <>
                        <ListItem sx={{ px: 0 }}>
                          <ListItemText primary="Include hands-on activities" />
                        </ListItem>
                        <ListItem sx={{ px: 0 }}>
                          <ListItemText primary="Allow movement breaks" />
                        </ListItem>
                        <ListItem sx={{ px: 0 }}>
                          <ListItemText primary="Use real-world examples" />
                        </ListItem>
                      </>
                    )}
                    {guide.primary_style === 'reading_writing' && (
                      <>
                        <ListItem sx={{ px: 0 }}>
                          <ListItemText primary="Encourage note-taking" />
                        </ListItem>
                        <ListItem sx={{ px: 0 }}>
                          <ListItemText primary="Provide reading materials" />
                        </ListItem>
                        <ListItem sx={{ px: 0 }}>
                          <ListItemText primary="Use written summaries" />
                        </ListItem>
                      </>
                    )}
                  </List>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                    ❌ Avoid:
                  </Typography>
                  <List dense>
                    {guide.primary_style === 'visual' && (
                      <>
                        <ListItem sx={{ px: 0 }}>
                          <ListItemText primary="Long verbal-only explanations" />
                        </ListItem>
                        <ListItem sx={{ px: 0 }}>
                          <ListItemText primary="Expecting learning from listening alone" />
                        </ListItem>
                      </>
                    )}
                    {guide.primary_style === 'auditory' && (
                      <>
                        <ListItem sx={{ px: 0 }}>
                          <ListItemText primary="Silent reading for long periods" />
                        </ListItem>
                        <ListItem sx={{ px: 0 }}>
                          <ListItemText primary="Too much written-only material" />
                        </ListItem>
                      </>
                    )}
                    {guide.primary_style === 'kinesthetic' && (
                      <>
                        <ListItem sx={{ px: 0 }}>
                          <ListItemText primary="Long sitting sessions without breaks" />
                        </ListItem>
                        <ListItem sx={{ px: 0 }}>
                          <ListItemText primary="Abstract concepts without examples" />
                        </ListItem>
                      </>
                    )}
                    {guide.primary_style === 'reading_writing' && (
                      <>
                        <ListItem sx={{ px: 0 }}>
                          <ListItemText primary="Oral-only instructions" />
                        </ListItem>
                        <ListItem sx={{ px: 0 }}>
                          <ListItemText primary="Relying solely on visuals" />
                        </ListItem>
                      </>
                    )}
                  </List>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

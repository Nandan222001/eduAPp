import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Button,
  Chip,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  ToggleButtonGroup,
  ToggleButton,
  CircularProgress,
  Alert,
  Paper,
  LinearProgress,
  useTheme,
  alpha,
  Avatar,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
} from '@mui/material';
import {
  VideoLibrary as VideoIcon,
  Article as ArticleIcon,
  Headphones as AudioIcon,
  Extension as ActivityIcon,
  Star as StarIcon,
  School as SchoolIcon,
  Timer as TimerIcon,
  Assessment as AssessmentIcon,
  Close as CloseIcon,
  PlayArrow as PlayIcon,
} from '@mui/icons-material';
import learningStyleApi from '@/api/learningStyle';
import { AdaptiveContent, ContentEffectiveness, LearningStyleProfile } from '@/types/learningStyle';

const formatIcons: Record<string, JSX.Element> = {
  video: <VideoIcon />,
  article: <ArticleIcon />,
  audio: <AudioIcon />,
  activity: <ActivityIcon />,
};

const formatColors: Record<string, string> = {
  video: '#ef4444',
  article: '#3b82f6',
  audio: '#10b981',
  activity: '#f59e0b',
};

export default function AdaptiveLearningLibrary() {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<LearningStyleProfile | null>(null);
  const [contents, setContents] = useState<AdaptiveContent[]>([]);
  const [effectiveness, setEffectiveness] = useState<ContentEffectiveness[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedFormat, setSelectedFormat] = useState<string>('all');
  const [difficultyLevel, setDifficultyLevel] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMatched, setShowMatched] = useState(true);
  const [selectedContent, setSelectedContent] = useState<AdaptiveContent | null>(null);
  const [activeFormat, setActiveFormat] = useState<'video' | 'article' | 'audio' | 'activity'>(
    'video'
  );
  const [error, setError] = useState<string | null>(null);

  const studentId = parseInt(localStorage.getItem('user_id') || '1');

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSubject, difficultyLevel]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [profileData, contentsData, effectivenessData] = await Promise.all([
        learningStyleApi.getProfile(studentId),
        learningStyleApi.getAdaptiveContent(studentId, {
          subject: selectedSubject !== 'all' ? selectedSubject : undefined,
          difficulty: difficultyLevel || undefined,
        }),
        learningStyleApi.getContentEffectiveness(studentId),
      ]);
      setProfile(profileData);
      setContents(contentsData);
      setEffectiveness(effectivenessData);
    } catch (err) {
      setError('Failed to load content library');
    } finally {
      setLoading(false);
    }
  };

  const filteredContents = contents.filter((content) => {
    if (
      searchQuery &&
      !content.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !content.description.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    if (
      selectedFormat !== 'all' &&
      !content.formats[selectedFormat as keyof typeof content.formats]
    ) {
      return false;
    }
    if (showMatched && profile && !content.recommended_for.includes(profile.primary_style)) {
      return false;
    }
    return true;
  });

  const subjects = ['all', 'Mathematics', 'Science', 'English', 'History', 'Geography'];

  const getContentEffectiveness = (contentId: number, format: string) => {
    return effectiveness.find((e) => e.content_id === contentId && e.format === format);
  };

  const handleContentClick = (content: AdaptiveContent) => {
    setSelectedContent(content);
    const formats = Object.keys(content.formats).filter(
      (key) => content.formats[key as keyof typeof content.formats]
    );
    setActiveFormat(formats[0] as typeof activeFormat);
  };

  const handleCloseContent = () => {
    setSelectedContent(null);
  };

  const getAvailableFormats = (content: AdaptiveContent) => {
    return Object.entries(content.formats)
      .filter(([_, format]) => format !== undefined)
      .map(([key]) => key);
  };

  const renderContentCard = (content: AdaptiveContent) => {
    const availableFormats = getAvailableFormats(content);
    const isRecommended = profile && content.recommended_for.includes(profile.primary_style);

    return (
      <Grid item xs={12} sm={6} md={4} key={content.id}>
        <Card
          elevation={2}
          sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            border: isRecommended ? `2px solid ${theme.palette.primary.main}` : 'none',
            position: 'relative',
          }}
        >
          {isRecommended && (
            <Chip
              label="Recommended for You"
              size="small"
              color="primary"
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                zIndex: 1,
              }}
            />
          )}
          <CardMedia
            component="div"
            sx={{
              height: 140,
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <SchoolIcon sx={{ fontSize: 60, color: 'primary.main', opacity: 0.5 }} />
          </CardMedia>
          <CardContent sx={{ flexGrow: 1 }}>
            <Typography variant="h6" gutterBottom>
              {content.title}
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              {content.description}
            </Typography>
            <Box sx={{ mb: 1 }}>
              <Chip label={content.subject} size="small" sx={{ mr: 0.5 }} />
              <Chip label={content.topic} size="small" variant="outlined" />
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <TimerIcon sx={{ fontSize: 16 }} />
                <Typography variant="caption">{content.estimated_time} min</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <AssessmentIcon sx={{ fontSize: 16 }} />
                <Typography variant="caption">Level {content.difficulty_level}</Typography>
              </Box>
            </Box>
          </CardContent>
          <CardActions sx={{ p: 2, pt: 0, flexWrap: 'wrap', gap: 1 }}>
            {availableFormats.map((format) => {
              const eff = getContentEffectiveness(content.id, format);
              return (
                <Tooltip
                  key={format}
                  title={
                    eff
                      ? `${eff.completion_rate}% complete, ${eff.engagement_score}% engagement`
                      : 'Not started'
                  }
                >
                  <Chip
                    icon={formatIcons[format]}
                    label={format}
                    size="small"
                    sx={{
                      bgcolor: alpha(formatColors[format], 0.1),
                      color: formatColors[format],
                      '&:hover': {
                        bgcolor: alpha(formatColors[format], 0.2),
                      },
                    }}
                    onClick={() => handleContentClick(content)}
                  />
                </Tooltip>
              );
            })}
          </CardActions>
        </Card>
      </Grid>
    );
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

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', py: 4 }}>
      <Container maxWidth="xl">
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <SchoolIcon sx={{ fontSize: 40, color: 'primary.main' }} />
            <Box>
              <Typography variant="h4" fontWeight={700}>
                Adaptive Learning Library
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Content personalized to your {profile?.primary_style.replace('_', ' ')} learning
                style
              </Typography>
            </Box>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Profile Summary */}
        {profile && (
          <Paper
            elevation={1}
            sx={{ p: 3, mb: 3, bgcolor: alpha(theme.palette.primary.main, 0.05) }}
          >
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>
                  Your Learning Style:
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip
                    label={`Primary: ${profile.primary_style.replace('_', ' ')}`}
                    color="primary"
                  />
                  {profile.secondary_style && (
                    <Chip
                      label={`Secondary: ${profile.secondary_style.replace('_', ' ')}`}
                      variant="outlined"
                    />
                  )}
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>
                  Preferred Formats:
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {profile.preferences.preferred_formats.map((format, idx) => (
                    <Chip key={idx} label={format} size="small" icon={formatIcons[format]} />
                  ))}
                </Box>
              </Grid>
            </Grid>
          </Paper>
        )}

        {/* Filters */}
        <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Search"
                variant="outlined"
                size="small"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Subject</InputLabel>
                <Select
                  value={selectedSubject}
                  label="Subject"
                  onChange={(e) => setSelectedSubject(e.target.value)}
                >
                  {subjects.map((subject) => (
                    <MenuItem key={subject} value={subject}>
                      {subject === 'all' ? 'All Subjects' : subject}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Format</InputLabel>
                <Select
                  value={selectedFormat}
                  label="Format"
                  onChange={(e) => setSelectedFormat(e.target.value)}
                >
                  <MenuItem value="all">All Formats</MenuItem>
                  <MenuItem value="video">Video</MenuItem>
                  <MenuItem value="article">Article</MenuItem>
                  <MenuItem value="audio">Audio</MenuItem>
                  <MenuItem value="activity">Activity</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Difficulty</InputLabel>
                <Select
                  value={difficultyLevel}
                  label="Difficulty"
                  onChange={(e) => setDifficultyLevel(e.target.value as number)}
                >
                  <MenuItem value={0}>All Levels</MenuItem>
                  <MenuItem value={1}>Beginner</MenuItem>
                  <MenuItem value={2}>Intermediate</MenuItem>
                  <MenuItem value={3}>Advanced</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <ToggleButtonGroup
                value={showMatched ? 'matched' : 'all'}
                exclusive
                onChange={(_, value) => setShowMatched(value === 'matched')}
                size="small"
                fullWidth
              >
                <ToggleButton value="matched">
                  <StarIcon sx={{ mr: 0.5, fontSize: 16 }} /> Matched
                </ToggleButton>
                <ToggleButton value="all">All Content</ToggleButton>
              </ToggleButtonGroup>
            </Grid>
          </Grid>
        </Paper>

        {/* Content Grid */}
        <Typography variant="h6" gutterBottom>
          {filteredContents.length} {showMatched ? 'Matched' : ''} Content Items
        </Typography>
        <Grid container spacing={3}>
          {filteredContents.map(renderContentCard)}
        </Grid>

        {filteredContents.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <SchoolIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              No content found matching your filters
            </Typography>
          </Box>
        )}

        {/* Effectiveness Tracking */}
        <Paper elevation={1} sx={{ p: 3, mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            Your Learning Effectiveness
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Track which content formats work best for you
          </Typography>
          <Grid container spacing={2}>
            {['video', 'article', 'audio', 'activity'].map((format) => {
              const formatData = effectiveness.filter((e) => e.format === format);
              const avgCompletion =
                formatData.reduce((sum, e) => sum + e.completion_rate, 0) /
                (formatData.length || 1);
              const avgEngagement =
                formatData.reduce((sum, e) => sum + e.engagement_score, 0) /
                (formatData.length || 1);

              return (
                <Grid item xs={12} sm={6} md={3} key={format}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      border: `1px solid ${theme.palette.divider}`,
                      borderLeft: `4px solid ${formatColors[format]}`,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <Avatar
                        sx={{
                          bgcolor: alpha(formatColors[format], 0.1),
                          color: formatColors[format],
                          width: 32,
                          height: 32,
                        }}
                      >
                        {formatIcons[format]}
                      </Avatar>
                      <Typography
                        variant="subtitle1"
                        fontWeight={600}
                        sx={{ textTransform: 'capitalize' }}
                      >
                        {format}
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      Completion Rate
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={avgCompletion}
                      sx={{ mb: 1, height: 6, borderRadius: 3 }}
                    />
                    <Typography variant="body2" fontWeight={600}>
                      {avgCompletion.toFixed(0)}%
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ mt: 1, display: 'block' }}
                    >
                      Engagement: {avgEngagement.toFixed(0)}%
                    </Typography>
                  </Paper>
                </Grid>
              );
            })}
          </Grid>
        </Paper>
      </Container>

      {/* Content Viewer Dialog */}
      <Dialog open={selectedContent !== null} onClose={handleCloseContent} maxWidth="md" fullWidth>
        {selectedContent && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">{selectedContent.title}</Typography>
                <IconButton onClick={handleCloseContent}>
                  <CloseIcon />
                </IconButton>
              </Box>
            </DialogTitle>
            <DialogContent>
              <Tabs
                value={activeFormat}
                onChange={(_, value) => setActiveFormat(value)}
                sx={{ mb: 2 }}
              >
                {getAvailableFormats(selectedContent).map((format) => (
                  <Tab
                    key={format}
                    value={format}
                    label={format}
                    icon={formatIcons[format]}
                    iconPosition="start"
                  />
                ))}
              </Tabs>
              <Box
                sx={{
                  minHeight: 400,
                  bgcolor: alpha(theme.palette.primary.main, 0.05),
                  p: 3,
                  borderRadius: 2,
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                  }}
                >
                  <Box sx={{ textAlign: 'center' }}>
                    <Avatar
                      sx={{
                        width: 80,
                        height: 80,
                        bgcolor: alpha(formatColors[activeFormat], 0.2),
                        color: formatColors[activeFormat],
                        mx: 'auto',
                        mb: 2,
                      }}
                    >
                      {formatIcons[activeFormat]}
                    </Avatar>
                    <Typography variant="h6" gutterBottom>
                      {activeFormat.toUpperCase()} Content
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {selectedContent.description}
                    </Typography>
                    <Button variant="contained" startIcon={<PlayIcon />}>
                      Start Learning
                    </Button>
                  </Box>
                </Box>
              </Box>
            </DialogContent>
          </>
        )}
      </Dialog>
    </Box>
  );
}

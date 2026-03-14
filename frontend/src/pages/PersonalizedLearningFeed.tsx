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
  IconButton,
  Chip,
  Button,
  Drawer,
  List,
  ListItemText,
  ListItemIcon,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Rating,
  LinearProgress,
  Avatar,
  Tooltip,
  Collapse,
  Alert,
  Snackbar,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Paper,
  Stack,
  alpha,
  useTheme,
  CircularProgress,
  Menu,
  ListItemButton,
} from '@mui/material';
import {
  Bookmark,
  BookmarkBorder,
  ThumbUp,
  ThumbDown,
  PlaylistAdd,
  Share,
  MoreVert,
  FilterList,
  Close,
  School,
  Timer,
  Star,
  TrendingUp,
  Psychology,
  Groups,
  EmojiEvents,
  MenuBook,
  VideoLibrary,
  Quiz,
  Description,
  Article,
  CheckCircle,
  PlayCircle,
  ExpandMore,
  ExpandLess,
  Delete,
  Add,
  VideoCall,
} from '@mui/icons-material';
import learningFeedApi from '@/api/learningFeed';
import type {
  LearningResource,
  RecommendationCategory,
  LearningPlaylist,
  ContentFilters,
  FilterOptions,
  TeacherCuratedCollection,
} from '@/types/learningFeed';

// Resource Card Component
interface ResourceCardProps {
  resource: LearningResource;
  onPlay: (resource: LearningResource) => void;
  onBookmark: (resource: LearningResource) => void;
  onAddToPlaylist: (resource: LearningResource) => void;
  onFeedback: (resource: LearningResource, feedback: 'helpful' | 'not_helpful') => void;
  onRate: (resource: LearningResource, rating: number) => void;
}

function ResourceCard({
  resource,
  onPlay,
  onBookmark,
  onAddToPlaylist,
  onFeedback,
  onRate,
}: ResourceCardProps) {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [showRating, setShowRating] = useState(false);

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <VideoLibrary />;
      case 'quiz':
        return <Quiz />;
      case 'pdf':
        return <Description />;
      case 'article':
        return <Article />;
      case 'live_session':
        return <VideoCall />;
      case 'interactive':
        return <School />;
      default:
        return <MenuBook />;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return theme.palette.success.main;
      case 'intermediate':
        return theme.palette.warning.main;
      case 'advanced':
        return theme.palette.error.main;
      default:
        return theme.palette.grey[500];
    }
  };

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        transition: 'all 0.3s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: theme.shadows[4],
        },
      }}
    >
      {resource.is_curated && (
        <Chip
          icon={<EmojiEvents />}
          label="Teacher Curated"
          color="secondary"
          size="small"
          sx={{
            position: 'absolute',
            top: 8,
            left: 8,
            zIndex: 1,
          }}
        />
      )}

      <CardMedia
        sx={{
          height: 160,
          bgcolor: alpha(theme.palette.primary.main, 0.1),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
        image={resource.thumbnail_url}
      >
        {!resource.thumbnail_url && (
          <Box sx={{ fontSize: 60, color: theme.palette.primary.main }}>
            {getResourceIcon(resource.resource_type)}
          </Box>
        )}
        {resource.progress_percentage !== undefined && resource.progress_percentage > 0 && (
          <LinearProgress
            variant="determinate"
            value={resource.progress_percentage}
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: 4,
            }}
          />
        )}
      </CardMedia>

      <CardContent sx={{ flexGrow: 1, pb: 1 }}>
        <Box sx={{ display: 'flex', gap: 0.5, mb: 1, flexWrap: 'wrap' }}>
          <Chip
            icon={getResourceIcon(resource.resource_type)}
            label={resource.resource_type.replace('_', ' ')}
            size="small"
            variant="outlined"
          />
          <Chip
            label={resource.difficulty}
            size="small"
            sx={{
              bgcolor: alpha(getDifficultyColor(resource.difficulty), 0.1),
              color: getDifficultyColor(resource.difficulty),
              fontWeight: 600,
            }}
          />
        </Box>

        <Typography variant="h6" gutterBottom noWrap title={resource.title}>
          {resource.title}
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            mb: 1,
          }}
        >
          {resource.description}
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Timer fontSize="small" color="action" />
            <Typography variant="caption">{resource.estimated_time} min</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Star fontSize="small" sx={{ color: theme.palette.warning.main }} />
            <Typography variant="caption">
              {resource.average_rating.toFixed(1)} ({resource.total_ratings})
            </Typography>
          </Box>
        </Box>

        <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
          {resource.subject} • {resource.topic}
        </Typography>

        {resource.curator_annotation && (
          <Alert severity="info" icon={<School />} sx={{ mt: 1, py: 0 }}>
            <Typography variant="caption">{resource.curator_annotation}</Typography>
          </Alert>
        )}
      </CardContent>

      <CardActions sx={{ justifyContent: 'space-between', pt: 0, px: 2, pb: 2 }}>
        <Box>
          <Tooltip title="Start Learning">
            <IconButton color="primary" onClick={() => onPlay(resource)} size="large">
              {resource.is_completed ? <CheckCircle /> : <PlayCircle />}
            </IconButton>
          </Tooltip>
        </Box>

        <Box>
          <Tooltip title={resource.is_bookmarked ? 'Remove Bookmark' : 'Bookmark'}>
            <IconButton size="small" onClick={() => onBookmark(resource)}>
              {resource.is_bookmarked ? <Bookmark color="primary" /> : <BookmarkBorder />}
            </IconButton>
          </Tooltip>

          <Tooltip title="Add to Playlist">
            <IconButton size="small" onClick={() => onAddToPlaylist(resource)}>
              <PlaylistAdd />
            </IconButton>
          </Tooltip>

          <Tooltip title="Helpful">
            <IconButton
              size="small"
              onClick={() => onFeedback(resource, 'helpful')}
              color={resource.user_feedback === 'helpful' ? 'success' : 'default'}
            >
              <ThumbUp fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Not Helpful">
            <IconButton
              size="small"
              onClick={() => onFeedback(resource, 'not_helpful')}
              color={resource.user_feedback === 'not_helpful' ? 'error' : 'default'}
            >
              <ThumbDown fontSize="small" />
            </IconButton>
          </Tooltip>

          <IconButton size="small" onClick={(e) => setAnchorEl(e.currentTarget)}>
            <MoreVert />
          </IconButton>
        </Box>
      </CardActions>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
        <MenuItem
          onClick={() => {
            setShowRating(true);
            setAnchorEl(null);
          }}
        >
          <Star sx={{ mr: 1 }} fontSize="small" />
          Rate Resource
        </MenuItem>
        <MenuItem onClick={() => setAnchorEl(null)}>
          <Share sx={{ mr: 1 }} fontSize="small" />
          Share
        </MenuItem>
      </Menu>

      <Dialog open={showRating} onClose={() => setShowRating(false)}>
        <DialogTitle>Rate this Resource</DialogTitle>
        <DialogContent>
          <Box
            sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, py: 2 }}
          >
            <Rating
              value={resource.user_rating || 0}
              onChange={(_, value) => {
                if (value) {
                  onRate(resource, value);
                  setShowRating(false);
                }
              }}
              size="large"
            />
            <Typography variant="caption" color="text.secondary">
              Click to rate
            </Typography>
          </Box>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// Recommendation Section Component
interface RecommendationSectionProps {
  category: RecommendationCategory;
  onPlay: (resource: LearningResource) => void;
  onBookmark: (resource: LearningResource) => void;
  onAddToPlaylist: (resource: LearningResource) => void;
  onFeedback: (resource: LearningResource, feedback: 'helpful' | 'not_helpful') => void;
  onRate: (resource: LearningResource, rating: number) => void;
}

function RecommendationSection({
  category,
  onPlay,
  onBookmark,
  onAddToPlaylist,
  onFeedback,
  onRate,
}: RecommendationSectionProps) {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(true);

  const getCategoryIcon = (type: string) => {
    switch (type) {
      case 'for_you':
        return <Psychology sx={{ color: theme.palette.primary.main }} />;
      case 'struggled_with':
        return <TrendingUp sx={{ color: theme.palette.warning.main }} />;
      case 'similar_students':
        return <Groups sx={{ color: theme.palette.info.main }} />;
      case 'curated':
        return <EmojiEvents sx={{ color: theme.palette.secondary.main }} />;
      default:
        return <MenuBook />;
    }
  };

  return (
    <Box sx={{ mb: 4 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 2,
          cursor: 'pointer',
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {getCategoryIcon(category.category_type)}
          <Typography variant="h5" fontWeight={700}>
            {category.title}
          </Typography>
        </Box>
        <IconButton size="small">{expanded ? <ExpandLess /> : <ExpandMore />}</IconButton>
      </Box>

      {category.description && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {category.description}
        </Typography>
      )}

      {category.reason && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {category.reason}
        </Alert>
      )}

      <Collapse in={expanded}>
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            overflowX: 'auto',
            pb: 2,
            '&::-webkit-scrollbar': {
              height: 8,
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: alpha(theme.palette.primary.main, 0.3),
              borderRadius: 4,
            },
          }}
        >
          {category.resources.map((resource) => (
            <Box key={resource.id} sx={{ minWidth: 320, maxWidth: 320 }}>
              <ResourceCard
                resource={resource}
                onPlay={onPlay}
                onBookmark={onBookmark}
                onAddToPlaylist={onAddToPlaylist}
                onFeedback={onFeedback}
                onRate={onRate}
              />
            </Box>
          ))}
        </Box>
      </Collapse>
    </Box>
  );
}

// Filter Drawer Component
interface FilterDrawerProps {
  open: boolean;
  onClose: () => void;
  filters: ContentFilters;
  filterOptions: FilterOptions;
  onApplyFilters: (filters: ContentFilters) => void;
}

function FilterDrawer({
  open,
  onClose,
  filters,
  filterOptions,
  onApplyFilters,
}: FilterDrawerProps) {
  const [localFilters, setLocalFilters] = useState<ContentFilters>(filters);

  const handleApply = () => {
    onApplyFilters(localFilters);
    onClose();
  };

  const handleReset = () => {
    setLocalFilters({});
  };

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box sx={{ width: 350, p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6">Filters</Typography>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>

        <Divider sx={{ mb: 3 }} />

        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel>Subject</InputLabel>
          <Select
            multiple
            value={localFilters.subjects || []}
            onChange={(e) =>
              setLocalFilters({ ...localFilters, subjects: e.target.value as string[] })
            }
            label="Subject"
          >
            {filterOptions.subjects.map((subject) => (
              <MenuItem key={subject} value={subject}>
                {subject}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel>Format</InputLabel>
          <Select
            multiple
            value={localFilters.formats || []}
            onChange={(e) =>
              setLocalFilters({ ...localFilters, formats: e.target.value as string[] })
            }
            label="Format"
          >
            {filterOptions.formats.map((format) => (
              <MenuItem key={format} value={format}>
                {format}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel>Difficulty</InputLabel>
          <Select
            multiple
            value={localFilters.difficulties || []}
            onChange={(e) =>
              setLocalFilters({ ...localFilters, difficulties: e.target.value as string[] })
            }
            label="Difficulty"
          >
            {filterOptions.difficulties.map((difficulty) => (
              <MenuItem key={difficulty} value={difficulty}>
                {difficulty}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Typography variant="subtitle2" gutterBottom>
          Duration
        </Typography>
        <FormControl fullWidth sx={{ mb: 3 }}>
          <Select
            value={
              localFilters.duration_min !== undefined
                ? `${localFilters.duration_min}-${localFilters.duration_max}`
                : ''
            }
            onChange={(e) => {
              const value = e.target.value as string;
              if (value) {
                const [min, max] = value.split('-').map(Number);
                setLocalFilters({ ...localFilters, duration_min: min, duration_max: max });
              } else {
                const {
                  duration_min: _durationMin,
                  duration_max: _durationMax,
                  ...rest
                } = localFilters;
                setLocalFilters(rest);
              }
            }}
            displayEmpty
          >
            <MenuItem value="">Any Duration</MenuItem>
            {filterOptions.duration_ranges.map((range) => (
              <MenuItem key={range.label} value={`${range.min}-${range.max}`}>
                {range.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormGroup sx={{ mb: 3 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={localFilters.show_completed || false}
                onChange={(e) =>
                  setLocalFilters({ ...localFilters, show_completed: e.target.checked })
                }
              />
            }
            label="Show Completed"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={localFilters.show_curated_only || false}
                onChange={(e) =>
                  setLocalFilters({ ...localFilters, show_curated_only: e.target.checked })
                }
              />
            }
            label="Teacher Curated Only"
          />
        </FormGroup>

        <Stack spacing={2}>
          <Button variant="contained" fullWidth onClick={handleApply}>
            Apply Filters
          </Button>
          <Button variant="outlined" fullWidth onClick={handleReset}>
            Reset Filters
          </Button>
        </Stack>
      </Box>
    </Drawer>
  );
}

// Playlist Drawer Component
interface PlaylistDrawerProps {
  open: boolean;
  onClose: () => void;
  playlists: LearningPlaylist[];
  onCreatePlaylist: (name: string, description?: string) => void;
  onSelectPlaylist: (playlist: LearningPlaylist) => void;
  onDeletePlaylist: (playlistId: number) => void;
}

function PlaylistDrawer({
  open,
  onClose,
  playlists,
  onCreatePlaylist,
  onSelectPlaylist,
  onDeletePlaylist,
}: PlaylistDrawerProps) {
  const [showCreate, setShowCreate] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDesc, setNewPlaylistDesc] = useState('');

  const handleCreate = () => {
    if (newPlaylistName.trim()) {
      onCreatePlaylist(newPlaylistName, newPlaylistDesc);
      setNewPlaylistName('');
      setNewPlaylistDesc('');
      setShowCreate(false);
    }
  };

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box sx={{ width: 400, p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6">My Playlists</Typography>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>

        <Button
          variant="contained"
          startIcon={<Add />}
          fullWidth
          onClick={() => setShowCreate(!showCreate)}
          sx={{ mb: 2 }}
        >
          Create Playlist
        </Button>

        <Collapse in={showCreate}>
          <Paper sx={{ p: 2, mb: 2 }}>
            <TextField
              fullWidth
              label="Playlist Name"
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Description (optional)"
              value={newPlaylistDesc}
              onChange={(e) => setNewPlaylistDesc(e.target.value)}
              multiline
              rows={2}
              sx={{ mb: 2 }}
            />
            <Stack direction="row" spacing={1}>
              <Button variant="contained" size="small" onClick={handleCreate} fullWidth>
                Create
              </Button>
              <Button
                variant="outlined"
                size="small"
                onClick={() => setShowCreate(false)}
                fullWidth
              >
                Cancel
              </Button>
            </Stack>
          </Paper>
        </Collapse>

        <Divider sx={{ mb: 2 }} />

        <List>
          {playlists.map((playlist) => (
            <ListItemButton key={playlist.id} onClick={() => onSelectPlaylist(playlist)}>
              <ListItemIcon>
                <PlaylistAdd />
              </ListItemIcon>
              <ListItemText
                primary={playlist.name}
                secondary={
                  <>
                    {playlist.total_count} resources • {playlist.total_duration} min
                    <LinearProgress
                      variant="determinate"
                      value={(playlist.completed_count / playlist.total_count) * 100}
                      sx={{ mt: 1 }}
                    />
                  </>
                }
              />
              <IconButton
                edge="end"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeletePlaylist(playlist.id);
                }}
                disabled={playlist.is_default}
              >
                <Delete />
              </IconButton>
            </ListItemButton>
          ))}
        </List>
      </Box>
    </Drawer>
  );
}

// Curated Collections Component
interface CuratedCollectionsProps {
  collections: TeacherCuratedCollection[];
  onViewCollection: (collection: TeacherCuratedCollection) => void;
}

function CuratedCollections({ collections, onViewCollection }: CuratedCollectionsProps) {
  const theme = useTheme();

  return (
    <Box sx={{ mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <EmojiEvents sx={{ color: theme.palette.secondary.main }} />
        <Typography variant="h5" fontWeight={700}>
          Teacher Curated Collections
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {collections.map((collection) => (
          <Grid item xs={12} md={6} lg={4} key={collection.id}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                cursor: 'pointer',
                transition: 'all 0.3s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: theme.shadows[4],
                },
              }}
              onClick={() => onViewCollection(collection)}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                {collection.is_featured && (
                  <Chip
                    icon={<Star />}
                    label="Featured"
                    color="secondary"
                    size="small"
                    sx={{ mb: 1 }}
                  />
                )}
                <Typography variant="h6" gutterBottom>
                  {collection.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {collection.description}
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Avatar sx={{ width: 32, height: 32 }}>
                    {collection.teacher_name.charAt(0)}
                  </Avatar>
                  <Typography variant="body2">{collection.teacher_name}</Typography>
                </Box>

                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                  <Chip
                    label={collection.subject}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                  {collection.grade_level && (
                    <Chip label={collection.grade_level} size="small" variant="outlined" />
                  )}
                </Box>

                <Typography variant="caption" color="text.secondary">
                  {collection.resources.length} resources
                  {collection.total_students_enrolled &&
                    ` • ${collection.total_students_enrolled} students enrolled`}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

// Main Component
export default function PersonalizedLearningFeed() {
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState<RecommendationCategory[]>([]);
  const [curatedCollections, setCuratedCollections] = useState<TeacherCuratedCollection[]>([]);
  const [playlists, setPlaylists] = useState<LearningPlaylist[]>([]);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    subjects: [],
    formats: [],
    difficulties: [],
    duration_ranges: [],
  });
  const [filters, setFilters] = useState<ContentFilters>({});
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [playlistDrawerOpen, setPlaylistDrawerOpen] = useState(false);
  const [selectedResourceForPlaylist, setSelectedResourceForPlaylist] =
    useState<LearningResource | null>(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [recsData, collectionsData, playlistsData, optionsData] = await Promise.all([
        learningFeedApi.getRecommendations(filters),
        learningFeedApi.getCuratedCollections(),
        learningFeedApi.getPlaylists(),
        learningFeedApi.getFilterOptions(),
      ]);

      setRecommendations(recsData);
      setCuratedCollections(collectionsData);
      setPlaylists(playlistsData);
      setFilterOptions(optionsData);
    } catch (error) {
      showSnackbar('Failed to load learning feed', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const handlePlay = (resource: LearningResource) => {
    window.open(resource.content_url, '_blank');
    learningFeedApi.updateProgress(resource.id, {
      resource_id: resource.id,
      progress_percentage: 0,
      last_accessed: new Date().toISOString(),
      time_spent: 0,
      is_completed: false,
    });
  };

  const handleBookmark = async (resource: LearningResource) => {
    try {
      await learningFeedApi.toggleBookmark(resource.id);
      showSnackbar(resource.is_bookmarked ? 'Bookmark removed' : 'Resource bookmarked', 'success');
      loadData();
    } catch (error) {
      showSnackbar('Failed to update bookmark', 'error');
    }
  };

  const handleAddToPlaylist = (resource: LearningResource) => {
    setSelectedResourceForPlaylist(resource);
    setPlaylistDrawerOpen(true);
  };

  const handleFeedback = async (
    resource: LearningResource,
    feedback: 'helpful' | 'not_helpful'
  ) => {
    try {
      await learningFeedApi.submitFeedback({
        resource_id: resource.id,
        feedback_type: feedback,
      });
      showSnackbar('Feedback submitted', 'success');
      loadData();
    } catch (error) {
      showSnackbar('Failed to submit feedback', 'error');
    }
  };

  const handleRate = async (resource: LearningResource, rating: number) => {
    try {
      await learningFeedApi.rateResource(resource.id, rating);
      showSnackbar('Rating submitted', 'success');
      loadData();
    } catch (error) {
      showSnackbar('Failed to submit rating', 'error');
    }
  };

  const handleCreatePlaylist = async (name: string, description?: string) => {
    try {
      await learningFeedApi.createPlaylist(name, description);
      showSnackbar('Playlist created', 'success');
      const playlistsData = await learningFeedApi.getPlaylists();
      setPlaylists(playlistsData);
    } catch (error) {
      showSnackbar('Failed to create playlist', 'error');
    }
  };

  const handleSelectPlaylist = async (playlist: LearningPlaylist) => {
    if (selectedResourceForPlaylist) {
      try {
        await learningFeedApi.addToPlaylist(playlist.id, selectedResourceForPlaylist.id);
        showSnackbar('Added to playlist', 'success');
        setPlaylistDrawerOpen(false);
        setSelectedResourceForPlaylist(null);
        const playlistsData = await learningFeedApi.getPlaylists();
        setPlaylists(playlistsData);
      } catch (error) {
        showSnackbar('Failed to add to playlist', 'error');
      }
    }
  };

  const handleDeletePlaylist = async (playlistId: number) => {
    try {
      await learningFeedApi.deletePlaylist(playlistId);
      showSnackbar('Playlist deleted', 'success');
      const playlistsData = await learningFeedApi.getPlaylists();
      setPlaylists(playlistsData);
    } catch (error) {
      showSnackbar('Failed to delete playlist', 'error');
    }
  };

  const handleViewCollection = (_collection: TeacherCuratedCollection) => {
    showSnackbar('Collection viewer coming soon!', 'info');
  };

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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" fontWeight={700}>
          Personalized Learning Feed
        </Typography>

        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<PlaylistAdd />}
            onClick={() => setPlaylistDrawerOpen(true)}
          >
            My Playlists ({playlists.length})
          </Button>
          <Button
            variant="outlined"
            startIcon={<FilterList />}
            onClick={() => setFilterDrawerOpen(true)}
          >
            Filters
          </Button>
        </Stack>
      </Box>

      {curatedCollections.length > 0 && (
        <CuratedCollections
          collections={curatedCollections}
          onViewCollection={handleViewCollection}
        />
      )}

      {recommendations.map((category) => (
        <RecommendationSection
          key={category.id}
          category={category}
          onPlay={handlePlay}
          onBookmark={handleBookmark}
          onAddToPlaylist={handleAddToPlaylist}
          onFeedback={handleFeedback}
          onRate={handleRate}
        />
      ))}

      <FilterDrawer
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        filters={filters}
        filterOptions={filterOptions}
        onApplyFilters={(newFilters) => {
          setFilters(newFilters);
          setFilterDrawerOpen(false);
        }}
      />

      <PlaylistDrawer
        open={playlistDrawerOpen}
        onClose={() => {
          setPlaylistDrawerOpen(false);
          setSelectedResourceForPlaylist(null);
        }}
        playlists={playlists}
        onCreatePlaylist={handleCreatePlaylist}
        onSelectPlaylist={handleSelectPlaylist}
        onDeletePlaylist={handleDeletePlaylist}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}

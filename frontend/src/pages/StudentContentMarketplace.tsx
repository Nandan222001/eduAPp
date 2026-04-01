import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  TextField,
  InputAdornment,
  Button,
  Chip,
  Rating,
  CircularProgress,
  Alert,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Divider,
  Avatar,
  Stack,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  useTheme,
  alpha,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Download as DownloadIcon,
  ShoppingCart as CartIcon,
  Visibility as ViewIcon,
  AttachMoney as MoneyIcon,
  Close as CloseIcon,
  PlayCircle as PlayIcon,
  PictureAsPdf as PdfIcon,
  Description as NotesIcon,
  Quiz as QuizIcon,
  InsertDriveFile as FileIcon,
  VerifiedUser as VerifiedIcon,
  AccountCircle as ProfileIcon,
  ThumbUp as ThumbUpIcon,
} from '@mui/icons-material';
import {
  contentMarketplaceApi,
  ContentItem,
  ContentDetails,
  SearchFilters,
} from '@/api/contentMarketplace';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index } = props;
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ mt: 3 }}>{children}</Box>}
    </div>
  );
}

interface ContentCardProps {
  content: ContentItem;
  onClick: (content: ContentItem) => void;
}

function ContentCard({ content, onClick }: ContentCardProps) {
  const theme = useTheme();

  const getContentIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <PlayIcon />;
      case 'pdf':
        return <PdfIcon />;
      case 'notes':
        return <NotesIcon />;
      case 'quiz':
        return <QuizIcon />;
      default:
        return <FileIcon />;
    }
  };

  return (
    <Card
      elevation={0}
      sx={{
        height: '100%',
        border: `1px solid ${theme.palette.divider}`,
        cursor: 'pointer',
        transition: 'all 0.3s',
        '&:hover': {
          boxShadow: theme.shadows[4],
          transform: 'translateY(-4px)',
        },
      }}
      onClick={() => onClick(content)}
    >
      <Box sx={{ position: 'relative' }}>
        {content.thumbnail_url ? (
          <CardMedia
            component="img"
            height="180"
            image={content.thumbnail_url}
            alt={content.title}
          />
        ) : (
          <Box
            sx={{
              height: 180,
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {getContentIcon(content.content_type)}
          </Box>
        )}
        <Chip
          label={content.content_type.toUpperCase()}
          size="small"
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            bgcolor: alpha('#000', 0.7),
            color: 'white',
            fontWeight: 600,
          }}
        />
        {content.is_free ? (
          <Chip
            label="FREE"
            size="small"
            color="success"
            sx={{
              position: 'absolute',
              top: 8,
              left: 8,
              fontWeight: 600,
            }}
          />
        ) : (
          <Chip
            label={`${content.price} credits`}
            size="small"
            icon={<MoneyIcon />}
            sx={{
              position: 'absolute',
              top: 8,
              left: 8,
              bgcolor: alpha('#000', 0.7),
              color: 'white',
              fontWeight: 600,
            }}
          />
        )}
      </Box>
      <CardContent>
        <Typography variant="h6" fontWeight={700} gutterBottom noWrap>
          {content.title}
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mb: 2,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {content.description}
        </Typography>

        <Stack direction="row" spacing={0.5} sx={{ mb: 2, flexWrap: 'wrap', gap: 0.5 }}>
          <Chip label={content.subject} size="small" variant="outlined" />
          <Chip label={content.grade} size="small" variant="outlined" />
        </Stack>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Rating value={content.rating} precision={0.1} size="small" readOnly />
          <Typography variant="body2" fontWeight={600}>
            {content.rating.toFixed(1)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            ({content.total_ratings})
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar src={content.creator_photo_url} sx={{ width: 24, height: 24 }}>
            {content.creator_name.charAt(0)}
          </Avatar>
          <Typography variant="caption" color="text.secondary">
            {content.creator_name}
          </Typography>
          <Rating value={content.creator_rating} size="small" readOnly max={5} precision={0.1} />
        </Box>

        <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <DownloadIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography variant="caption" color="text.secondary">
              {content.total_purchases}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <ViewIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography variant="caption" color="text.secondary">
              {content.total_views}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

interface ContentDetailDialogProps {
  content: ContentDetails | null;
  open: boolean;
  onClose: () => void;
  onPurchase: (content: ContentDetails) => void;
}

function ContentDetailDialog({ content, open, onClose, onPurchase }: ContentDetailDialogProps) {
  const theme = useTheme();
  const [currentTab, setCurrentTab] = useState(0);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });

  if (!content) return null;

  const handleSubmitReview = async () => {
    try {
      await contentMarketplaceApi.submitReview(content.id, newReview.rating, newReview.comment);
      setNewReview({ rating: 5, comment: '' });
    } catch (error) {
      console.error('Failed to submit review:', error);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5" fontWeight={700}>
            {content.title}
          </Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            {content.thumbnail_url ? (
              <CardMedia
                component="img"
                image={content.thumbnail_url}
                alt={content.title}
                sx={{ borderRadius: 2, mb: 2 }}
              />
            ) : (
              <Box
                sx={{
                  height: 200,
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 2,
                }}
              >
                <FileIcon sx={{ fontSize: 64, color: 'text.secondary' }} />
              </Box>
            )}

            {content.preview_url && (
              <Button variant="outlined" fullWidth startIcon={<ViewIcon />} sx={{ mb: 2 }}>
                Preview Content
              </Button>
            )}

            <Paper elevation={0} sx={{ p: 2, border: `1px solid ${theme.palette.divider}` }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Avatar src={content.creator_photo_url} sx={{ width: 56, height: 56 }}>
                  {content.creator_name.charAt(0)}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle1" fontWeight={700}>
                    {content.creator_name}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Rating value={content.creator_rating} size="small" readOnly precision={0.1} />
                    <Typography variant="body2" color="text.secondary">
                      Creator Rating
                    </Typography>
                  </Box>
                </Box>
                <Button size="small" variant="outlined" startIcon={<ProfileIcon />}>
                  Profile
                </Button>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Rating value={content.rating} precision={0.1} size="large" readOnly />
                <Typography variant="h6" fontWeight={700}>
                  {content.rating.toFixed(1)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  ({content.total_ratings} ratings)
                </Typography>
              </Box>

              <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                <Chip label={content.subject} color="primary" />
                <Chip label={content.grade} color="primary" />
                <Chip label={content.topic} variant="outlined" />
                <Chip label={content.difficulty_level} variant="outlined" />
              </Stack>

              <Typography variant="body2" color="text.secondary" paragraph>
                {content.full_description}
              </Typography>

              {content.learning_objectives.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                    Learning Objectives
                  </Typography>
                  <List dense>
                    {content.learning_objectives.map((obj, idx) => (
                      <ListItem key={idx}>
                        <ListItemText primary={`• ${obj}`} />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}

              {content.prerequisites.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                    Prerequisites
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                    {content.prerequisites.map((prereq, idx) => (
                      <Chip key={idx} label={prereq} size="small" variant="outlined" />
                    ))}
                  </Stack>
                </Box>
              )}

              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Downloads
                  </Typography>
                  <Typography variant="h6" fontWeight={700}>
                    {content.total_purchases}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Views
                  </Typography>
                  <Typography variant="h6" fontWeight={700}>
                    {content.total_views}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block">
                    File Size
                  </Typography>
                  <Typography variant="h6" fontWeight={700}>
                    {(content.file_size / 1024 / 1024).toFixed(1)} MB
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Grid>
        </Grid>

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mt: 3 }}>
          <Tabs value={currentTab} onChange={(_e, v) => setCurrentTab(v)}>
            <Tab label={`Reviews (${content.reviews.length})`} />
            <Tab label="Related Content" />
          </Tabs>
        </Box>

        <TabPanel value={currentTab} index={0}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" fontWeight={700} gutterBottom>
              Write a Review
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Rating
                value={newReview.rating}
                onChange={(_e, value) => setNewReview({ ...newReview, rating: value || 5 })}
                size="large"
              />
            </Box>
            <TextField
              fullWidth
              multiline
              rows={3}
              placeholder="Share your thoughts about this content..."
              value={newReview.comment}
              onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
              sx={{ mb: 2 }}
            />
            <Button variant="contained" onClick={handleSubmitReview}>
              Submit Review
            </Button>
          </Box>
          <Divider sx={{ my: 3 }} />
          {content.reviews.map((review) => (
            <Box key={review.id} sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Avatar src={review.user_photo_url}>{review.user_name.charAt(0)}</Avatar>
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Box>
                      <Typography variant="subtitle2" fontWeight={700}>
                        {review.user_name}
                        {review.is_verified_purchase && (
                          <VerifiedIcon sx={{ fontSize: 16, ml: 0.5, color: 'primary.main' }} />
                        )}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(review.created_at).toLocaleDateString()}
                      </Typography>
                    </Box>
                    <Rating value={review.rating} size="small" readOnly />
                  </Box>
                  <Typography variant="body2" paragraph>
                    {review.comment}
                  </Typography>
                  <Button size="small" startIcon={<ThumbUpIcon />} sx={{ textTransform: 'none' }}>
                    Helpful ({review.helpful_count})
                  </Button>
                </Box>
              </Box>
            </Box>
          ))}
        </TabPanel>

        <TabPanel value={currentTab} index={1}>
          <Grid container spacing={2}>
            {content.related_content.map((item) => (
              <Grid item xs={12} sm={6} key={item.id}>
                <ContentCard content={item} onClick={() => {}} />
              </Grid>
            ))}
          </Grid>
        </TabPanel>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        {content.is_free ? (
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={() => onPurchase(content)}
          >
            Download Free
          </Button>
        ) : (
          <Button variant="contained" startIcon={<CartIcon />} onClick={() => onPurchase(content)}>
            Purchase for {content.price} Credits
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

export default function StudentContentMarketplace() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { contentId } = useParams();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [filteredContents, setFilteredContents] = useState<ContentItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedContent, setSelectedContent] = useState<ContentDetails | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  const [filters, setFilters] = useState<SearchFilters>({
    subject: '',
    topic: '',
    grade: '',
    content_type: '',
    price_type: 'all',
    min_rating: 0,
    sort_by: 'popular',
  });

  const subjects = [
    'Mathematics',
    'Physics',
    'Chemistry',
    'Biology',
    'English',
    'Computer Science',
    'History',
    'Geography',
  ];
  const grades = ['Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];
  const contentTypes = ['pdf', 'video', 'slides', 'notes', 'quiz', 'worksheet'];

  useEffect(() => {
    loadContents();
    if (contentId) {
      loadContentDetails(contentId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentId]);

  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contents, searchQuery, filters]);

  const loadContents = async () => {
    try {
      setLoading(true);
      const data = await contentMarketplaceApi.searchContent(searchQuery, filters);
      setContents(data);
      setError(null);
    } catch (err) {
      setError('Failed to load content');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadContentDetails = async (id: string) => {
    try {
      const data = await contentMarketplaceApi.getContentDetails(id);
      setSelectedContent(data);
      setShowDetailDialog(true);
    } catch (err) {
      console.error('Failed to load content details:', err);
    }
  };

  const applyFilters = () => {
    let filtered = contents;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.title.toLowerCase().includes(query) ||
          c.description.toLowerCase().includes(query) ||
          c.subject.toLowerCase().includes(query) ||
          c.topic.toLowerCase().includes(query) ||
          c.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    if (filters.subject) {
      filtered = filtered.filter((c) => c.subject === filters.subject);
    }

    if (filters.grade) {
      filtered = filtered.filter((c) => c.grade === filters.grade);
    }

    if (filters.content_type) {
      filtered = filtered.filter((c) => c.content_type === filters.content_type);
    }

    if (filters.price_type === 'free') {
      filtered = filtered.filter((c) => c.is_free);
    } else if (filters.price_type === 'paid') {
      filtered = filtered.filter((c) => !c.is_free);
    }

    if (filters.min_rating && filters.min_rating > 0) {
      filtered = filtered.filter((c) => c.rating >= filters.min_rating!);
    }

    if (filters.sort_by) {
      filtered = [...filtered].sort((a, b) => {
        switch (filters.sort_by) {
          case 'popular':
            return b.total_purchases - a.total_purchases;
          case 'recent':
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          case 'rating':
            return b.rating - a.rating;
          case 'price_low':
            return a.price - b.price;
          case 'price_high':
            return b.price - a.price;
          default:
            return 0;
        }
      });
    }

    setFilteredContents(filtered);
  };

  const handleContentClick = async (content: ContentItem) => {
    await loadContentDetails(content.id);
  };

  const handlePurchase = async (content: ContentDetails) => {
    try {
      await contentMarketplaceApi.purchaseContent(content.id, false);
      setShowDetailDialog(false);
      navigate('/student/content-marketplace/purchases');
    } catch (err) {
      console.error('Failed to purchase content:', err);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Student Content Marketplace
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Discover and purchase high-quality study materials created by your peers
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper elevation={0} sx={{ p: 3, mb: 3, border: `1px solid ${theme.palette.divider}` }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search by title, subject, topic, or tags..."
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
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Sort By</InputLabel>
              <Select
                value={filters.sort_by}
                label="Sort By"
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    sort_by: e.target.value as
                      | 'recent'
                      | 'rating'
                      | 'popular'
                      | 'price_low'
                      | 'price_high',
                  })
                }
              >
                <MenuItem value="popular">Most Popular</MenuItem>
                <MenuItem value="recent">Most Recent</MenuItem>
                <MenuItem value="rating">Highest Rated</MenuItem>
                <MenuItem value="price_low">Price: Low to High</MenuItem>
                <MenuItem value="price_high">Price: High to Low</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<FilterIcon />}
              onClick={() => setShowFilters(!showFilters)}
            >
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Grid container spacing={3}>
        {showFilters && (
          <Grid item xs={12} md={3}>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                border: `1px solid ${theme.palette.divider}`,
                position: 'sticky',
                top: 16,
              }}
            >
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Filters
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Subject</InputLabel>
                <Select
                  value={filters.subject}
                  label="Subject"
                  onChange={(e) => setFilters({ ...filters, subject: e.target.value })}
                >
                  <MenuItem value="">All Subjects</MenuItem>
                  {subjects.map((subject) => (
                    <MenuItem key={subject} value={subject}>
                      {subject}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Grade</InputLabel>
                <Select
                  value={filters.grade}
                  label="Grade"
                  onChange={(e) => setFilters({ ...filters, grade: e.target.value })}
                >
                  <MenuItem value="">All Grades</MenuItem>
                  {grades.map((grade) => (
                    <MenuItem key={grade} value={grade}>
                      {grade}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Content Type</InputLabel>
                <Select
                  value={filters.content_type}
                  label="Content Type"
                  onChange={(e) => setFilters({ ...filters, content_type: e.target.value })}
                >
                  <MenuItem value="">All Types</MenuItem>
                  {contentTypes.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type.toUpperCase()}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Typography variant="subtitle2" gutterBottom>
                Price
              </Typography>
              <FormGroup sx={{ mb: 2 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={filters.price_type === 'all'}
                      onChange={() => setFilters({ ...filters, price_type: 'all' })}
                    />
                  }
                  label="All"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={filters.price_type === 'free'}
                      onChange={() => setFilters({ ...filters, price_type: 'free' })}
                    />
                  }
                  label="Free Only"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={filters.price_type === 'paid'}
                      onChange={() => setFilters({ ...filters, price_type: 'paid' })}
                    />
                  }
                  label="Paid Only"
                />
              </FormGroup>

              <Typography variant="subtitle2" gutterBottom>
                Minimum Rating
              </Typography>
              <Rating
                value={filters.min_rating}
                onChange={(_e, value) => setFilters({ ...filters, min_rating: value || 0 })}
                precision={0.5}
              />

              <Button
                fullWidth
                variant="outlined"
                sx={{ mt: 2 }}
                onClick={() =>
                  setFilters({
                    subject: '',
                    topic: '',
                    grade: '',
                    content_type: '',
                    price_type: 'all',
                    min_rating: 0,
                    sort_by: 'popular',
                  })
                }
              >
                Clear Filters
              </Button>
            </Paper>
          </Grid>
        )}

        <Grid item xs={12} md={showFilters ? 9 : 12}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              {filteredContents.length} content item{filteredContents.length !== 1 ? 's' : ''} found
            </Typography>
          </Box>

          <Grid container spacing={3}>
            {filteredContents.map((content) => (
              <Grid item xs={12} sm={6} md={showFilters ? 4 : 3} key={content.id}>
                <ContentCard content={content} onClick={handleContentClick} />
              </Grid>
            ))}
            {filteredContents.length === 0 && (
              <Grid item xs={12}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 6,
                    textAlign: 'center',
                    border: `1px solid ${theme.palette.divider}`,
                  }}
                >
                  <SearchIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No content found
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Try adjusting your search filters
                  </Typography>
                </Paper>
              </Grid>
            )}
          </Grid>
        </Grid>
      </Grid>

      <ContentDetailDialog
        content={selectedContent}
        open={showDetailDialog}
        onClose={() => setShowDetailDialog(false)}
        onPurchase={handlePurchase}
      />
    </Box>
  );
}

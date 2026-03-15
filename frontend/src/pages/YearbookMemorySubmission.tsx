import { useState } from 'react';
import {
  Box,
  Typography,
  Container,
  Grid,
  Paper,
  Button,
  Card,
  CardContent,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Stack,
  IconButton,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  useTheme,
  alpha,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Comment as CommentIcon,
  Share as ShareIcon,
  CheckCircle as CheckIcon,
  Pending as PendingIcon,
  Close as CloseIcon,
  EmojiEvents as TrophyIcon,
  Lightbulb as IdeaIcon,
  AutoAwesome as SparkleIcon,
} from '@mui/icons-material';
import { MemorySubmission, QuoteSubmission } from '@/types/yearbook';

const mockMemories: MemorySubmission[] = [
  {
    id: 1,
    studentId: 1,
    studentName: 'Sarah Johnson',
    avatar: '',
    title: 'Best Day Ever',
    content:
      'The day we won the state championship was unforgettable! The energy in the stadium was electric, and seeing all our hard work pay off was incredible.',
    category: 'favorite-moment',
    submittedDate: '2024-03-15',
    status: 'approved',
    likes: 45,
  },
  {
    id: 2,
    studentId: 2,
    studentName: 'Mike Chen',
    avatar: '',
    title: 'The Pizza Incident',
    content:
      'Remember when Mr. Smith accidentally dropped the entire pizza box during the class party? Classic moment!',
    category: 'inside-joke',
    submittedDate: '2024-03-14',
    status: 'pending',
    likes: 28,
  },
];

const mockQuotes: QuoteSubmission[] = [
  {
    id: 1,
    studentId: 1,
    studentName: 'Emma Davis',
    quote: 'The future belongs to those who believe in the beauty of their dreams.',
    author: 'Eleanor Roosevelt',
    category: 'inspirational',
    submittedDate: '2024-03-12',
    status: 'approved',
  },
];

export default function YearbookMemorySubmission() {
  const theme = useTheme();
  const [selectedTab, setSelectedTab] = useState(0);
  const [memories, setMemories] = useState<MemorySubmission[]>(mockMemories);
  const [quotes, setQuotes] = useState<QuoteSubmission[]>(mockQuotes);
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [likedMemories, setLikedMemories] = useState<Set<number>>(new Set());

  const [memoryForm, setMemoryForm] = useState({
    title: '',
    content: '',
    category: 'favorite-moment' as MemorySubmission['category'],
  });

  const [quoteForm, setQuoteForm] = useState({
    quote: '',
    author: '',
    category: 'inspirational' as QuoteSubmission['category'],
  });

  const handleLike = (memoryId: number) => {
    setLikedMemories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(memoryId)) {
        newSet.delete(memoryId);
        setMemories(memories.map((m) => (m.id === memoryId ? { ...m, likes: m.likes - 1 } : m)));
      } else {
        newSet.add(memoryId);
        setMemories(memories.map((m) => (m.id === memoryId ? { ...m, likes: m.likes + 1 } : m)));
      }
      return newSet;
    });
  };

  const handleSubmitMemory = () => {
    const newMemory: MemorySubmission = {
      id: memories.length + 1,
      studentId: 999,
      studentName: 'Current User',
      title: memoryForm.title,
      content: memoryForm.content,
      category: memoryForm.category,
      submittedDate: new Date().toISOString().split('T')[0],
      status: 'pending',
      likes: 0,
    };

    setMemories([newMemory, ...memories]);
    setSubmitDialogOpen(false);
    resetForms();
  };

  const handleSubmitQuote = () => {
    const newQuote: QuoteSubmission = {
      id: quotes.length + 1,
      studentId: 999,
      studentName: 'Current User',
      quote: quoteForm.quote,
      author: quoteForm.author,
      category: quoteForm.category,
      submittedDate: new Date().toISOString().split('T')[0],
      status: 'pending',
    };

    setQuotes([newQuote, ...quotes]);
    setSubmitDialogOpen(false);
    resetForms();
  };

  const resetForms = () => {
    setMemoryForm({
      title: '',
      content: '',
      category: 'favorite-moment',
    });
    setQuoteForm({
      quote: '',
      author: '',
      category: 'inspirational',
    });
  };

  const getCategoryIcon = (category: MemorySubmission['category']) => {
    switch (category) {
      case 'favorite-moment':
        return <TrophyIcon />;
      case 'inside-joke':
        return <SparkleIcon />;
      case 'senior-will':
        return <IdeaIcon />;
      default:
        return <FavoriteIcon />;
    }
  };

  const getCategoryColor = (category: MemorySubmission['category']) => {
    switch (category) {
      case 'favorite-moment':
        return theme.palette.warning.main;
      case 'inside-joke':
        return theme.palette.info.main;
      case 'senior-will':
        return theme.palette.success.main;
      case 'quote':
        return theme.palette.secondary.main;
      default:
        return theme.palette.primary.main;
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" gutterBottom fontWeight={700}>
            Yearbook Memories
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Share your favorite moments, inside jokes, and inspirational quotes
          </Typography>
        </Box>
        <Button
          variant="contained"
          size="large"
          startIcon={<AddIcon />}
          onClick={() => setSubmitDialogOpen(true)}
        >
          Share Memory
        </Button>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, mb: 3 }}>
            <Tabs
              value={selectedTab}
              onChange={(_, newValue) => setSelectedTab(newValue)}
              sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
            >
              <Tab label={`Memories (${memories.length})`} />
              <Tab label={`Quotes (${quotes.length})`} />
              <Tab label="Senior Wills" />
            </Tabs>
          </Paper>

          {selectedTab === 0 && (
            <Stack spacing={2}>
              {memories.map((memory) => (
                <Card
                  key={memory.id}
                  elevation={0}
                  sx={{ border: `1px solid ${theme.palette.divider}` }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar src={memory.avatar} sx={{ width: 48, height: 48 }}>
                          {memory.studentName[0]}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle1" fontWeight={600}>
                            {memory.studentName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(memory.submittedDate).toLocaleDateString()}
                          </Typography>
                        </Box>
                      </Box>
                      <Box>
                        <Chip
                          icon={getCategoryIcon(memory.category)}
                          label={memory.category.replace('-', ' ')}
                          size="small"
                          sx={{
                            bgcolor: alpha(getCategoryColor(memory.category), 0.1),
                            color: getCategoryColor(memory.category),
                          }}
                        />
                      </Box>
                    </Box>

                    <Typography variant="h6" fontWeight={600} gutterBottom>
                      {memory.title}
                    </Typography>
                    <Typography variant="body1" paragraph>
                      {memory.content}
                    </Typography>

                    <Divider sx={{ my: 2 }} />

                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Box sx={{ display: 'flex', gap: 2 }}>
                        <Button
                          size="small"
                          startIcon={
                            likedMemories.has(memory.id) ? <FavoriteIcon /> : <FavoriteBorderIcon />
                          }
                          onClick={() => handleLike(memory.id)}
                          color={likedMemories.has(memory.id) ? 'error' : 'inherit'}
                        >
                          {memory.likes}
                        </Button>
                        <Button size="small" startIcon={<CommentIcon />}>
                          Comment
                        </Button>
                        <Button size="small" startIcon={<ShareIcon />}>
                          Share
                        </Button>
                      </Box>
                      <Chip
                        label={memory.status}
                        size="small"
                        color={memory.status === 'approved' ? 'success' : 'warning'}
                        icon={memory.status === 'approved' ? <CheckIcon /> : <PendingIcon />}
                      />
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          )}

          {selectedTab === 1 && (
            <Stack spacing={2}>
              {quotes.map((quote) => (
                <Card
                  key={quote.id}
                  elevation={0}
                  sx={{
                    border: `1px solid ${theme.palette.divider}`,
                    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ width: 40, height: 40 }}>{quote.studentName[0]}</Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={600}>
                            {quote.studentName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(quote.submittedDate).toLocaleDateString()}
                          </Typography>
                        </Box>
                      </Box>
                      <Chip
                        label={quote.status}
                        size="small"
                        color={quote.status === 'approved' ? 'success' : 'warning'}
                      />
                    </Box>

                    <Box
                      sx={{
                        borderLeft: `4px solid ${theme.palette.primary.main}`,
                        pl: 3,
                        py: 2,
                        my: 2,
                      }}
                    >
                      <Typography variant="h6" fontStyle="italic" gutterBottom>
                        &ldquo;{quote.quote}&rdquo;
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        — {quote.author}
                      </Typography>
                    </Box>

                    <Chip label={quote.category} size="small" variant="outlined" />
                  </CardContent>
                </Card>
              ))}
            </Stack>
          )}

          {selectedTab === 2 && (
            <Paper
              elevation={0}
              sx={{
                border: `1px solid ${theme.palette.divider}`,
                p: 8,
                textAlign: 'center',
              }}
            >
              <IdeaIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Senior Wills Coming Soon
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Leave your legacy by passing down your favorite spot, locker, or tradition
              </Typography>
            </Paper>
          )}
        </Grid>

        <Grid item xs={12} md={4}>
          <Stack spacing={2}>
            <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Categories
                </Typography>
                <Stack spacing={1}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<TrophyIcon />}
                    sx={{ justifyContent: 'flex-start' }}
                  >
                    Favorite Moments
                  </Button>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<SparkleIcon />}
                    sx={{ justifyContent: 'flex-start' }}
                  >
                    Inside Jokes
                  </Button>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<IdeaIcon />}
                    sx={{ justifyContent: 'flex-start' }}
                  >
                    Senior Wills
                  </Button>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<FavoriteIcon />}
                    sx={{ justifyContent: 'flex-start' }}
                  >
                    Inspirational Quotes
                  </Button>
                </Stack>
              </CardContent>
            </Card>

            <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Trending Memories
                </Typography>
                <Stack spacing={2}>
                  {memories.slice(0, 3).map((memory) => (
                    <Box key={memory.id}>
                      <Typography variant="body2" fontWeight={600} gutterBottom>
                        {memory.title}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 24, height: 24 }}>{memory.studentName[0]}</Avatar>
                        <Typography variant="caption" color="text.secondary">
                          {memory.studentName}
                        </Typography>
                        <FavoriteIcon sx={{ fontSize: 14, color: 'error.main', ml: 'auto' }} />
                        <Typography variant="caption">{memory.likes}</Typography>
                      </Box>
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>

            <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Guidelines
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  • Be respectful and positive
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  • No inappropriate content
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  • Memories will be reviewed before publishing
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  • Give credit for quotes
                </Typography>
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>

      <Dialog
        open={submitDialogOpen}
        onClose={() => setSubmitDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Share a Memory
          <IconButton
            onClick={() => setSubmitDialogOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Tabs
            value={selectedTab === 2 ? 0 : selectedTab}
            onChange={(_, newValue) => setSelectedTab(newValue)}
            sx={{ mb: 3 }}
          >
            <Tab label="Memory" />
            <Tab label="Quote" />
          </Tabs>

          {selectedTab === 0 && (
            <Stack spacing={3}>
              <TextField
                label="Title"
                value={memoryForm.title}
                onChange={(e) => setMemoryForm({ ...memoryForm, title: e.target.value })}
                placeholder="Give your memory a catchy title..."
                fullWidth
              />

              <TextField
                label="Your Memory"
                multiline
                rows={6}
                value={memoryForm.content}
                onChange={(e) => setMemoryForm({ ...memoryForm, content: e.target.value })}
                placeholder="Share your favorite moment, inside joke, or advice for underclassmen..."
                fullWidth
              />

              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={memoryForm.category}
                  onChange={(e) =>
                    setMemoryForm({
                      ...memoryForm,
                      category: e.target.value as MemorySubmission['category'],
                    })
                  }
                  label="Category"
                >
                  <MenuItem value="favorite-moment">Favorite Moment</MenuItem>
                  <MenuItem value="inside-joke">Inside Joke</MenuItem>
                  <MenuItem value="senior-will">Senior Will</MenuItem>
                  <MenuItem value="advice">Advice</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          )}

          {selectedTab === 1 && (
            <Stack spacing={3}>
              <TextField
                label="Quote"
                multiline
                rows={4}
                value={quoteForm.quote}
                onChange={(e) => setQuoteForm({ ...quoteForm, quote: e.target.value })}
                placeholder="Enter an inspirational or memorable quote..."
                fullWidth
              />

              <TextField
                label="Author"
                value={quoteForm.author}
                onChange={(e) => setQuoteForm({ ...quoteForm, author: e.target.value })}
                placeholder="Who said this? (e.g., Albert Einstein, Unknown)"
                fullWidth
              />

              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={quoteForm.category}
                  onChange={(e) =>
                    setQuoteForm({
                      ...quoteForm,
                      category: e.target.value as QuoteSubmission['category'],
                    })
                  }
                  label="Category"
                >
                  <MenuItem value="inspirational">Inspirational</MenuItem>
                  <MenuItem value="funny">Funny</MenuItem>
                  <MenuItem value="personal">Personal</MenuItem>
                  <MenuItem value="memorable">Memorable</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSubmitDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={selectedTab === 0 ? handleSubmitMemory : handleSubmitQuote}
            disabled={
              selectedTab === 0
                ? !memoryForm.title || !memoryForm.content
                : !quoteForm.quote || !quoteForm.author
            }
          >
            Submit for Review
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Button,
  CircularProgress,
  Alert,
  Paper,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Avatar,
  Stack,
  List,
  ListItem,
  ListItemText,
  useTheme,
  alpha,
  IconButton,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Edit as RevisionIcon,
  Visibility as ViewIcon,
  Close as CloseIcon,
  PlayCircle as PlayIcon,
  PictureAsPdf as PdfIcon,
  Description as NotesIcon,
  Quiz as QuizIcon,
  InsertDriveFile as FileIcon,
  Warning as WarningIcon,
  CheckCircleOutline as CheckIcon,
  ErrorOutline as ErrorIcon,
  Schedule as PendingIcon,
  Download as DownloadIcon,
  AccountCircle as ProfileIcon,
} from '@mui/icons-material';
import {
  contentMarketplaceApi,
  ModerationQueue,
  ModerationDecision,
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

interface ModerationDialogProps {
  item: ModerationQueue | null;
  open: boolean;
  onClose: () => void;
  onDecision: (decision: ModerationDecision) => void;
}

function ModerationDialog({ item, open, onClose, onDecision }: ModerationDialogProps) {
  const theme = useTheme();
  const [decision, setDecision] = useState<'approve' | 'request_revision' | 'reject' | null>(null);
  const [feedback, setFeedback] = useState('');
  const [improvements, setImprovements] = useState<string[]>([]);
  const [currentImprovement, setCurrentImprovement] = useState('');

  const [accuracyCheck, setAccuracyCheck] = useState(false);
  const [appropriatenessCheck, setAppropriatenessCheck] = useState(false);
  const [originalityCheck, setOriginalityCheck] = useState(false);

  if (!item) return null;

  const getContentIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <PlayIcon sx={{ fontSize: 64, color: 'primary.main' }} />;
      case 'pdf':
        return <PdfIcon sx={{ fontSize: 64, color: 'error.main' }} />;
      case 'notes':
        return <NotesIcon sx={{ fontSize: 64, color: 'info.main' }} />;
      case 'quiz':
        return <QuizIcon sx={{ fontSize: 64, color: 'success.main' }} />;
      default:
        return <FileIcon sx={{ fontSize: 64, color: 'text.secondary' }} />;
    }
  };

  const addImprovement = () => {
    if (currentImprovement && !improvements.includes(currentImprovement)) {
      setImprovements([...improvements, currentImprovement]);
      setCurrentImprovement('');
    }
  };

  const removeImprovement = (improvement: string) => {
    setImprovements(improvements.filter((i) => i !== improvement));
  };

  const handleSubmit = () => {
    if (!decision) return;

    onDecision({
      content_id: item.content.id,
      decision,
      feedback,
      suggested_improvements: improvements.length > 0 ? improvements : undefined,
    });

    setDecision(null);
    setFeedback('');
    setImprovements([]);
    setAccuracyCheck(false);
    setAppropriatenessCheck(false);
    setOriginalityCheck(false);
  };

  const allChecksPass = accuracyCheck && appropriatenessCheck && originalityCheck;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5" fontWeight={700}>
            Review Content Submission
          </Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={3}>
          <Grid item xs={12} md={5}>
            <Paper elevation={0} sx={{ p: 2, border: `1px solid ${theme.palette.divider}` }}>
              {item.content.thumbnail_url ? (
                <CardMedia
                  component="img"
                  image={item.content.thumbnail_url}
                  alt={item.content.title}
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
                  {getContentIcon(item.content.content_type)}
                </Box>
              )}

              <Typography variant="h6" fontWeight={700} gutterBottom>
                {item.content.title}
              </Typography>

              <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                <Chip label={item.content.subject} color="primary" size="small" />
                <Chip label={item.content.grade} color="primary" size="small" />
                <Chip
                  label={item.content.content_type.toUpperCase()}
                  variant="outlined"
                  size="small"
                />
              </Stack>

              <Typography variant="body2" color="text.secondary" paragraph>
                {item.content.description}
              </Typography>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Avatar src={item.content.creator_photo_url}>
                  {item.content.creator_name.charAt(0)}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle2" fontWeight={700}>
                    {item.content.creator_name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Creator
                  </Typography>
                </Box>
                <Button size="small" variant="outlined" startIcon={<ProfileIcon />}>
                  Profile
                </Button>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                  Content Details
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText primary="Topic" secondary={item.content.topic} />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Price"
                      secondary={item.content.is_free ? 'Free' : `${item.content.price} credits`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="File Size"
                      secondary={`${(item.content.file_size / 1024 / 1024).toFixed(1)} MB`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Submitted"
                      secondary={new Date(item.submitted_at).toLocaleString()}
                    />
                  </ListItem>
                </List>
              </Box>

              {item.content.tags.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                    Tags
                  </Typography>
                  <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                    {item.content.tags.map((tag) => (
                      <Chip key={tag} label={tag} size="small" variant="outlined" />
                    ))}
                  </Stack>
                </Box>
              )}

              <Button variant="outlined" fullWidth startIcon={<DownloadIcon />} sx={{ mb: 1 }}>
                Download Content
              </Button>
              <Button variant="outlined" fullWidth startIcon={<ViewIcon />}>
                Preview Content
              </Button>
            </Paper>
          </Grid>

          <Grid item xs={12} md={7}>
            <Paper elevation={0} sx={{ p: 3, border: `1px solid ${theme.palette.divider}` }}>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Quality Checks
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Review the content based on these criteria:
              </Typography>

              <Stack spacing={2} sx={{ mb: 3 }}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    border: `1px solid ${accuracyCheck ? theme.palette.success.main : theme.palette.divider}`,
                    bgcolor: accuracyCheck
                      ? alpha(theme.palette.success.main, 0.05)
                      : 'transparent',
                    cursor: 'pointer',
                  }}
                  onClick={() => setAccuracyCheck(!accuracyCheck)}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {accuracyCheck ? (
                      <CheckIcon sx={{ color: 'success.main', fontSize: 32 }} />
                    ) : (
                      <ErrorIcon sx={{ color: 'text.secondary', fontSize: 32 }} />
                    )}
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle1" fontWeight={700}>
                        Content Accuracy
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Information is factually correct and educationally sound
                      </Typography>
                    </Box>
                  </Box>
                </Paper>

                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    border: `1px solid ${appropriatenessCheck ? theme.palette.success.main : theme.palette.divider}`,
                    bgcolor: appropriatenessCheck
                      ? alpha(theme.palette.success.main, 0.05)
                      : 'transparent',
                    cursor: 'pointer',
                  }}
                  onClick={() => setAppropriatenessCheck(!appropriatenessCheck)}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {appropriatenessCheck ? (
                      <CheckIcon sx={{ color: 'success.main', fontSize: 32 }} />
                    ) : (
                      <WarningIcon sx={{ color: 'text.secondary', fontSize: 32 }} />
                    )}
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle1" fontWeight={700}>
                        Content Appropriateness
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Material is age-appropriate and follows community guidelines
                      </Typography>
                    </Box>
                  </Box>
                </Paper>

                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    border: `1px solid ${originalityCheck ? theme.palette.success.main : theme.palette.divider}`,
                    bgcolor: originalityCheck
                      ? alpha(theme.palette.success.main, 0.05)
                      : 'transparent',
                    cursor: 'pointer',
                  }}
                  onClick={() => setOriginalityCheck(!originalityCheck)}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {originalityCheck ? (
                      <CheckIcon sx={{ color: 'success.main', fontSize: 32 }} />
                    ) : (
                      <ErrorIcon sx={{ color: 'text.secondary', fontSize: 32 }} />
                    )}
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle1" fontWeight={700}>
                        Originality
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Content is original or properly attributed
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              </Stack>

              <Divider sx={{ my: 3 }} />

              <Typography variant="h6" fontWeight={700} gutterBottom>
                Review Decision
              </Typography>

              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Decision</InputLabel>
                <Select
                  value={decision || ''}
                  label="Decision"
                  onChange={(e) =>
                    setDecision(e.target.value as 'approve' | 'request_revision' | 'reject')
                  }
                >
                  <MenuItem value="approve">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ApproveIcon sx={{ color: 'success.main' }} />
                      Approve
                    </Box>
                  </MenuItem>
                  <MenuItem value="request_revision">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <RevisionIcon sx={{ color: 'warning.main' }} />
                      Request Revision
                    </Box>
                  </MenuItem>
                  <MenuItem value="reject">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <RejectIcon sx={{ color: 'error.main' }} />
                      Reject
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>

              <TextField
                fullWidth
                label="Feedback"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                multiline
                rows={4}
                placeholder="Provide detailed feedback to the creator..."
                sx={{ mb: 3 }}
              />

              {decision === 'request_revision' && (
                <Box>
                  <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                    Suggested Improvements
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Add improvement suggestion"
                      value={currentImprovement}
                      onChange={(e) => setCurrentImprovement(e.target.value)}
                      onKeyPress={(e) =>
                        e.key === 'Enter' && (e.preventDefault(), addImprovement())
                      }
                    />
                    <Button onClick={addImprovement}>Add</Button>
                  </Box>
                  <Stack spacing={1}>
                    {improvements.map((improvement, idx) => (
                      <Chip
                        key={idx}
                        label={improvement}
                        onDelete={() => removeImprovement(improvement)}
                      />
                    ))}
                  </Stack>
                </Box>
              )}

              {!allChecksPass && decision && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  Some quality checks are not marked as passed. Please ensure all criteria are met
                  before approving.
                </Alert>
              )}
            </Paper>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!decision || (decision === 'approve' && !allChecksPass)}
          color={decision === 'approve' ? 'success' : decision === 'reject' ? 'error' : 'warning'}
        >
          Submit {decision ? decision.replace('_', ' ').toUpperCase() : 'Decision'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function TeacherContentModeration() {
  const theme = useTheme();
  const [currentTab, setCurrentTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [queue, setQueue] = useState<ModerationQueue[]>([]);
  const [history, setHistory] = useState<ModerationQueue[]>([]);
  const [selectedItem, setSelectedItem] = useState<ModerationQueue | null>(null);
  const [showModerationDialog, setShowModerationDialog] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [queueData, historyData] = await Promise.all([
        contentMarketplaceApi.getModerationQueue(),
        contentMarketplaceApi.getModerationHistory(50),
      ]);
      setQueue(queueData);
      setHistory(historyData);
      setError(null);
    } catch (err) {
      setError('Failed to load moderation data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = (item: ModerationQueue) => {
    setSelectedItem(item);
    setShowModerationDialog(true);
  };

  const handleDecision = async (decision: ModerationDecision) => {
    try {
      await contentMarketplaceApi.moderateContent(decision);
      setShowModerationDialog(false);
      setSelectedItem(null);
      loadData();
    } catch (err) {
      console.error('Failed to submit decision:', err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      case 'pending_review':
        return 'warning';
      default:
        return 'default';
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
          Content Moderation
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Review student-created content for accuracy, appropriateness, and quality
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar
                  sx={{ bgcolor: alpha(theme.palette.warning.main, 0.1), width: 56, height: 56 }}
                >
                  <PendingIcon sx={{ fontSize: 32, color: 'warning.main' }} />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight={700}>
                    {queue.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pending Review
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar
                  sx={{ bgcolor: alpha(theme.palette.success.main, 0.1), width: 56, height: 56 }}
                >
                  <ApproveIcon sx={{ fontSize: 32, color: 'success.main' }} />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight={700}>
                    {history.filter((h) => h.content.status === 'approved').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Approved
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar
                  sx={{ bgcolor: alpha(theme.palette.error.main, 0.1), width: 56, height: 56 }}
                >
                  <RejectIcon sx={{ fontSize: 32, color: 'error.main' }} />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight={700}>
                    {history.filter((h) => h.content.status === 'rejected').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Rejected
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={currentTab} onChange={(_e, v) => setCurrentTab(v)}>
          <Tab label={`Review Queue (${queue.length})`} />
          <Tab label="History" />
        </Tabs>
      </Box>

      <TabPanel value={currentTab} index={0}>
        {queue.length === 0 ? (
          <Paper
            elevation={0}
            sx={{
              p: 6,
              textAlign: 'center',
              border: `1px solid ${theme.palette.divider}`,
            }}
          >
            <CheckIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No content pending review
            </Typography>
            <Typography variant="body2" color="text.secondary">
              All submissions have been reviewed
            </Typography>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {queue.map((item) => (
              <Grid item xs={12} sm={6} md={4} key={item.id}>
                <Card
                  elevation={0}
                  sx={{
                    height: '100%',
                    border: `1px solid ${theme.palette.divider}`,
                    transition: 'all 0.3s',
                    '&:hover': {
                      boxShadow: theme.shadows[4],
                    },
                  }}
                >
                  {item.content.thumbnail_url && (
                    <CardMedia
                      component="img"
                      height="140"
                      image={item.content.thumbnail_url}
                      alt={item.content.title}
                    />
                  )}
                  <CardContent>
                    <Typography variant="h6" fontWeight={700} gutterBottom noWrap>
                      {item.content.title}
                    </Typography>
                    <Stack direction="row" spacing={0.5} sx={{ mb: 2 }}>
                      <Chip label={item.content.subject} size="small" color="primary" />
                      <Chip label={item.content.grade} size="small" variant="outlined" />
                    </Stack>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <Avatar src={item.content.creator_photo_url} sx={{ width: 24, height: 24 }}>
                        {item.content.creator_name.charAt(0)}
                      </Avatar>
                      <Typography variant="caption" color="text.secondary">
                        {item.content.creator_name}
                      </Typography>
                    </Box>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      display="block"
                      sx={{ mb: 2 }}
                    >
                      Submitted {new Date(item.submitted_at).toLocaleDateString()}
                    </Typography>
                    <Button variant="contained" fullWidth onClick={() => handleReview(item)}>
                      Review
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </TabPanel>

      <TabPanel value={currentTab} index={1}>
        <TableContainer
          component={Paper}
          elevation={0}
          sx={{ border: `1px solid ${theme.palette.divider}` }}
        >
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Content</TableCell>
                <TableCell>Creator</TableCell>
                <TableCell>Subject</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Reviewed</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {history.map((item) => (
                <TableRow key={item.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>
                      {item.content.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {item.content.content_type.toUpperCase()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar src={item.content.creator_photo_url} sx={{ width: 32, height: 32 }}>
                        {item.content.creator_name.charAt(0)}
                      </Avatar>
                      <Typography variant="body2">{item.content.creator_name}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip label={item.content.subject} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={item.content.status.replace('_', ' ').toUpperCase()}
                      size="small"
                      color={
                        getStatusColor(item.content.status) as
                          | 'default'
                          | 'primary'
                          | 'secondary'
                          | 'error'
                          | 'info'
                          | 'success'
                          | 'warning'
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {new Date(item.submitted_at).toLocaleDateString()}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small">
                      <ViewIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {history.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                    <Typography variant="body2" color="text.secondary">
                      No moderation history available
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      <ModerationDialog
        item={selectedItem}
        open={showModerationDialog}
        onClose={() => {
          setShowModerationDialog(false);
          setSelectedItem(null);
        }}
        onDecision={handleDecision}
      />
    </Box>
  );
}

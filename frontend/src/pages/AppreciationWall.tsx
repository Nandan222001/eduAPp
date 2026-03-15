import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Avatar,
  Chip,
  IconButton,
  Tooltip,
  ToggleButtonGroup,
  ToggleButton,
  CircularProgress,
  Alert,
  useTheme,
  alpha,
  Divider,
  Stack,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import {
  ThumbUp as ThumbUpIcon,
  ThumbUpOutlined as ThumbUpOutlinedIcon,
  Flag as FlagIcon,
  FilterList as FilterIcon,
  Whatshot as TrendingIcon,
  EmojiEvents as TrophyIcon,
  School as SchoolIcon,
  Group as TeamIcon,
  Lightbulb as LightbulbIcon,
  Psychology as LeadershipIcon,
  Favorite as KindnessIcon,
  TrendingUp as PerseveranceIcon,
  Star as ImprovementIcon,
} from '@mui/icons-material';
import recognitionApi from '@/api/recognition';
import { useToast } from '@/hooks/useToast';
import type { RecognitionType } from '@/types/recognition';

const recognitionTypes = [
  { type: 'academic_excellence', label: 'Academic Excellence', icon: 'trophy', color: '#FFD700' },
  { type: 'helpful_peer', label: 'Helpful Peer', icon: 'school', color: '#4CAF50' },
  { type: 'team_player', label: 'Team Player', icon: 'team', color: '#2196F3' },
  { type: 'creative_thinker', label: 'Creative Thinker', icon: 'lightbulb', color: '#FF9800' },
  { type: 'leadership', label: 'Leadership', icon: 'leadership', color: '#9C27B0' },
  { type: 'kindness', label: 'Kindness', icon: 'kindness', color: '#E91E63' },
  { type: 'perseverance', label: 'Perseverance', icon: 'perseverance', color: '#FF5722' },
  { type: 'improvement', label: 'Most Improved', icon: 'improvement', color: '#00BCD4' },
];

const getRecognitionIcon = (type: string) => {
  switch (type) {
    case 'trophy':
      return <TrophyIcon />;
    case 'school':
      return <SchoolIcon />;
    case 'team':
      return <TeamIcon />;
    case 'lightbulb':
      return <LightbulbIcon />;
    case 'leadership':
      return <LeadershipIcon />;
    case 'kindness':
      return <KindnessIcon />;
    case 'perseverance':
      return <PerseveranceIcon />;
    case 'improvement':
      return <ImprovementIcon />;
    default:
      return <TrophyIcon />;
  }
};

interface RecognitionCardProps {
  recognition: {
    id: number;
    sender_name: string;
    recipient_name: string;
    recipient_avatar?: string;
    recognition_type: string;
    message: string;
    created_at: string;
    likes_count: number;
    is_liked_by_user: boolean;
  };
  onLike: (id: number) => void;
  onUnlike: (id: number) => void;
  onFlag: (id: number) => void;
}

function RecognitionCard({ recognition, onLike, onUnlike, onFlag }: RecognitionCardProps) {
  const theme = useTheme();
  const typeInfo = recognitionTypes.find((t) => t.type === recognition.recognition_type);

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.3s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: theme.shadows[8],
        },
      }}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        {typeInfo && (
          <Box sx={{ mb: 2, textAlign: 'center' }}>
            <Avatar
              sx={{
                bgcolor: alpha(typeInfo.color, 0.2),
                color: typeInfo.color,
                width: 64,
                height: 64,
                mx: 'auto',
                mb: 1,
              }}
            >
              {getRecognitionIcon(typeInfo.icon)}
            </Avatar>
            <Chip
              label={typeInfo.label}
              size="small"
              sx={{
                bgcolor: alpha(typeInfo.color, 0.1),
                color: typeInfo.color,
                fontWeight: 600,
              }}
            />
          </Box>
        )}

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Avatar src={recognition.recipient_avatar} sx={{ width: 48, height: 48 }}>
            {recognition.recipient_name.charAt(0)}
          </Avatar>
          <Box>
            <Typography variant="body1" fontWeight={600}>
              {recognition.recipient_name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              recognized by {recognition.sender_name}
            </Typography>
          </Box>
        </Box>

        <Typography variant="body2" sx={{ mb: 2, fontStyle: 'italic' }}>
          &ldquo;{recognition.message}&rdquo;
        </Typography>

        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
          {new Date(recognition.created_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </Typography>

        <Divider sx={{ mb: 2 }} />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Tooltip title={recognition.is_liked_by_user ? 'Unlike' : 'Like'}>
              <IconButton
                size="small"
                onClick={() =>
                  recognition.is_liked_by_user ? onUnlike(recognition.id) : onLike(recognition.id)
                }
                color={recognition.is_liked_by_user ? 'primary' : 'default'}
              >
                {recognition.is_liked_by_user ? <ThumbUpIcon /> : <ThumbUpOutlinedIcon />}
              </IconButton>
            </Tooltip>
            <Typography variant="body2">{recognition.likes_count}</Typography>
          </Box>

          <Tooltip title="Report inappropriate content">
            <IconButton size="small" onClick={() => onFlag(recognition.id)}>
              <FlagIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </CardContent>
    </Card>
  );
}

interface FlagDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (reason: string, description: string) => void;
}

function FlagDialog({ open, onClose, onSubmit }: FlagDialogProps) {
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = () => {
    if (reason) {
      onSubmit(reason, description);
      setReason('');
      setDescription('');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Report Recognition</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Please select a reason for reporting this recognition
        </Typography>
        <ToggleButtonGroup
          value={reason}
          exclusive
          onChange={(_, value) => value && setReason(value)}
          orientation="vertical"
          fullWidth
          sx={{ mb: 2 }}
        >
          <ToggleButton value="inappropriate">Inappropriate Content</ToggleButton>
          <ToggleButton value="spam">Spam</ToggleButton>
          <ToggleButton value="bullying">Bullying or Harassment</ToggleButton>
          <ToggleButton value="false">False Information</ToggleButton>
          <ToggleButton value="other">Other</ToggleButton>
        </ToggleButtonGroup>

        <TextField
          fullWidth
          multiline
          rows={3}
          label="Additional Details (Optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Provide more context about why you're reporting this..."
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={!reason}>
          Submit Report
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function AppreciationWall() {
  const theme = useTheme();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [filterType, setFilterType] = useState<RecognitionType | null>(null);
  const [flagDialogOpen, setFlagDialogOpen] = useState(false);
  const [selectedRecognitionId, setSelectedRecognitionId] = useState<number | null>(null);

  const { data: publicRecognitions, isLoading } = useQuery({
    queryKey: ['publicRecognitions', filterType],
    queryFn: () =>
      recognitionApi.getPublicRecognitions(filterType ? { recognition_type: filterType } : {}),
  });

  const { data: trendingRecognitions } = useQuery({
    queryKey: ['trendingRecognitions'],
    queryFn: () => recognitionApi.getTrendingRecognitions(5),
  });

  const { data: studentSpotlight } = useQuery({
    queryKey: ['studentSpotlight'],
    queryFn: () => recognitionApi.getStudentSpotlight('weekly'),
  });

  const likeMutation = useMutation({
    mutationFn: recognitionApi.likeRecognition,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['publicRecognitions'] });
      queryClient.invalidateQueries({ queryKey: ['trendingRecognitions'] });
    },
  });

  const unlikeMutation = useMutation({
    mutationFn: recognitionApi.unlikeRecognition,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['publicRecognitions'] });
      queryClient.invalidateQueries({ queryKey: ['trendingRecognitions'] });
    },
  });

  const flagMutation = useMutation({
    mutationFn: (data: { recognition_id: number; reason: string; description?: string }) =>
      recognitionApi.flagRecognition(data),
    onSuccess: () => {
      showToast('Recognition has been flagged for review', 'success');
      setFlagDialogOpen(false);
      setSelectedRecognitionId(null);
    },
    onError: () => {
      showToast('Failed to flag recognition', 'error');
    },
  });

  const handleFlag = (id: number) => {
    setSelectedRecognitionId(id);
    setFlagDialogOpen(true);
  };

  const handleFlagSubmit = (reason: string, description: string) => {
    if (selectedRecognitionId) {
      flagMutation.mutate({
        recognition_id: selectedRecognitionId,
        reason,
        description,
      });
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Appreciation Wall
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Celebrate the positive achievements and contributions of our school community
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 2,
              }}
            >
              <Typography variant="h6">
                <FilterIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                Filter by Type
              </Typography>
              <Button size="small" onClick={() => setFilterType(null)}>
                Clear Filter
              </Button>
            </Box>
            <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
              {recognitionTypes.map((type) => (
                <Chip
                  key={type.type}
                  icon={getRecognitionIcon(type.icon)}
                  label={type.label}
                  onClick={() =>
                    setFilterType(filterType === type.type ? null : (type.type as RecognitionType))
                  }
                  color={filterType === type.type ? 'primary' : 'default'}
                  sx={{
                    bgcolor: filterType === type.type ? undefined : alpha(type.color, 0.1),
                    color: filterType === type.type ? undefined : type.color,
                    '&:hover': {
                      bgcolor: filterType === type.type ? undefined : alpha(type.color, 0.2),
                    },
                  }}
                />
              ))}
            </Stack>
          </Paper>

          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : publicRecognitions?.items.length === 0 ? (
            <Alert severity="info">No public recognitions yet</Alert>
          ) : (
            <Grid container spacing={3}>
              {publicRecognitions?.items.map((recognition) => (
                <Grid item xs={12} sm={6} key={recognition.id}>
                  <RecognitionCard
                    recognition={recognition}
                    onLike={likeMutation.mutate}
                    onUnlike={unlikeMutation.mutate}
                    onFlag={handleFlag}
                  />
                </Grid>
              ))}
            </Grid>
          )}
        </Grid>

        <Grid item xs={12} md={4}>
          <Stack spacing={3}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                <TrendingIcon sx={{ verticalAlign: 'middle', mr: 1, color: 'warning.main' }} />
                Trending Appreciations
              </Typography>
              <Divider sx={{ mb: 2 }} />
              {trendingRecognitions && trendingRecognitions.length > 0 ? (
                <List>
                  {trendingRecognitions.map((recognition, index) => (
                    <ListItem
                      key={recognition.id}
                      sx={{
                        px: 0,
                        borderRadius: 1,
                        '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.05) },
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar
                          sx={{
                            bgcolor: alpha(theme.palette.warning.main, 0.2),
                            color: 'warning.main',
                          }}
                        >
                          {index + 1}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={recognition.recipient_name}
                        secondary={
                          <>
                            <Typography component="span" variant="caption" color="text.secondary">
                              {
                                recognitionTypes.find(
                                  (t) => t.type === recognition.recognition_type
                                )?.label
                              }
                            </Typography>
                            <br />
                            <Typography component="span" variant="caption">
                              {recognition.likes_count} likes
                            </Typography>
                          </>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No trending recognitions yet
                </Typography>
              )}
            </Paper>

            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                <TrophyIcon sx={{ verticalAlign: 'middle', mr: 1, color: 'primary.main' }} />
                Student Spotlight
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
                Most recognized students this week
              </Typography>
              <Divider sx={{ mb: 2 }} />
              {studentSpotlight && studentSpotlight.length > 0 ? (
                <Stack spacing={2}>
                  {studentSpotlight.map((student, index) => (
                    <Card
                      key={student.student_id}
                      variant="outlined"
                      sx={{
                        bgcolor:
                          index === 0
                            ? alpha(theme.palette.primary.main, 0.05)
                            : 'background.paper',
                      }}
                    >
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar
                            src={student.student_avatar}
                            sx={{
                              width: 48,
                              height: 48,
                              border:
                                index === 0 ? `2px solid ${theme.palette.primary.main}` : undefined,
                            }}
                          >
                            {student.student_name.charAt(0)}
                          </Avatar>
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="body1" fontWeight={600}>
                              {student.student_name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {student.recognition_count} recognitions
                            </Typography>
                          </Box>
                          {index === 0 && (
                            <Avatar
                              sx={{
                                bgcolor: alpha(theme.palette.warning.main, 0.2),
                                color: 'warning.main',
                              }}
                            >
                              <TrophyIcon />
                            </Avatar>
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No spotlight data available yet
                </Typography>
              )}
            </Paper>
          </Stack>
        </Grid>
      </Grid>

      <FlagDialog
        open={flagDialogOpen}
        onClose={() => {
          setFlagDialogOpen(false);
          setSelectedRecognitionId(null);
        }}
        onSubmit={handleFlagSubmit}
      />
    </Box>
  );
}

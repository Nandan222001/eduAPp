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
  IconButton,
  Chip,
  Stack,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
  Alert,
  CircularProgress,
  alpha,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  MenuBook as JournalIcon,
  EmojiObjects as LightbulbIcon,
  TrendingUp as GrowthIcon,
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import communityServiceApi from '@/api/communityService';
import { ServiceReflectionEntry } from '@/types/communityService';
import ServiceReflectionDialog from '@/components/communityService/ServiceReflectionDialog';

export default function ServiceReflectionJournal() {
  const [reflections, setReflections] = useState<ServiceReflectionEntry[]>([]);
  const [selectedReflection, setSelectedReflection] = useState<ServiceReflectionEntry | null>(null);
  const [reflectionDialogOpen, setReflectionDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReflections();
  }, []);

  const fetchReflections = async () => {
    try {
      setLoading(true);
      const data = await communityServiceApi.getMyReflections();
      setReflections(data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      setError(null);
    } catch (err) {
      console.error('Failed to fetch reflections:', err);
      setError('Failed to load reflection journal');
    } finally {
      setLoading(false);
    }
  };

  const handleViewReflection = (reflection: ServiceReflectionEntry) => {
    setSelectedReflection(reflection);
    setViewDialogOpen(true);
  };

  const handleDeleteReflection = async (reflectionId: number) => {
    if (window.confirm('Are you sure you want to delete this reflection?')) {
      try {
        await communityServiceApi.deleteReflection(reflectionId);
        await fetchReflections();
      } catch (err) {
        console.error('Failed to delete reflection:', err);
        alert('Failed to delete reflection');
      }
    }
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Service Reflection Journal
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Document your learnings and personal growth from community service
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setReflectionDialogOpen(true)}
        >
          New Reflection
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {reflections.length === 0 ? (
        <Paper sx={{ p: 8, textAlign: 'center' }}>
          <JournalIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No reflections yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Start documenting your community service experiences and personal growth
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setReflectionDialogOpen(true)}
          >
            Write Your First Reflection
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {reflections.map((reflection) => (
            <Grid item xs={12} md={6} lg={4} key={reflection.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardHeader
                  title={reflection.title}
                  subheader={format(parseISO(reflection.date), 'MMMM d, yyyy')}
                  action={
                    <Stack direction="row" spacing={0.5}>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteReflection(reflection.id)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  }
                />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      display: '-webkit-box',
                      WebkitLineClamp: 4,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      mb: 2,
                    }}
                  >
                    {reflection.reflection_text}
                  </Typography>

                  <Divider sx={{ my: 2 }} />

                  {reflection.learnings.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <LightbulbIcon fontSize="small" color="primary" />
                        <Typography variant="caption" fontWeight={600}>
                          Learnings
                        </Typography>
                      </Box>
                      <Stack direction="row" flexWrap="wrap" gap={0.5}>
                        {reflection.learnings.slice(0, 3).map((learning, index) => (
                          <Chip
                            key={index}
                            label={learning}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        ))}
                        {reflection.learnings.length > 3 && (
                          <Chip
                            label={`+${reflection.learnings.length - 3} more`}
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </Stack>
                    </Box>
                  )}

                  {reflection.personal_growth_areas.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <GrowthIcon fontSize="small" color="success" />
                        <Typography variant="caption" fontWeight={600}>
                          Personal Growth
                        </Typography>
                      </Box>
                      <Stack direction="row" flexWrap="wrap" gap={0.5}>
                        {reflection.personal_growth_areas.slice(0, 3).map((growth, index) => (
                          <Chip
                            key={index}
                            label={growth}
                            size="small"
                            color="success"
                            variant="outlined"
                          />
                        ))}
                        {reflection.personal_growth_areas.length > 3 && (
                          <Chip
                            label={`+${reflection.personal_growth_areas.length - 3} more`}
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </Stack>
                    </Box>
                  )}

                  {reflection.emotions.length > 0 && (
                    <Stack direction="row" flexWrap="wrap" gap={0.5} sx={{ mt: 2 }}>
                      {reflection.emotions.slice(0, 4).map((emotion, index) => (
                        <Chip key={index} label={emotion} size="small" variant="outlined" />
                      ))}
                    </Stack>
                  )}
                </CardContent>
                <Box sx={{ p: 2, pt: 0 }}>
                  <Button fullWidth size="small" onClick={() => handleViewReflection(reflection)}>
                    View Full Reflection
                  </Button>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Reflection Dialog */}
      <ServiceReflectionDialog
        open={reflectionDialogOpen}
        onClose={() => setReflectionDialogOpen(false)}
        onSuccess={fetchReflections}
      />

      {/* View Dialog */}
      <Dialog
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedReflection && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="h6">{selectedReflection.title}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {format(parseISO(selectedReflection.date), 'MMMM d, yyyy')}
                  </Typography>
                </Box>
                <IconButton onClick={() => setViewDialogOpen(false)}>
                  <CloseIcon />
                </IconButton>
              </Box>
            </DialogTitle>
            <DialogContent>
              <Stack spacing={3}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Reflection
                  </Typography>
                  <Typography variant="body1">{selectedReflection.reflection_text}</Typography>
                </Box>

                {selectedReflection.learnings.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      What I Learned
                    </Typography>
                    <Stack spacing={1}>
                      {selectedReflection.learnings.map((learning, index) => (
                        <Paper
                          key={index}
                          sx={{
                            p: 1.5,
                            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.05),
                          }}
                        >
                          <Typography variant="body2">• {learning}</Typography>
                        </Paper>
                      ))}
                    </Stack>
                  </Box>
                )}

                {selectedReflection.challenges_faced.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Challenges Faced
                    </Typography>
                    <Stack spacing={1}>
                      {selectedReflection.challenges_faced.map((challenge, index) => (
                        <Paper
                          key={index}
                          sx={{
                            p: 1.5,
                            bgcolor: (theme) => alpha(theme.palette.warning.main, 0.05),
                          }}
                        >
                          <Typography variant="body2">• {challenge}</Typography>
                        </Paper>
                      ))}
                    </Stack>
                  </Box>
                )}

                {selectedReflection.personal_growth_areas.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Personal Growth
                    </Typography>
                    <Stack spacing={1}>
                      {selectedReflection.personal_growth_areas.map((growth, index) => (
                        <Paper
                          key={index}
                          sx={{
                            p: 1.5,
                            bgcolor: (theme) => alpha(theme.palette.success.main, 0.05),
                          }}
                        >
                          <Typography variant="body2">• {growth}</Typography>
                        </Paper>
                      ))}
                    </Stack>
                  </Box>
                )}

                {selectedReflection.skills_applied.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Skills Applied
                    </Typography>
                    <Stack direction="row" flexWrap="wrap" gap={1}>
                      {selectedReflection.skills_applied.map((skill, index) => (
                        <Chip key={index} label={skill} color="info" variant="outlined" />
                      ))}
                    </Stack>
                  </Box>
                )}

                {selectedReflection.emotions.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      How I Felt
                    </Typography>
                    <Stack direction="row" flexWrap="wrap" gap={1}>
                      {selectedReflection.emotions.map((emotion, index) => (
                        <Chip key={index} label={emotion} color="secondary" variant="outlined" />
                      ))}
                    </Stack>
                  </Box>
                )}

                {selectedReflection.future_goals.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Future Goals
                    </Typography>
                    <Stack spacing={1}>
                      {selectedReflection.future_goals.map((goal, index) => (
                        <Paper
                          key={index}
                          sx={{ p: 1.5, bgcolor: (theme) => alpha(theme.palette.info.main, 0.05) }}
                        >
                          <Typography variant="body2">• {goal}</Typography>
                        </Paper>
                      ))}
                    </Stack>
                  </Box>
                )}
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Container>
  );
}

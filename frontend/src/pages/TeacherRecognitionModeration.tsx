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
  Button,
  CircularProgress,
  Alert,
  useTheme,
  alpha,
  Divider,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Badge,
} from '@mui/material';
import {
  Flag as FlagIcon,
  CheckCircle as ApproveIcon,
  Cancel as RemoveIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import recognitionApi from '@/api/recognition';
import { useToast } from '@/hooks/useToast';

interface ReviewDialogProps {
  open: boolean;
  recognition: {
    recognition?: {
      sender_name: string;
      recipient_name: string;
      message: string;
      id: number;
    };
  } | null;
  action: 'approve' | 'remove';
  onClose: () => void;
  onConfirm: (notes: string) => void;
}

function ReviewDialog({ open, recognition, action, onClose, onConfirm }: ReviewDialogProps) {
  const [notes, setNotes] = useState('');

  const handleConfirm = () => {
    onConfirm(notes);
    setNotes('');
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {action === 'approve' ? 'Approve Recognition' : 'Remove Recognition'}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Recognition Details
          </Typography>
          <Card variant="outlined" sx={{ mt: 1 }}>
            <CardContent>
              <Typography variant="body2">
                <strong>From:</strong> {recognition?.recognition?.sender_name}
              </Typography>
              <Typography variant="body2">
                <strong>To:</strong> {recognition?.recognition?.recipient_name}
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                <strong>Message:</strong> {recognition?.recognition?.message}
              </Typography>
            </CardContent>
          </Card>
        </Box>

        <TextField
          fullWidth
          multiline
          rows={4}
          label="Review Notes"
          placeholder={
            action === 'approve'
              ? 'Add notes about why this is appropriate (optional)...'
              : 'Explain why this content is being removed...'
          }
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          color={action === 'approve' ? 'success' : 'error'}
        >
          {action === 'approve' ? 'Approve' : 'Remove'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function TeacherRecognitionModeration() {
  const theme = useTheme();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedRecognition, setSelectedRecognition] = useState<{
    recognition: {
      id: number;
      sender_name: string;
      recipient_name: string;
      message: string;
    };
  } | null>(null);
  const [reviewAction, setReviewAction] = useState<'approve' | 'remove'>('approve');

  const { data: flaggedRecognitions, isLoading } = useQuery({
    queryKey: ['flaggedRecognitions'],
    queryFn: recognitionApi.getFlaggedRecognitions,
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, notes }: { id: number; notes?: string }) =>
      recognitionApi.approveRecognition(id, notes),
    onSuccess: () => {
      showToast('Recognition approved', 'success');
      queryClient.invalidateQueries({ queryKey: ['flaggedRecognitions'] });
      setReviewDialogOpen(false);
      setSelectedRecognition(null);
    },
    onError: () => {
      showToast('Failed to approve recognition', 'error');
    },
  });

  const removeMutation = useMutation({
    mutationFn: ({ id, notes }: { id: number; notes?: string }) =>
      recognitionApi.removeRecognition(id, notes),
    onSuccess: () => {
      showToast('Recognition removed', 'success');
      queryClient.invalidateQueries({ queryKey: ['flaggedRecognitions'] });
      setReviewDialogOpen(false);
      setSelectedRecognition(null);
    },
    onError: () => {
      showToast('Failed to remove recognition', 'error');
    },
  });

  const handleReview = (
    recognition: {
      recognition: {
        id: number;
        sender_name: string;
        recipient_name: string;
        message: string;
      };
    },
    action: 'approve' | 'remove'
  ) => {
    setSelectedRecognition(recognition);
    setReviewAction(action);
    setReviewDialogOpen(true);
  };

  const handleConfirmReview = (notes: string) => {
    if (!selectedRecognition) return;

    const data = {
      id: selectedRecognition.recognition.id,
      notes,
    };

    if (reviewAction === 'approve') {
      approveMutation.mutate(data);
    } else {
      removeMutation.mutate(data);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          <FlagIcon sx={{ verticalAlign: 'middle', mr: 1, color: 'warning.main' }} />
          Recognition Moderation
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Review flagged recognitions to ensure appropriate content
        </Typography>
      </Box>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : !flaggedRecognitions || flaggedRecognitions.length === 0 ? (
        <Alert severity="success">
          No flagged recognitions to review. Great job maintaining a positive environment!
        </Alert>
      ) : (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Flagged Recognitions ({flaggedRecognitions.length})
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Stack spacing={2}>
                {flaggedRecognitions.map((item) => (
                  <Accordion key={item.id}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          width: '100%',
                          pr: 2,
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Badge badgeContent={item.flag_count} color="error" overlap="circular">
                            <Avatar
                              sx={{
                                bgcolor: alpha(theme.palette.warning.main, 0.2),
                                color: 'warning.main',
                              }}
                            >
                              <FlagIcon />
                            </Avatar>
                          </Badge>
                          <Box>
                            <Typography variant="body1" fontWeight={600}>
                              {item.recognition.sender_name} → {item.recognition.recipient_name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {item.flag_count} report{item.flag_count > 1 ? 's' : ''} •{' '}
                              {new Date(item.recognition.created_at).toLocaleDateString()}
                            </Typography>
                          </Box>
                        </Box>
                        <Chip
                          label={item.status}
                          size="small"
                          color={
                            item.status === 'pending'
                              ? 'warning'
                              : item.status === 'approved'
                                ? 'success'
                                : 'error'
                          }
                        />
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Grid container spacing={2}>
                        <Grid item xs={12}>
                          <Card variant="outlined">
                            <CardContent>
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                Recognition Message
                              </Typography>
                              <Typography variant="body1" sx={{ fontStyle: 'italic', mb: 2 }}>
                                &ldquo;{item.recognition.message}&rdquo;
                              </Typography>
                              <Chip
                                label={item.recognition.recognition_type.replace('_', ' ')}
                                size="small"
                                sx={{ textTransform: 'capitalize' }}
                              />
                            </CardContent>
                          </Card>
                        </Grid>

                        <Grid item xs={12}>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Reports
                          </Typography>
                          <TableContainer component={Paper} variant="outlined">
                            <Table size="small">
                              <TableHead>
                                <TableRow>
                                  <TableCell>Reporter</TableCell>
                                  <TableCell>Reason</TableCell>
                                  <TableCell>Description</TableCell>
                                  <TableCell>Date</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {item.flags.map((flag) => (
                                  <TableRow key={flag.id}>
                                    <TableCell>{flag.user_name}</TableCell>
                                    <TableCell>
                                      <Chip
                                        label={flag.reason}
                                        size="small"
                                        sx={{ textTransform: 'capitalize' }}
                                      />
                                    </TableCell>
                                    <TableCell>{flag.description || '-'}</TableCell>
                                    <TableCell>
                                      {new Date(flag.created_at).toLocaleDateString()}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </Grid>

                        {item.status === 'pending' && (
                          <Grid item xs={12}>
                            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                              <Button
                                variant="outlined"
                                color="success"
                                startIcon={<ApproveIcon />}
                                onClick={() => handleReview(item, 'approve')}
                              >
                                Approve
                              </Button>
                              <Button
                                variant="outlined"
                                color="error"
                                startIcon={<RemoveIcon />}
                                onClick={() => handleReview(item, 'remove')}
                              >
                                Remove
                              </Button>
                            </Box>
                          </Grid>
                        )}

                        {item.review_notes && (
                          <Grid item xs={12}>
                            <Alert severity="info">
                              <Typography variant="body2" fontWeight={600}>
                                Review Notes:
                              </Typography>
                              <Typography variant="body2">{item.review_notes}</Typography>
                              {item.reviewed_at && (
                                <Typography variant="caption" color="text.secondary">
                                  Reviewed on {new Date(item.reviewed_at).toLocaleDateString()}
                                </Typography>
                              )}
                            </Alert>
                          </Grid>
                        )}
                      </Grid>
                    </AccordionDetails>
                  </Accordion>
                ))}
              </Stack>
            </Paper>
          </Grid>
        </Grid>
      )}

      <ReviewDialog
        open={reviewDialogOpen}
        recognition={selectedRecognition}
        action={reviewAction}
        onClose={() => {
          setReviewDialogOpen(false);
          setSelectedRecognition(null);
        }}
        onConfirm={handleConfirmReview}
      />
    </Box>
  );
}

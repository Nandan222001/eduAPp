import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Alert,
  useTheme,
  alpha,
  Chip,
  List,
  ListItem,
  LinearProgress,
  Paper,
  Button,
  Divider,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  Stack,
  Avatar,
} from '@mui/material';
import {
  AccountBalance as TokenIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckCircleIcon,
  Speed as SpeedIcon,
  Psychology as AIIcon,
  History as HistoryIcon,
  ArrowUpward as ArrowUpwardIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { mistakeAnalysisApi } from '@/api/mistakeAnalysis';
import { useAuth } from '@/hooks/useAuth';
import type {
  MistakeInsuranceData,
  SillyMistake,
  TokenEarningCriteria,
  TokenTransaction,
  MistakeCorrection,
} from '@/types/mistakeAnalysis';

interface TokenBalanceCardProps {
  balance: number;
  claimsAvailable: number;
  claimsUsed: number;
}

function TokenBalanceCard({ balance, claimsAvailable, claimsUsed }: TokenBalanceCardProps) {
  const theme = useTheme();

  return (
    <Card
      elevation={0}
      sx={{
        border: `2px solid ${theme.palette.primary.main}`,
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Avatar
            sx={{
              bgcolor: theme.palette.primary.main,
              width: 64,
              height: 64,
            }}
          >
            <TokenIcon sx={{ fontSize: 32 }} />
          </Avatar>
          <Box>
            <Typography variant="h3" fontWeight={700} color="primary.main">
              {balance.toLocaleString()}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Mistake Insurance Tokens
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h5" fontWeight={600}>
                {claimsAvailable}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Claims Available
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h5" fontWeight={600}>
                {claimsUsed}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Claims Used
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}

interface EarningCriteriaCardProps {
  criteria: TokenEarningCriteria[];
}

function EarningCriteriaCard({ criteria }: EarningCriteriaCardProps) {
  const theme = useTheme();

  return (
    <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
      <CardHeader
        title="Earn Tokens"
        subheader="Complete these activities to earn more tokens"
        avatar={<TrendingUpIcon sx={{ color: theme.palette.success.main }} />}
      />
      <CardContent sx={{ pt: 0 }}>
        <List sx={{ py: 0 }}>
          {criteria.map((criterion, index) => {
            const progressPercent = (criterion.current_progress / criterion.target_progress) * 100;

            return (
              <Box key={criterion.id}>
                <ListItem sx={{ px: 0, py: 2, alignItems: 'flex-start' }}>
                  <Box sx={{ width: '100%' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body1" fontWeight={600}>
                          {criterion.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {criterion.description}
                        </Typography>
                      </Box>
                      <Chip
                        label={`+${criterion.tokens_reward} tokens`}
                        size="small"
                        sx={{
                          bgcolor: criterion.is_completed
                            ? alpha(theme.palette.success.main, 0.1)
                            : alpha(theme.palette.primary.main, 0.1),
                          color: criterion.is_completed
                            ? theme.palette.success.main
                            : theme.palette.primary.main,
                          fontWeight: 600,
                        }}
                        icon={
                          criterion.is_completed ? (
                            <CheckCircleIcon sx={{ fontSize: 16 }} />
                          ) : undefined
                        }
                      />
                    </Box>

                    <Box sx={{ mt: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">
                          Progress: {criterion.current_progress} / {criterion.target_progress}
                        </Typography>
                        <Typography variant="caption" fontWeight={600}>
                          {Math.min(100, progressPercent).toFixed(0)}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(100, progressPercent)}
                        sx={{
                          height: 6,
                          borderRadius: 3,
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                          '& .MuiLinearProgress-bar': {
                            bgcolor: criterion.is_completed
                              ? theme.palette.success.main
                              : theme.palette.primary.main,
                          },
                        }}
                      />
                    </Box>

                    {criterion.deadline && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ mt: 0.5, display: 'block' }}
                      >
                        Deadline: {new Date(criterion.deadline).toLocaleDateString()}
                      </Typography>
                    )}
                  </Box>
                </ListItem>
                {index < criteria.length - 1 && <Divider />}
              </Box>
            );
          })}
        </List>
      </CardContent>
    </Card>
  );
}

interface SillyMistakeReviewProps {
  mistakes: SillyMistake[];
  onReview: (mistake: SillyMistake) => void;
}

function SillyMistakeReview({ mistakes, onReview }: SillyMistakeReviewProps) {
  const theme = useTheme();

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return theme.palette.error.main;
    if (confidence >= 60) return theme.palette.warning.main;
    return theme.palette.info.main;
  };

  return (
    <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
      <CardHeader
        title="AI-Flagged Silly Mistakes"
        subheader={`${mistakes.filter((m) => !m.is_reviewed).length} pending review`}
        avatar={<AIIcon sx={{ color: theme.palette.secondary.main }} />}
      />
      <CardContent sx={{ pt: 0 }}>
        {mistakes.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CheckCircleIcon sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              No silly mistakes detected! Great job!
            </Typography>
          </Box>
        ) : (
          <List sx={{ py: 0 }}>
            {mistakes.map((mistake, index) => (
              <Box key={mistake.id}>
                <ListItem
                  sx={{
                    px: 0,
                    py: 2,
                    alignItems: 'flex-start',
                    opacity: mistake.is_reviewed ? 0.6 : 1,
                  }}
                >
                  <Box sx={{ width: '100%' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Box>
                        <Typography variant="body1" fontWeight={600}>
                          {mistake.exam_name} - Question {mistake.question_number}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {mistake.subject} • {new Date(mistake.date).toLocaleDateString()}
                        </Typography>
                      </Box>
                      <Chip
                        label={`${mistake.ai_confidence}% AI Confidence`}
                        size="small"
                        sx={{
                          bgcolor: alpha(getConfidenceColor(mistake.ai_confidence), 0.1),
                          color: getConfidenceColor(mistake.ai_confidence),
                          fontWeight: 600,
                        }}
                      />
                    </Box>

                    <Paper
                      elevation={0}
                      sx={{
                        p: 1.5,
                        mb: 1,
                        bgcolor: alpha(theme.palette.error.main, 0.05),
                        border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
                      }}
                    >
                      <Typography variant="caption" color="text.secondary" display="block">
                        AI Analysis:
                      </Typography>
                      <Typography variant="body2">{mistake.ai_explanation}</Typography>
                    </Paper>

                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Typography variant="body2" color="error.main" fontWeight={600}>
                        -{mistake.marks_lost} marks • {mistake.mistake_type}
                      </Typography>
                      {!mistake.is_reviewed && (
                        <Button size="small" variant="outlined" onClick={() => onReview(mistake)}>
                          Review
                        </Button>
                      )}
                      {mistake.is_reviewed && (
                        <Chip
                          label={mistake.is_confirmed ? 'Confirmed' : 'Disputed'}
                          size="small"
                          color={mistake.is_confirmed ? 'success' : 'default'}
                        />
                      )}
                    </Box>
                  </Box>
                </ListItem>
                {index < mistakes.length - 1 && <Divider />}
              </Box>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );
}

interface MistakeReviewDialogProps {
  mistake: SillyMistake | null;
  open: boolean;
  onClose: () => void;
  onSubmit: (correction: MistakeCorrection) => void;
}

function MistakeReviewDialog({ mistake, open, onClose, onSubmit }: MistakeReviewDialogProps) {
  const [isConfirmed, setIsConfirmed] = useState<boolean>(true);
  const [explanation, setExplanation] = useState('');
  const [correctedAnswer, setCorrectedAnswer] = useState('');

  useEffect(() => {
    if (mistake) {
      setIsConfirmed(true);
      setExplanation('');
      setCorrectedAnswer('');
    }
  }, [mistake]);

  const handleSubmit = () => {
    if (!mistake) return;

    const correction: MistakeCorrection = {
      silly_mistake_id: mistake.id,
      is_confirmed_silly: isConfirmed,
      student_explanation: explanation,
      corrected_answer: correctedAnswer || undefined,
    };

    onSubmit(correction);
    onClose();
  };

  if (!mistake) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" fontWeight={600}>
            Review Silly Mistake
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.default' }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Exam: {mistake.exam_name} • Question {mistake.question_number}
            </Typography>
            <Typography variant="body2" paragraph>
              <strong>Question:</strong> {mistake.question_text}
            </Typography>
            <Typography variant="body2" color="error.main" paragraph>
              <strong>Your Answer:</strong> {mistake.student_answer}
            </Typography>
            <Typography variant="body2" color="success.main" paragraph>
              <strong>Correct Answer:</strong> {mistake.correct_answer}
            </Typography>
            <Typography variant="body2">
              <strong>Marks Lost:</strong> {mistake.marks_lost}
            </Typography>
          </Paper>

          <Alert severity="info" icon={<AIIcon />}>
            <Typography variant="body2" fontWeight={600}>
              AI Analysis ({mistake.ai_confidence}% confidence)
            </Typography>
            <Typography variant="body2">{mistake.ai_explanation}</Typography>
          </Alert>

          <FormControl>
            <Typography variant="subtitle2" gutterBottom>
              Do you agree this was a silly mistake?
            </Typography>
            <RadioGroup
              value={isConfirmed ? 'yes' : 'no'}
              onChange={(e) => setIsConfirmed(e.target.value === 'yes')}
            >
              <FormControlLabel
                value="yes"
                control={<Radio />}
                label="Yes, it was a silly mistake"
              />
              <FormControlLabel value="no" control={<Radio />} label="No, I had a valid reason" />
            </RadioGroup>
          </FormControl>

          <TextField
            label="Your Explanation"
            multiline
            rows={3}
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            placeholder={
              isConfirmed
                ? 'Explain what caused this silly mistake...'
                : "Explain why this wasn't a silly mistake..."
            }
            fullWidth
          />

          {isConfirmed && (
            <TextField
              label="Corrected Answer (Optional)"
              value={correctedAnswer}
              onChange={(e) => setCorrectedAnswer(e.target.value)}
              placeholder="What should you have written?"
              fullWidth
            />
          )}

          <Alert severity="success">
            <Typography variant="body2">
              Earn <strong>+10 tokens</strong> for reviewing this mistake!
            </Typography>
          </Alert>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={!explanation.trim()}>
          Submit Review
        </Button>
      </DialogActions>
    </Dialog>
  );
}

interface ScoreImprovementCardProps {
  improvement: number;
}

function ScoreImprovementCard({ improvement }: ScoreImprovementCardProps) {
  const theme = useTheme();

  return (
    <Card
      elevation={0}
      sx={{
        border: `1px solid ${theme.palette.divider}`,
        background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.05)} 0%, ${alpha(theme.palette.info.main, 0.05)} 100%)`,
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Avatar
            sx={{
              bgcolor: alpha(theme.palette.success.main, 0.1),
              color: theme.palette.success.main,
              width: 56,
              height: 56,
            }}
          >
            <SpeedIcon sx={{ fontSize: 28 }} />
          </Avatar>
          <Box>
            <Typography variant="h6" fontWeight={700}>
              Potential Score Improvement
            </Typography>
            <Typography variant="body2" color="text.secondary">
              If you correct silly mistakes
            </Typography>
          </Box>
        </Box>

        <Box sx={{ textAlign: 'center', py: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1 }}>
            <ArrowUpwardIcon sx={{ color: theme.palette.success.main, fontSize: 40 }} />
            <Typography variant="h2" fontWeight={700} color="success.main">
              +{improvement}%
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Average improvement possible
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

interface TokenHistoryCardProps {
  transactions: TokenTransaction[];
}

function TokenHistoryCard({ transactions }: TokenHistoryCardProps) {
  const theme = useTheme();

  return (
    <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
      <CardHeader title="Token Usage History" avatar={<HistoryIcon />} />
      <CardContent sx={{ pt: 0, maxHeight: 400, overflow: 'auto' }}>
        {transactions.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <HistoryIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              No transaction history yet
            </Typography>
          </Box>
        ) : (
          <List sx={{ py: 0 }}>
            {transactions.map((transaction, index) => (
              <Box key={transaction.id}>
                <ListItem sx={{ px: 0, py: 1.5 }}>
                  <Box sx={{ width: '100%' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2" fontWeight={600}>
                        {transaction.reason}
                      </Typography>
                      <Typography
                        variant="body2"
                        fontWeight={700}
                        sx={{
                          color:
                            transaction.type === 'earn'
                              ? theme.palette.success.main
                              : theme.palette.error.main,
                        }}
                      >
                        {transaction.type === 'earn' ? '+' : '-'}
                        {transaction.amount}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(transaction.date).toLocaleDateString()}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Balance: {transaction.balance_after}
                      </Typography>
                    </Box>
                  </Box>
                </ListItem>
                {index < transactions.length - 1 && <Divider />}
              </Box>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );
}

export default function MistakeInsurance() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [insuranceData, setInsuranceData] = useState<MistakeInsuranceData | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedMistake, setSelectedMistake] = useState<SillyMistake | null>(null);

  useEffect(() => {
    const fetchInsuranceData = async () => {
      try {
        setLoading(true);
        const studentId = user?.id ? parseInt(user.id, 10) : 1;
        const data = await mistakeAnalysisApi.getMistakeInsurance(studentId);
        setInsuranceData(data);
        setError(null);
      } catch (err: unknown) {
        const error = err as { response?: { data?: { detail?: string } } };
        setError(error.response?.data?.detail || 'Failed to load mistake insurance data');
      } finally {
        setLoading(false);
      }
    };

    fetchInsuranceData();
  }, [user]);

  const handleReviewMistake = (mistake: SillyMistake) => {
    setSelectedMistake(mistake);
    setReviewDialogOpen(true);
  };

  const handleSubmitCorrection = async (correction: MistakeCorrection) => {
    try {
      const studentId = user?.id ? parseInt(user.id, 10) : 1;
      const result = await mistakeAnalysisApi.submitMistakeCorrection(studentId, correction);

      if (result.success && result.tokens_earned) {
        setError(null);
        const updatedData = await mistakeAnalysisApi.getMistakeInsurance(studentId);
        setInsuranceData(updatedData);
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || 'Failed to submit correction');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error && !insuranceData) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!insuranceData) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">No insurance data available</Alert>
      </Box>
    );
  }

  return (
    <Box>
      {error && (
        <Alert severity="warning" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Mistake Insurance
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Earn tokens by reviewing mistakes and use them to improve your scores
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <TokenBalanceCard
            balance={insuranceData.token_balance}
            claimsAvailable={insuranceData.insurance_claims_available}
            claimsUsed={insuranceData.insurance_claims_used}
          />
        </Grid>

        <Grid item xs={12} md={8}>
          <ScoreImprovementCard improvement={insuranceData.potential_score_improvement} />
        </Grid>

        <Grid item xs={12} lg={6}>
          <EarningCriteriaCard criteria={insuranceData.earning_criteria} />
        </Grid>

        <Grid item xs={12} lg={6}>
          <SillyMistakeReview
            mistakes={insuranceData.pending_silly_mistakes}
            onReview={handleReviewMistake}
          />
        </Grid>

        <Grid item xs={12}>
          <TokenHistoryCard transactions={insuranceData.transaction_history} />
        </Grid>
      </Grid>

      <MistakeReviewDialog
        mistake={selectedMistake}
        open={reviewDialogOpen}
        onClose={() => setReviewDialogOpen(false)}
        onSubmit={handleSubmitCorrection}
      />
    </Box>
  );
}

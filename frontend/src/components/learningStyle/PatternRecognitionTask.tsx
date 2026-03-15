import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Button,
  LinearProgress,
  useTheme,
  alpha,
} from '@mui/material';
import { Timer as TimerIcon } from '@mui/icons-material';

interface Pattern {
  sequence: string[];
  options: string[];
  correctAnswer: string;
}

interface PatternRecognitionTaskProps {
  data?: unknown;
  onComplete: (score: number) => void;
  timeLimit?: number;
}

export default function PatternRecognitionTask({
  onComplete,
  timeLimit = 60,
}: PatternRecognitionTaskProps) {
  const theme = useTheme();
  const [timeRemaining, setTimeRemaining] = useState(timeLimit);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  // Generate a simple pattern recognition task
  const pattern: Pattern = {
    sequence: ['🔴', '🔵', '🔴', '🔵', '🔴', '?'],
    options: ['🔴', '🔵', '🟢', '🟡'],
    correctAnswer: '🔵',
  };

  useEffect(() => {
    if (timeRemaining > 0 && !isComplete) {
      const timer = setTimeout(() => setTimeRemaining(timeRemaining - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeRemaining === 0 && !isComplete) {
      handleSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRemaining, isComplete]);

  const handleSubmit = () => {
    setIsComplete(true);
    const score = selectedAnswer === pattern.correctAnswer ? 100 : 50;
    onComplete(score);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">Pattern Recognition Task</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TimerIcon color={timeRemaining < 10 ? 'error' : 'action'} />
          <Typography
            variant="h6"
            color={timeRemaining < 10 ? 'error.main' : 'text.primary'}
            fontWeight={600}
          >
            {timeRemaining}s
          </Typography>
        </Box>
      </Box>

      <LinearProgress
        variant="determinate"
        value={(timeRemaining / timeLimit) * 100}
        sx={{
          mb: 3,
          height: 6,
          borderRadius: 3,
          bgcolor: alpha(theme.palette.primary.main, 0.1),
        }}
      />

      <Typography variant="body1" sx={{ mb: 3 }}>
        Identify the next item in the sequence:
      </Typography>

      {/* Pattern Display */}
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mb: 4 }}>
        {pattern.sequence.map((item, index) => (
          <Paper
            key={index}
            elevation={0}
            sx={{
              width: 60,
              height: 60,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
              border: `2px solid ${theme.palette.divider}`,
              bgcolor:
                item === '?'
                  ? alpha(theme.palette.warning.main, 0.1)
                  : alpha(theme.palette.primary.main, 0.05),
            }}
          >
            {item}
          </Paper>
        ))}
      </Box>

      {/* Options */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {pattern.options.map((option, index) => (
          <Grid item xs={6} sm={3} key={index}>
            <Paper
              elevation={0}
              onClick={() => !isComplete && setSelectedAnswer(option)}
              sx={{
                p: 3,
                textAlign: 'center',
                fontSize: '3rem',
                cursor: isComplete ? 'default' : 'pointer',
                border: `3px solid ${
                  selectedAnswer === option ? theme.palette.primary.main : theme.palette.divider
                }`,
                bgcolor:
                  selectedAnswer === option
                    ? alpha(theme.palette.primary.main, 0.1)
                    : 'background.paper',
                transition: 'all 0.3s',
                '&:hover': !isComplete
                  ? {
                      borderColor: theme.palette.primary.main,
                      transform: 'scale(1.05)',
                    }
                  : {},
              }}
            >
              {option}
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Button
        variant="contained"
        fullWidth
        onClick={handleSubmit}
        disabled={!selectedAnswer || isComplete}
      >
        Submit Answer
      </Button>
    </Box>
  );
}

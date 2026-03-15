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

interface SpatialReasoningTaskProps {
  data?: unknown;
  onComplete: (score: number) => void;
  timeLimit?: number;
}

export default function SpatialReasoningTask({
  onComplete,
  timeLimit = 60,
}: SpatialReasoningTaskProps) {
  const theme = useTheme();
  const [timeRemaining, setTimeRemaining] = useState(timeLimit);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  const shapes = [
    { id: 1, path: 'M 20,20 L 80,20 L 50,80 Z', label: 'A' },
    { id: 2, path: 'M 20,50 L 50,20 L 80,50 L 50,80 Z', label: 'B' },
    { id: 3, path: 'M 20,20 L 80,20 L 80,80 L 20,80 Z', label: 'C' },
    { id: 4, path: 'M 50,20 L 80,50 L 50,80 L 20,50 Z', label: 'D' },
  ];

  const correctAnswer = 4;

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
    const score = selectedAnswer === correctAnswer ? 100 : 50;
    onComplete(score);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">Spatial Reasoning Task</Typography>
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
        Which shape is the same as the reference shape but rotated?
      </Typography>

      {/* Reference Shape */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 3,
          bgcolor: alpha(theme.palette.primary.main, 0.05),
          border: `2px solid ${theme.palette.primary.main}`,
        }}
      >
        <Typography variant="caption" sx={{ mb: 1, display: 'block' }}>
          Reference Shape:
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <svg width="100" height="100" viewBox="0 0 100 100">
            <path d="M 50,20 L 80,50 L 50,80 L 20,50 Z" fill={theme.palette.primary.main} />
          </svg>
        </Box>
      </Paper>

      {/* Options */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {shapes.map((shape) => (
          <Grid item xs={6} sm={3} key={shape.id}>
            <Paper
              elevation={0}
              onClick={() => !isComplete && setSelectedAnswer(shape.id)}
              sx={{
                p: 2,
                textAlign: 'center',
                cursor: isComplete ? 'default' : 'pointer',
                border: `3px solid ${
                  selectedAnswer === shape.id ? theme.palette.primary.main : theme.palette.divider
                }`,
                bgcolor:
                  selectedAnswer === shape.id
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
              <Typography variant="h6" sx={{ mb: 1 }}>
                {shape.label}
              </Typography>
              <svg width="100" height="100" viewBox="0 0 100 100">
                <path d={shape.path} fill={theme.palette.text.primary} />
              </svg>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Button
        variant="contained"
        fullWidth
        onClick={handleSubmit}
        disabled={selectedAnswer === null || isComplete}
      >
        Submit Answer
      </Button>
    </Box>
  );
}

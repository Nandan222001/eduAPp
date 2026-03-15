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
  Chip,
} from '@mui/material';
import {
  Timer as TimerIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from '@mui/icons-material';

interface MemoryRecallTaskProps {
  data?: unknown;
  onComplete: (score: number) => void;
  timeLimit?: number;
}

export default function MemoryRecallTask({ onComplete, timeLimit = 60 }: MemoryRecallTaskProps) {
  const theme = useTheme();
  const [phase, setPhase] = useState<'memorize' | 'recall'>('memorize');
  const [timeRemaining, setTimeRemaining] = useState(10);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [isComplete, setIsComplete] = useState(false);

  const itemsToMemorize = [2, 5, 7, 9];
  const allItems = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  useEffect(() => {
    if (timeRemaining > 0 && !isComplete) {
      const timer = setTimeout(() => setTimeRemaining(timeRemaining - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeRemaining === 0 && phase === 'memorize') {
      setPhase('recall');
      setTimeRemaining(timeLimit);
    } else if (timeRemaining === 0 && phase === 'recall' && !isComplete) {
      handleSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRemaining, phase, isComplete]);

  const handleItemClick = (item: number) => {
    if (phase === 'recall' && !isComplete) {
      setSelectedItems((prev) =>
        prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
      );
    }
  };

  const handleSubmit = () => {
    setIsComplete(true);
    const correctSelections = selectedItems.filter((item) => itemsToMemorize.includes(item)).length;
    const incorrectSelections = selectedItems.filter(
      (item) => !itemsToMemorize.includes(item)
    ).length;

    const score = Math.max(
      0,
      ((correctSelections - incorrectSelections) / itemsToMemorize.length) * 100
    );
    onComplete(score);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h6">Memory Recall Task</Typography>
          <Chip
            icon={phase === 'memorize' ? <VisibilityIcon /> : <VisibilityOffIcon />}
            label={phase === 'memorize' ? 'Memorization Phase' : 'Recall Phase'}
            color={phase === 'memorize' ? 'primary' : 'secondary'}
            sx={{ mt: 1 }}
          />
        </Box>
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
        value={(timeRemaining / (phase === 'memorize' ? 10 : timeLimit)) * 100}
        sx={{
          mb: 3,
          height: 6,
          borderRadius: 3,
          bgcolor: alpha(theme.palette.primary.main, 0.1),
        }}
      />

      {phase === 'memorize' && (
        <Typography variant="body1" sx={{ mb: 3 }}>
          Memorize the highlighted numbers. You have 10 seconds.
        </Typography>
      )}

      {phase === 'recall' && (
        <Typography variant="body1" sx={{ mb: 3 }}>
          Select all the numbers that were highlighted:
        </Typography>
      )}

      {/* Items Grid */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {allItems.map((item) => (
          <Grid item xs={3} sm={2} key={item}>
            <Paper
              elevation={0}
              onClick={() => handleItemClick(item)}
              sx={{
                p: 3,
                textAlign: 'center',
                fontSize: '1.5rem',
                fontWeight: 600,
                cursor: phase === 'recall' && !isComplete ? 'pointer' : 'default',
                border: `3px solid ${
                  selectedItems.includes(item) ? theme.palette.primary.main : theme.palette.divider
                }`,
                bgcolor:
                  phase === 'memorize' && itemsToMemorize.includes(item)
                    ? alpha(theme.palette.warning.main, 0.3)
                    : selectedItems.includes(item)
                      ? alpha(theme.palette.primary.main, 0.1)
                      : 'background.paper',
                transition: 'all 0.3s',
                '&:hover':
                  phase === 'recall' && !isComplete
                    ? {
                        borderColor: theme.palette.primary.main,
                        transform: 'scale(1.05)',
                      }
                    : {},
              }}
            >
              {item}
            </Paper>
          </Grid>
        ))}
      </Grid>

      {phase === 'recall' && (
        <Button
          variant="contained"
          fullWidth
          onClick={handleSubmit}
          disabled={selectedItems.length === 0 || isComplete}
        >
          Submit Answer
        </Button>
      )}
    </Box>
  );
}

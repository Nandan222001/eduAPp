import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Avatar,
  Chip,
  CircularProgress,
  IconButton,
  useTheme,
  alpha,
  Stack,
} from '@mui/material';
import { EmojiEvents as TrophyIcon, ArrowForward as ArrowForwardIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import recognitionApi from '@/api/recognition';

const recognitionColors: Record<string, string> = {
  academic_excellence: '#FFD700',
  helpful_peer: '#4CAF50',
  team_player: '#2196F3',
  creative_thinker: '#FF9800',
  leadership: '#9C27B0',
  kindness: '#E91E63',
  perseverance: '#FF5722',
  improvement: '#00BCD4',
};

export default function RecognitionWidget() {
  const theme = useTheme();
  const navigate = useNavigate();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['myRecognitionStats'],
    queryFn: recognitionApi.getMyStats,
  });

  const { data: recentRecognitions } = useQuery({
    queryKey: ['myRecentRecognitions'],
    queryFn: () => recognitionApi.getMyReceivedRecognitions({ limit: 3 }),
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <CircularProgress size={24} />
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TrophyIcon sx={{ color: theme.palette.warning.main }} />
            <Typography variant="h6">Recognitions</Typography>
          </Box>
          <IconButton size="small" onClick={() => navigate('/student/peer-recognition')}>
            <ArrowForwardIcon />
          </IconButton>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-around', mb: 2 }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h4" color="primary.main">
              {stats.total_received}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Received
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h4" color="secondary.main">
              {stats.total_sent}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Sent
            </Typography>
          </Box>
        </Box>

        {recentRecognitions?.items && recentRecognitions.items.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Recent
            </Typography>
            <Stack spacing={1}>
              {recentRecognitions.items.map((recognition) => (
                <Box
                  key={recognition.id}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    p: 1,
                    borderRadius: 1,
                    bgcolor: alpha(theme.palette.primary.main, 0.05),
                  }}
                >
                  <Avatar src={recognition.sender_avatar} sx={{ width: 32, height: 32 }}>
                    {recognition.sender_name.charAt(0)}
                  </Avatar>
                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Typography variant="caption" noWrap>
                      {recognition.sender_name}
                    </Typography>
                    <Typography variant="caption" display="block" color="text.secondary" noWrap>
                      {new Date(recognition.created_at).toLocaleDateString()}
                    </Typography>
                  </Box>
                  <Chip
                    size="small"
                    sx={{
                      bgcolor: alpha(
                        recognitionColors[recognition.recognition_type] ||
                          theme.palette.primary.main,
                        0.1
                      ),
                      color:
                        recognitionColors[recognition.recognition_type] ||
                        theme.palette.primary.main,
                      fontSize: '0.65rem',
                      height: 20,
                    }}
                    label={recognition.recognition_type.replace('_', ' ')}
                  />
                </Box>
              ))}
            </Stack>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

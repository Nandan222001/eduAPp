import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Avatar,
  Chip,
  CircularProgress,
  Alert,
  useTheme,
  alpha,
  Divider,
  Stack,
} from '@mui/material';
import {
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

const recognitionTypes = [
  { type: 'academic_excellence', label: 'Academic Excellence', icon: TrophyIcon, color: '#FFD700' },
  { type: 'helpful_peer', label: 'Helpful Peer', icon: SchoolIcon, color: '#4CAF50' },
  { type: 'team_player', label: 'Team Player', icon: TeamIcon, color: '#2196F3' },
  { type: 'creative_thinker', label: 'Creative Thinker', icon: LightbulbIcon, color: '#FF9800' },
  { type: 'leadership', label: 'Leadership', icon: LeadershipIcon, color: '#9C27B0' },
  { type: 'kindness', label: 'Kindness', icon: KindnessIcon, color: '#E91E63' },
  { type: 'perseverance', label: 'Perseverance', icon: PerseveranceIcon, color: '#FF5722' },
  { type: 'improvement', label: 'Most Improved', icon: ImprovementIcon, color: '#00BCD4' },
];

interface ProfileRecognitionSectionProps {
  studentId: number;
}

export default function ProfileRecognitionSection({ studentId }: ProfileRecognitionSectionProps) {
  const theme = useTheme();

  const { data: recognitions, isLoading } = useQuery({
    queryKey: ['studentRecognitions', studentId],
    queryFn: () => recognitionApi.listRecognitions({ recipient_id: studentId, limit: 6 }),
  });

  const { data: stats } = useQuery({
    queryKey: ['studentRecognitionStats', studentId],
    queryFn: recognitionApi.getMyStats,
  });

  if (isLoading) {
    return (
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        <TrophyIcon sx={{ verticalAlign: 'middle', mr: 1, color: 'warning.main' }} />
        Peer Recognitions
      </Typography>
      <Divider sx={{ mb: 3 }} />

      {stats && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={4}>
            <Card variant="outlined">
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="h4" color="primary.main">
                  {stats.total_received}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Total Received
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={4}>
            <Card variant="outlined">
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="h4" color="success.main">
                  {stats.weekly_count}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  This Week
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={4}>
            <Card variant="outlined">
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="h4" color="warning.main">
                  {stats.monthly_count}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  This Month
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {stats?.by_category && Object.keys(stats.by_category).length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            By Category
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
            {Object.entries(stats.by_category).map(([type, count]) => {
              const typeInfo = recognitionTypes.find((t) => t.type === type);
              if (!typeInfo || count === 0) return null;
              const Icon = typeInfo.icon;
              return (
                <Chip
                  key={type}
                  icon={<Icon />}
                  label={`${typeInfo.label}: ${count}`}
                  size="small"
                  sx={{
                    bgcolor: alpha(typeInfo.color, 0.1),
                    color: typeInfo.color,
                  }}
                />
              );
            })}
          </Stack>
        </Box>
      )}

      {recognitions?.items && recognitions.items.length > 0 ? (
        <Grid container spacing={2}>
          {recognitions.items.map((recognition) => {
            const typeInfo = recognitionTypes.find((t) => t.type === recognition.recognition_type);
            const Icon = typeInfo?.icon || TrophyIcon;
            return (
              <Grid item xs={12} sm={6} key={recognition.id}>
                <Card variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                      <Avatar
                        sx={{
                          bgcolor: alpha(typeInfo?.color || theme.palette.primary.main, 0.2),
                          color: typeInfo?.color || theme.palette.primary.main,
                          width: 40,
                          height: 40,
                        }}
                      >
                        <Icon />
                      </Avatar>
                      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Typography variant="caption" color="text.secondary" display="block">
                          {typeInfo?.label}
                        </Typography>
                        <Typography variant="body2" fontWeight={600} noWrap>
                          {recognition.sender_name}
                        </Typography>
                      </Box>
                    </Box>
                    <Typography variant="body2" sx={{ fontStyle: 'italic' }} noWrap>
                      &ldquo;{recognition.message}&rdquo;
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      display="block"
                      sx={{ mt: 1 }}
                    >
                      {new Date(recognition.created_at).toLocaleDateString()}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      ) : (
        <Alert severity="info">No recognitions yet</Alert>
      )}
    </Paper>
  );
}

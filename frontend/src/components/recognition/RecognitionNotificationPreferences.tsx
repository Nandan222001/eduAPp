import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Paper,
  Switch,
  FormControlLabel,
  FormGroup,
  Divider,
  Button,
  CircularProgress,
  Alert,
  Stack,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Email as EmailIcon,
  PhoneAndroid as PushIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import recognitionApi from '@/api/recognition';
import { useToast } from '@/hooks/useToast';

export default function RecognitionNotificationPreferences() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const { data: preferences, isLoading } = useQuery({
    queryKey: ['recognitionNotificationPreferences'],
    queryFn: recognitionApi.getNotificationPreferences,
  });

  const [localPreferences, setLocalPreferences] = useState({
    instant: false,
    daily_digest: false,
    weekly_summary: false,
    email_enabled: false,
    push_enabled: false,
  });

  useEffect(() => {
    if (preferences) {
      setLocalPreferences(preferences);
    }
  }, [preferences]);

  const updateMutation = useMutation({
    mutationFn: recognitionApi.updateNotificationPreferences,
    onSuccess: (data) => {
      queryClient.setQueryData(['recognitionNotificationPreferences'], data);
      showToast('Notification preferences updated', 'success');
    },
    onError: () => {
      showToast('Failed to update preferences', 'error');
    },
  });

  const handleChange = (field: keyof typeof localPreferences) => {
    setLocalPreferences((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handleSave = () => {
    updateMutation.mutate(localPreferences);
  };

  const handleReset = () => {
    if (preferences) {
      setLocalPreferences(preferences);
    }
  };

  const isDirty = JSON.stringify(localPreferences) !== JSON.stringify(preferences);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <NotificationsIcon sx={{ mr: 1, color: 'primary.main' }} />
        <Typography variant="h6">Recognition Notifications</Typography>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Choose how you want to be notified when you receive recognitions
      </Typography>

      <Divider sx={{ mb: 3 }} />

      <Stack spacing={3}>
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Notification Frequency
          </Typography>
          <FormGroup>
            <FormControlLabel
              control={
                <Switch
                  checked={localPreferences.instant}
                  onChange={() => handleChange('instant')}
                />
              }
              label={
                <Box>
                  <Typography variant="body2">Instant Notifications</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Get notified immediately when you receive a recognition
                  </Typography>
                </Box>
              }
            />
            <FormControlLabel
              control={
                <Switch
                  checked={localPreferences.daily_digest}
                  onChange={() => handleChange('daily_digest')}
                />
              }
              label={
                <Box>
                  <Typography variant="body2">Daily Digest</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Receive a summary of recognitions once per day
                  </Typography>
                </Box>
              }
            />
            <FormControlLabel
              control={
                <Switch
                  checked={localPreferences.weekly_summary}
                  onChange={() => handleChange('weekly_summary')}
                />
              }
              label={
                <Box>
                  <Typography variant="body2">Weekly Summary</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Get a weekly recap of all your recognitions
                  </Typography>
                </Box>
              }
            />
          </FormGroup>
        </Box>

        <Divider />

        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Delivery Channels
          </Typography>
          <FormGroup>
            <FormControlLabel
              control={
                <Switch
                  checked={localPreferences.email_enabled}
                  onChange={() => handleChange('email_enabled')}
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <EmailIcon fontSize="small" />
                  <Typography variant="body2">Email Notifications</Typography>
                </Box>
              }
            />
            <FormControlLabel
              control={
                <Switch
                  checked={localPreferences.push_enabled}
                  onChange={() => handleChange('push_enabled')}
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PushIcon fontSize="small" />
                  <Typography variant="body2">Push Notifications</Typography>
                </Box>
              }
            />
          </FormGroup>
        </Box>

        {localPreferences.instant &&
          !localPreferences.email_enabled &&
          !localPreferences.push_enabled && (
            <Alert severity="warning">
              You have instant notifications enabled but no delivery channel selected. Please enable
              at least one channel to receive notifications.
            </Alert>
          )}

        <Divider />

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={!isDirty || updateMutation.isPending}
          >
            {updateMutation.isPending ? 'Saving...' : 'Save Preferences'}
          </Button>
          <Button variant="outlined" onClick={handleReset} disabled={!isDirty}>
            Reset
          </Button>
        </Box>
      </Stack>
    </Paper>
  );
}

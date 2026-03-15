import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Stack,
  Switch,
  FormControlLabel,
  FormGroup,
  Button,
  Alert,
  Divider,
  CircularProgress,
} from '@mui/material';
import { Security as SecurityIcon, Save as SaveIcon, Info as InfoIcon } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { parentsApi } from '@/api/parents';
import type { PrivacySettings } from '@/types/parent';

export const PrivacyControlsPanel: React.FC = () => {
  const queryClient = useQueryClient();
  const [hasChanges, setHasChanges] = useState(false);

  const { data: privacySettings, isLoading } = useQuery({
    queryKey: ['parent-privacy-settings'],
    queryFn: () => parentsApi.getPrivacySettings(),
  });

  const [settings, setSettings] = useState<Partial<PrivacySettings>>({});

  React.useEffect(() => {
    if (privacySettings) {
      setSettings({
        disable_sibling_comparisons: privacySettings.disable_sibling_comparisons,
        hide_performance_rankings: privacySettings.hide_performance_rankings,
        hide_attendance_from_siblings: privacySettings.hide_attendance_from_siblings,
        allow_data_sharing: privacySettings.allow_data_sharing,
      });
    }
  }, [privacySettings]);

  const updateSettingsMutation = useMutation({
    mutationFn: (settings: Partial<PrivacySettings>) => parentsApi.updatePrivacySettings(settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parent-privacy-settings'] });
      queryClient.invalidateQueries({ queryKey: ['family-comparative-performance'] });
      setHasChanges(false);
    },
  });

  const handleToggle = (field: keyof PrivacySettings) => {
    setSettings((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    updateSettingsMutation.mutate(settings);
  };

  const handleReset = () => {
    if (privacySettings) {
      setSettings({
        disable_sibling_comparisons: privacySettings.disable_sibling_comparisons,
        hide_performance_rankings: privacySettings.hide_performance_rankings,
        hide_attendance_from_siblings: privacySettings.hide_attendance_from_siblings,
        allow_data_sharing: privacySettings.allow_data_sharing,
      });
      setHasChanges(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" gap={2} mb={3}>
          <SecurityIcon color="primary" fontSize="large" />
          <Box>
            <Typography variant="h6">Privacy Controls</Typography>
            <Typography variant="body2" color="text.secondary">
              Manage how your children&apos;s information is displayed and shared
            </Typography>
          </Box>
        </Box>

        <Alert severity="info" icon={<InfoIcon />} sx={{ mb: 3 }}>
          These settings control what information is visible in the family dashboard and comparative
          views.
        </Alert>

        <FormGroup>
          <Stack spacing={2}>
            <Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.disable_sibling_comparisons || false}
                    onChange={() => handleToggle('disable_sibling_comparisons')}
                    color="primary"
                  />
                }
                label={
                  <Box>
                    <Typography variant="body1" fontWeight="medium">
                      Disable Sibling Comparisons
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Hide comparative performance charts and side-by-side metrics
                    </Typography>
                  </Box>
                }
              />
              <Divider sx={{ mt: 2 }} />
            </Box>

            <Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.hide_performance_rankings || false}
                    onChange={() => handleToggle('hide_performance_rankings')}
                    color="primary"
                  />
                }
                label={
                  <Box>
                    <Typography variant="body1" fontWeight="medium">
                      Hide Performance Rankings
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Don&apos;t show class rank and comparative standing information
                    </Typography>
                  </Box>
                }
              />
              <Divider sx={{ mt: 2 }} />
            </Box>

            <Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.hide_attendance_from_siblings || false}
                    onChange={() => handleToggle('hide_attendance_from_siblings')}
                    color="primary"
                  />
                }
                label={
                  <Box>
                    <Typography variant="body1" fontWeight="medium">
                      Hide Attendance from Siblings
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Show attendance data only for individually selected children
                    </Typography>
                  </Box>
                }
              />
              <Divider sx={{ mt: 2 }} />
            </Box>

            <Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.allow_data_sharing || false}
                    onChange={() => handleToggle('allow_data_sharing')}
                    color="primary"
                  />
                }
                label={
                  <Box>
                    <Typography variant="body1" fontWeight="medium">
                      Allow Data Sharing
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Allow anonymized data to be used for improving educational insights
                    </Typography>
                  </Box>
                }
              />
            </Box>
          </Stack>
        </FormGroup>

        {hasChanges && (
          <Alert severity="warning" sx={{ mt: 3 }}>
            You have unsaved changes. Click &quot;Save Changes&quot; to apply them.
          </Alert>
        )}

        <Box display="flex" gap={2} mt={3}>
          <Button
            variant="contained"
            fullWidth
            onClick={handleSave}
            disabled={!hasChanges || updateSettingsMutation.isPending}
            startIcon={
              updateSettingsMutation.isPending ? <CircularProgress size={20} /> : <SaveIcon />
            }
          >
            Save Changes
          </Button>
          <Button variant="outlined" fullWidth onClick={handleReset} disabled={!hasChanges}>
            Reset
          </Button>
        </Box>

        {updateSettingsMutation.isSuccess && (
          <Alert severity="success" sx={{ mt: 2 }}>
            Privacy settings updated successfully!
          </Alert>
        )}

        {updateSettingsMutation.isError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            Failed to update privacy settings. Please try again.
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

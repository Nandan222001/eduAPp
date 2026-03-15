import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Chip,
  Box,
  IconButton,
  Typography,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import communityServiceApi from '@/api/communityService';

interface ServiceReflectionDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  serviceLogId?: number;
}

export default function ServiceReflectionDialog({
  open,
  onClose,
  onSuccess,
  serviceLogId,
}: ServiceReflectionDialogProps) {
  const [formData, setFormData] = useState({
    title: '',
    reflection_text: '',
    learnings: [] as string[],
    challenges_faced: [] as string[],
    personal_growth_areas: [] as string[],
    skills_applied: [] as string[],
    emotions: [] as string[],
    future_goals: [] as string[],
  });
  const [inputFields, setInputFields] = useState({
    learning: '',
    challenge: '',
    growth: '',
    skill: '',
    emotion: '',
    goal: '',
  });
  const [loading, setLoading] = useState(false);

  const handleAddItem = (field: keyof typeof inputFields, arrayField: keyof typeof formData) => {
    const value = inputFields[field].trim();
    if (value && !formData[arrayField].includes(value)) {
      setFormData((prev) => ({
        ...prev,
        [arrayField]: [...(prev[arrayField] as string[]), value],
      }));
      setInputFields((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleRemoveItem = (arrayField: keyof typeof formData, item: string) => {
    setFormData((prev) => ({
      ...prev,
      [arrayField]: (prev[arrayField] as string[]).filter((i) => i !== item),
    }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      await communityServiceApi.createReflection({
        service_log_id: serviceLogId,
        date: new Date().toISOString(),
        title: formData.title,
        reflection_text: formData.reflection_text,
        learnings: formData.learnings,
        challenges_faced: formData.challenges_faced,
        personal_growth_areas: formData.personal_growth_areas,
        skills_applied: formData.skills_applied,
        emotions: formData.emotions,
        future_goals: formData.future_goals,
      });
      onSuccess();
      onClose();
      resetForm();
    } catch (err) {
      console.error('Failed to save reflection:', err);
      alert('Failed to save reflection');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      reflection_text: '',
      learnings: [],
      challenges_faced: [],
      personal_growth_areas: [],
      skills_applied: [],
      emotions: [],
      future_goals: [],
    });
    setInputFields({
      learning: '',
      challenge: '',
      growth: '',
      skill: '',
      emotion: '',
      goal: '',
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Service Reflection Journal
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Reflection Title"
              required
              value={formData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={6}
              label="What did you do? How did it make you feel?"
              required
              value={formData.reflection_text}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, reflection_text: e.target.value }))
              }
              helperText="Describe your service experience and your thoughts about it"
            />
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom>
              What did you learn?
            </Typography>
            <TextField
              fullWidth
              size="small"
              value={inputFields.learning}
              onChange={(e) => setInputFields((prev) => ({ ...prev, learning: e.target.value }))}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddItem('learning', 'learnings');
                }
              }}
              helperText="Press Enter to add"
            />
            <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {formData.learnings.map((item) => (
                <Chip
                  key={item}
                  label={item}
                  onDelete={() => handleRemoveItem('learnings', item)}
                  color="primary"
                  variant="outlined"
                />
              ))}
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom>
              What challenges did you face?
            </Typography>
            <TextField
              fullWidth
              size="small"
              value={inputFields.challenge}
              onChange={(e) => setInputFields((prev) => ({ ...prev, challenge: e.target.value }))}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddItem('challenge', 'challenges_faced');
                }
              }}
              helperText="Press Enter to add"
            />
            <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {formData.challenges_faced.map((item) => (
                <Chip
                  key={item}
                  label={item}
                  onDelete={() => handleRemoveItem('challenges_faced', item)}
                  color="warning"
                  variant="outlined"
                />
              ))}
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom>
              How did you grow personally?
            </Typography>
            <TextField
              fullWidth
              size="small"
              value={inputFields.growth}
              onChange={(e) => setInputFields((prev) => ({ ...prev, growth: e.target.value }))}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddItem('growth', 'personal_growth_areas');
                }
              }}
              helperText="Press Enter to add"
            />
            <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {formData.personal_growth_areas.map((item) => (
                <Chip
                  key={item}
                  label={item}
                  onDelete={() => handleRemoveItem('personal_growth_areas', item)}
                  color="success"
                  variant="outlined"
                />
              ))}
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom>
              What skills did you apply?
            </Typography>
            <TextField
              fullWidth
              size="small"
              value={inputFields.skill}
              onChange={(e) => setInputFields((prev) => ({ ...prev, skill: e.target.value }))}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddItem('skill', 'skills_applied');
                }
              }}
              helperText="Press Enter to add"
            />
            <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {formData.skills_applied.map((item) => (
                <Chip
                  key={item}
                  label={item}
                  onDelete={() => handleRemoveItem('skills_applied', item)}
                  color="info"
                  variant="outlined"
                />
              ))}
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom>
              How did this experience make you feel?
            </Typography>
            <TextField
              fullWidth
              size="small"
              value={inputFields.emotion}
              onChange={(e) => setInputFields((prev) => ({ ...prev, emotion: e.target.value }))}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddItem('emotion', 'emotions');
                }
              }}
              helperText="Press Enter to add"
            />
            <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {formData.emotions.map((item) => (
                <Chip
                  key={item}
                  label={item}
                  onDelete={() => handleRemoveItem('emotions', item)}
                  color="secondary"
                  variant="outlined"
                />
              ))}
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom>
              What are your future goals related to this experience?
            </Typography>
            <TextField
              fullWidth
              size="small"
              value={inputFields.goal}
              onChange={(e) => setInputFields((prev) => ({ ...prev, goal: e.target.value }))}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddItem('goal', 'future_goals');
                }
              }}
              helperText="Press Enter to add"
            />
            <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {formData.future_goals.map((item) => (
                <Chip
                  key={item}
                  label={item}
                  onDelete={() => handleRemoveItem('future_goals', item)}
                  variant="outlined"
                />
              ))}
            </Box>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={loading}>
          {loading ? 'Saving...' : 'Save Reflection'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

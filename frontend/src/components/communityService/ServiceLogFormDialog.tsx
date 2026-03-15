import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Chip,
  Box,
  IconButton,
  Autocomplete,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import {
  ServiceLog,
  ServiceLogForm,
  ServiceCategory,
  OrganizationContact,
} from '@/types/communityService';
import communityServiceApi from '@/api/communityService';

interface ServiceLogFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  log?: ServiceLog | null;
  organizations: OrganizationContact[];
}

export default function ServiceLogFormDialog({
  open,
  onClose,
  onSuccess,
  log,
  organizations,
}: ServiceLogFormDialogProps) {
  const [formData, setFormData] = useState<ServiceLogForm>({
    activity_name: '',
    organization_name: '',
    organization_contact_name: '',
    organization_contact_email: '',
    organization_contact_phone: '',
    category: ServiceCategory.OTHER,
    start_date: '',
    end_date: '',
    hours: 0,
    location: '',
    description: '',
    reflection_essay: '',
    beneficiaries_served: 0,
    skills_developed: [],
  });
  const [skillInput, setSkillInput] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (log) {
      setFormData({
        activity_name: log.activity_name,
        organization_name: log.organization_name,
        organization_contact_name: log.organization_contact_name || '',
        organization_contact_email: log.organization_contact_email || '',
        organization_contact_phone: log.organization_contact_phone || '',
        category: log.category,
        start_date: log.start_date.split('T')[0],
        end_date: log.end_date.split('T')[0],
        hours: log.hours,
        location: log.location,
        description: log.description,
        reflection_essay: log.reflection_essay || '',
        beneficiaries_served: log.beneficiaries_served || 0,
        skills_developed: log.skills_developed,
      });
    } else {
      resetForm();
    }
  }, [log, open]);

  const resetForm = () => {
    setFormData({
      activity_name: '',
      organization_name: '',
      organization_contact_name: '',
      organization_contact_email: '',
      organization_contact_phone: '',
      category: ServiceCategory.OTHER,
      start_date: '',
      end_date: '',
      hours: 0,
      location: '',
      description: '',
      reflection_essay: '',
      beneficiaries_served: 0,
      skills_developed: [],
    });
    setSkillInput('');
  };

  const handleChange = (field: keyof ServiceLogForm, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleOrganizationSelect = (org: OrganizationContact | null) => {
    if (org) {
      setFormData((prev) => ({
        ...prev,
        organization_name: org.organization_name,
        organization_contact_name: org.contact_name,
        organization_contact_email: org.contact_email,
        organization_contact_phone: org.contact_phone || '',
        category: org.category,
      }));
    }
  };

  const handleAddSkill = () => {
    if (skillInput.trim() && !formData.skills_developed.includes(skillInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        skills_developed: [...prev.skills_developed, skillInput.trim()],
      }));
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setFormData((prev) => ({
      ...prev,
      skills_developed: prev.skills_developed.filter((s) => s !== skill),
    }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      if (log) {
        await communityServiceApi.updateServiceLog(log.id, formData);
      } else {
        await communityServiceApi.createServiceLog(formData);
      }
      onSuccess();
      onClose();
      resetForm();
    } catch (err) {
      console.error('Failed to save service log:', err);
      alert('Failed to save service log');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryLabel = (category: ServiceCategory) => {
    return category
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {log ? 'Edit Service Log' : 'Log Community Service Activity'}
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
              label="Activity Name"
              required
              value={formData.activity_name}
              onChange={(e) => handleChange('activity_name', e.target.value)}
            />
          </Grid>

          <Grid item xs={12}>
            <Autocomplete
              freeSolo
              options={organizations}
              getOptionLabel={(option) =>
                typeof option === 'string' ? option : option.organization_name
              }
              value={
                organizations.find((org) => org.organization_name === formData.organization_name) ||
                null
              }
              onChange={(_, value) => {
                if (typeof value === 'string') {
                  handleChange('organization_name', value);
                } else if (value) {
                  handleOrganizationSelect(value);
                }
              }}
              onInputChange={(_, newValue) => {
                handleChange('organization_name', newValue);
              }}
              renderInput={(params) => <TextField {...params} label="Organization Name" required />}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Contact Name"
              value={formData.organization_contact_name}
              onChange={(e) => handleChange('organization_contact_name', e.target.value)}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Contact Email"
              type="email"
              value={formData.organization_contact_email}
              onChange={(e) => handleChange('organization_contact_email', e.target.value)}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Contact Phone"
              value={formData.organization_contact_phone}
              onChange={(e) => handleChange('organization_contact_phone', e.target.value)}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required>
              <InputLabel>Category</InputLabel>
              <Select
                value={formData.category}
                label="Category"
                onChange={(e) => handleChange('category', e.target.value)}
              >
                {Object.values(ServiceCategory).map((category) => (
                  <MenuItem key={category} value={category}>
                    {getCategoryLabel(category)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Start Date"
              type="date"
              required
              value={formData.start_date}
              onChange={(e) => handleChange('start_date', e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="End Date"
              type="date"
              required
              value={formData.end_date}
              onChange={(e) => handleChange('end_date', e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Hours"
              type="number"
              required
              value={formData.hours}
              onChange={(e) => handleChange('hours', parseFloat(e.target.value))}
              inputProps={{ min: 0, step: 0.5 }}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Location"
              required
              value={formData.location}
              onChange={(e) => handleChange('location', e.target.value)}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Activity Description"
              required
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              helperText="Describe what you did and your responsibilities"
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Reflection Essay"
              value={formData.reflection_essay}
              onChange={(e) => handleChange('reflection_essay', e.target.value)}
              helperText="Reflect on your experience, what you learned, and how it impacted you"
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Number of Beneficiaries Served"
              type="number"
              value={formData.beneficiaries_served}
              onChange={(e) => handleChange('beneficiaries_served', parseInt(e.target.value) || 0)}
              inputProps={{ min: 0 }}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Add Skill Developed"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddSkill();
                }
              }}
              helperText="Press Enter to add a skill"
            />
            <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {formData.skills_developed.map((skill) => (
                <Chip
                  key={skill}
                  label={skill}
                  onDelete={() => handleRemoveSkill(skill)}
                  color="primary"
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
          {loading ? 'Saving...' : log ? 'Update' : 'Submit'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

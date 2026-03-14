import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Button,
  TextField,
  Stack,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  IconButton,
  InputAdornment,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from '@mui/icons-material';
import superAdminApi, { InstitutionCreate } from '@/api/superAdmin';
import { isDemoUser, demoDataApi } from '@/api/demoDataApi';

const steps = ['Basic Information', 'Admin User', 'Subscription Plan'];

export default function InstitutionCreateWizard() {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState<InstitutionCreate>({
    name: '',
    slug: '',
    domain: '',
    description: '',
    max_users: undefined,
    admin_user: {
      email: '',
      first_name: '',
      last_name: '',
      phone: '',
      password: '',
    },
    subscription: {
      plan_name: 'Basic',
      billing_cycle: 'monthly',
      price: 0,
      max_users: undefined,
      max_storage_gb: undefined,
      features: '',
      trial_days: 0,
    },
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 0) {
      if (!formData.name) newErrors.name = 'Institution name is required';
      if (!formData.slug) newErrors.slug = 'Slug is required';
    } else if (step === 1) {
      if (!formData.admin_user.email) newErrors.email = 'Email is required';
      if (!formData.admin_user.first_name) newErrors.first_name = 'First name is required';
      if (!formData.admin_user.last_name) newErrors.last_name = 'Last name is required';
      if (!formData.admin_user.password) newErrors.password = 'Password is required';
      if (formData.admin_user.password && formData.admin_user.password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep(activeStep)) return;

    try {
      setSubmitting(true);
      setError(null);

      const submitData = { ...formData };
      if (!submitData.subscription?.trial_days) {
        submitData.subscription = undefined;
      }

      // Use demo data API if user is demo user, otherwise use real API
      const response = isDemoUser()
        ? await demoDataApi.superAdmin.createInstitution(submitData)
        : await superAdminApi.createInstitution(submitData);

      navigate(`/super-admin/institutions/${response.id}`);
    } catch (err: unknown) {
      const errorMessage =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail ||
            'Failed to create institution. Please try again.'
          : 'Failed to create institution. Please try again.';
      setError(errorMessage);
      console.error('Error creating institution:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Stack spacing={3}>
            <TextField
              label="Institution Name"
              value={formData.name}
              onChange={(e) => {
                const name = e.target.value;
                setFormData({
                  ...formData,
                  name,
                  slug: generateSlug(name),
                });
              }}
              error={!!errors.name}
              helperText={errors.name}
              required
              fullWidth
            />
            <TextField
              label="Slug"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              error={!!errors.slug}
              helperText={errors.slug || 'URL-friendly identifier (e.g., my-institution)'}
              required
              fullWidth
            />
            <TextField
              label="Domain"
              value={formData.domain}
              onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
              helperText="Optional custom domain (e.g., school.example.com)"
              fullWidth
            />
            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              multiline
              rows={4}
              fullWidth
            />
            <TextField
              label="Max Users"
              type="number"
              value={formData.max_users || ''}
              onChange={(e) =>
                setFormData({ ...formData, max_users: parseInt(e.target.value) || undefined })
              }
              helperText="Leave empty for unlimited users"
              fullWidth
            />
          </Stack>
        );

      case 1:
        return (
          <Stack spacing={3}>
            <Typography variant="body2" color="text.secondary">
              Create an admin user account for this institution
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="First Name"
                  value={formData.admin_user.first_name}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      admin_user: { ...formData.admin_user, first_name: e.target.value },
                    })
                  }
                  error={!!errors.first_name}
                  helperText={errors.first_name}
                  required
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Last Name"
                  value={formData.admin_user.last_name}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      admin_user: { ...formData.admin_user, last_name: e.target.value },
                    })
                  }
                  error={!!errors.last_name}
                  helperText={errors.last_name}
                  required
                  fullWidth
                />
              </Grid>
            </Grid>
            <TextField
              label="Email"
              type="email"
              value={formData.admin_user.email}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  admin_user: { ...formData.admin_user, email: e.target.value },
                })
              }
              error={!!errors.email}
              helperText={errors.email}
              required
              fullWidth
            />
            <TextField
              label="Phone"
              value={formData.admin_user.phone}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  admin_user: { ...formData.admin_user, phone: e.target.value },
                })
              }
              fullWidth
            />
            <TextField
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={formData.admin_user.password}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  admin_user: { ...formData.admin_user, password: e.target.value },
                })
              }
              error={!!errors.password}
              helperText={errors.password || 'Minimum 8 characters'}
              required
              fullWidth
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                      {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Stack>
        );

      case 2:
        return (
          <Stack spacing={3}>
            <Typography variant="body2" color="text.secondary">
              Configure subscription plan (optional)
            </Typography>
            <FormControl fullWidth>
              <InputLabel>Plan Name</InputLabel>
              <Select
                value={formData.subscription?.plan_name || 'Basic'}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    subscription: {
                      ...formData.subscription!,
                      plan_name: e.target.value,
                    },
                  })
                }
                label="Plan Name"
              >
                <MenuItem value="Basic">Basic</MenuItem>
                <MenuItem value="Pro">Pro</MenuItem>
                <MenuItem value="Enterprise">Enterprise</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Billing Cycle</InputLabel>
              <Select
                value={formData.subscription?.billing_cycle || 'monthly'}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    subscription: {
                      ...formData.subscription!,
                      billing_cycle: e.target.value,
                    },
                  })
                }
                label="Billing Cycle"
              >
                <MenuItem value="monthly">Monthly</MenuItem>
                <MenuItem value="quarterly">Quarterly</MenuItem>
                <MenuItem value="yearly">Yearly</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Price (₹)"
              type="number"
              value={formData.subscription?.price || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  subscription: {
                    ...formData.subscription!,
                    price: parseFloat(e.target.value) || 0,
                  },
                })
              }
              fullWidth
            />

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Max Users"
                  type="number"
                  value={formData.subscription?.max_users || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      subscription: {
                        ...formData.subscription!,
                        max_users: parseInt(e.target.value) || undefined,
                      },
                    })
                  }
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Max Storage (GB)"
                  type="number"
                  value={formData.subscription?.max_storage_gb || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      subscription: {
                        ...formData.subscription!,
                        max_storage_gb: parseInt(e.target.value) || undefined,
                      },
                    })
                  }
                  fullWidth
                />
              </Grid>
            </Grid>

            <TextField
              label="Trial Days"
              type="number"
              value={formData.subscription?.trial_days || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  subscription: {
                    ...formData.subscription!,
                    trial_days: parseInt(e.target.value) || 0,
                  },
                })
              }
              helperText="Set to 0 to skip trial period"
              fullWidth
            />

            <TextField
              label="Features"
              value={formData.subscription?.features || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  subscription: {
                    ...formData.subscription!,
                    features: e.target.value,
                  },
                })
              }
              helperText="JSON string of features"
              multiline
              rows={3}
              fullWidth
            />
          </Stack>
        );

      default:
        return null;
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/super-admin/institutions')}>
          Back to Institutions
        </Button>
      </Box>

      <Typography variant="h4" fontWeight={700} gutterBottom>
        Create New Institution
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Follow the steps to set up a new institution
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 4 }}>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Box sx={{ minHeight: 400 }}>{getStepContent(activeStep)}</Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button disabled={activeStep === 0} onClick={handleBack}>
            Back
          </Button>
          <Box>
            {activeStep === steps.length - 1 ? (
              <Button variant="contained" onClick={handleSubmit} disabled={submitting}>
                {submitting ? 'Creating...' : 'Create Institution'}
              </Button>
            ) : (
              <Button variant="contained" onClick={handleNext}>
                Next
              </Button>
            )}
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}

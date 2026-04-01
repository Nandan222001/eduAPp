import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  IconButton,
  Tabs,
  Tab,
  Divider,
  Alert,
  CircularProgress,
  Switch,
  FormControlLabel,
  Paper,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Upload as UploadIcon,
  Preview as PreviewIcon,
  Domain as DomainIcon,
  Palette as PaletteIcon,
  Email as EmailIcon,
  Login as LoginIcon,
  Settings as SettingsIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import superAdminApi, {
  InstitutionBranding,
  BrandingUpdate,
  CustomDomainResponse,
} from '@/api/superAdmin';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`branding-tabpanel-${index}`}
      aria-labelledby={`branding-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
}

function ColorPicker({ label, value, onChange }: ColorPickerProps) {
  return (
    <Box>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        {label}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: 60,
            height: 40,
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
          }}
        />
        <TextField
          value={value}
          onChange={(e) => onChange(e.target.value)}
          size="small"
          sx={{ width: 120 }}
        />
      </Box>
    </Box>
  );
}

export default function BrandingManager() {
  const { institutionId } = useParams<{ institutionId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [branding, setBranding] = useState<InstitutionBranding | null>(null);
  const [brandingData, setBrandingData] = useState<BrandingUpdate>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [domainDialogOpen, setDomainDialogOpen] = useState(false);
  const [customDomain, setCustomDomain] = useState('');
  const [sslEnabled, setSslEnabled] = useState(false);
  const [domainResponse, setDomainResponse] = useState<CustomDomainResponse | null>(null);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);

  const loadBranding = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await superAdminApi.getBranding(Number(institutionId));
      setBranding(data);
      setBrandingData({
        primary_color: data.primary_color,
        secondary_color: data.secondary_color,
        accent_color: data.accent_color,
        background_color: data.background_color,
        text_color: data.text_color,
        custom_domain: data.custom_domain,
        subdomain: data.subdomain,
        ssl_enabled: data.ssl_enabled,
        email_header_color: data.email_header_color,
        email_footer_text: data.email_footer_text,
        email_from_name: data.email_from_name,
        login_banner_text: data.login_banner_text,
        login_welcome_message: data.login_welcome_message,
        institution_name_override: data.institution_name_override,
        custom_css: data.custom_css,
        show_powered_by: data.show_powered_by,
        is_active: data.is_active,
      });
    } catch (err: unknown) {
      const error = err as { response?: { status?: number; data?: { detail?: string } } };
      if (error.response?.status === 404) {
        try {
          const newBranding = await superAdminApi.createBranding(Number(institutionId), {
            institution_id: Number(institutionId),
          });
          setBranding(newBranding);
        } catch (createErr: unknown) {
          const createError = createErr as { response?: { data?: { detail?: string } } };
          setError(createError.response?.data?.detail || 'Failed to create branding');
        }
      } else {
        setError(error.response?.data?.detail || 'Failed to load branding');
      }
    } finally {
      setLoading(false);
    }
  }, [institutionId]);

  useEffect(() => {
    loadBranding();
  }, [loadBranding]);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      const updated = await superAdminApi.updateBranding(Number(institutionId), brandingData);
      setBranding(updated);
      setSuccess('Branding saved successfully');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || 'Failed to save branding');
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (
    field: 'logo' | 'favicon' | 'email_logo' | 'login_background',
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploadingField(field);
      setError(null);
      await superAdminApi.uploadLogo(Number(institutionId), field, file);

      await loadBranding();
      setSuccess(`${field.replace('_', ' ')} uploaded successfully`);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || `Failed to upload ${field}`);
    } finally {
      setUploadingField(null);
    }
  };

  const handleSetCustomDomain = async () => {
    try {
      setSaving(true);
      setError(null);
      const response = await superAdminApi.setCustomDomain(Number(institutionId), {
        custom_domain: customDomain,
        ssl_enabled: sslEnabled,
      });
      setDomainResponse(response);
      await loadBranding();
      setSuccess('Custom domain configured successfully');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || 'Failed to set custom domain');
    } finally {
      setSaving(false);
    }
  };

  const handleVerifyDomain = async () => {
    try {
      setSaving(true);
      setError(null);
      const response = await superAdminApi.verifyDomain(Number(institutionId));
      setSuccess(response.message);
      await loadBranding();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || 'Failed to verify domain');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => navigate(-1)}>
            <ArrowBackIcon />
          </IconButton>
          <Box>
            <Typography variant="h4" fontWeight={700}>
              White-Label Branding
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Institution ID: {institutionId}
            </Typography>
          </Box>
        </Box>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<PreviewIcon />}
            onClick={() => setPreviewDialogOpen(true)}
          >
            Preview
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </Stack>
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
          <Tab label="Logo & Assets" icon={<UploadIcon />} iconPosition="start" />
          <Tab label="Color Scheme" icon={<PaletteIcon />} iconPosition="start" />
          <Tab label="Custom Domain" icon={<DomainIcon />} iconPosition="start" />
          <Tab label="Email Branding" icon={<EmailIcon />} iconPosition="start" />
          <Tab label="Login Page" icon={<LoginIcon />} iconPosition="start" />
          <Tab label="Advanced" icon={<SettingsIcon />} iconPosition="start" />
        </Tabs>
      </Paper>

      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <TabPanel value={tabValue} index={0}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Logo & Assets
                </Typography>
                <Divider sx={{ my: 2 }} />

                <Stack spacing={3}>
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Main Logo
                    </Typography>
                    {branding?.logo_url && (
                      <Box sx={{ mb: 2 }}>
                        <img
                          src={branding.logo_url}
                          alt="Logo"
                          style={{ maxHeight: 100, maxWidth: '100%' }}
                        />
                      </Box>
                    )}
                    <input
                      accept="image/*"
                      style={{ display: 'none' }}
                      id="logo-upload"
                      type="file"
                      onChange={(e) => handleFileUpload('logo', e)}
                    />
                    <label htmlFor="logo-upload">
                      <Button
                        variant="outlined"
                        component="span"
                        startIcon={
                          uploadingField === 'logo' ? (
                            <CircularProgress size={20} />
                          ) : (
                            <UploadIcon />
                          )
                        }
                        disabled={uploadingField === 'logo'}
                      >
                        Upload Logo
                      </Button>
                    </label>
                  </Box>

                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Favicon
                    </Typography>
                    {branding?.favicon_url && (
                      <Box sx={{ mb: 2 }}>
                        <img
                          src={branding.favicon_url}
                          alt="Favicon"
                          style={{ maxHeight: 32, maxWidth: 32 }}
                        />
                      </Box>
                    )}
                    <input
                      accept="image/*"
                      style={{ display: 'none' }}
                      id="favicon-upload"
                      type="file"
                      onChange={(e) => handleFileUpload('favicon', e)}
                    />
                    <label htmlFor="favicon-upload">
                      <Button
                        variant="outlined"
                        component="span"
                        startIcon={
                          uploadingField === 'favicon' ? (
                            <CircularProgress size={20} />
                          ) : (
                            <UploadIcon />
                          )
                        }
                        disabled={uploadingField === 'favicon'}
                      >
                        Upload Favicon
                      </Button>
                    </label>
                  </Box>

                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Email Logo
                    </Typography>
                    {branding?.email_logo_url && (
                      <Box sx={{ mb: 2 }}>
                        <img
                          src={branding.email_logo_url}
                          alt="Email Logo"
                          style={{ maxHeight: 80, maxWidth: '100%' }}
                        />
                      </Box>
                    )}
                    <input
                      accept="image/*"
                      style={{ display: 'none' }}
                      id="email-logo-upload"
                      type="file"
                      onChange={(e) => handleFileUpload('email_logo', e)}
                    />
                    <label htmlFor="email-logo-upload">
                      <Button
                        variant="outlined"
                        component="span"
                        startIcon={
                          uploadingField === 'email_logo' ? (
                            <CircularProgress size={20} />
                          ) : (
                            <UploadIcon />
                          )
                        }
                        disabled={uploadingField === 'email_logo'}
                      >
                        Upload Email Logo
                      </Button>
                    </label>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Color Scheme
                </Typography>
                <Divider sx={{ my: 2 }} />

                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <ColorPicker
                      label="Primary Color"
                      value={brandingData.primary_color || '#1976d2'}
                      onChange={(color) =>
                        setBrandingData({ ...brandingData, primary_color: color })
                      }
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <ColorPicker
                      label="Secondary Color"
                      value={brandingData.secondary_color || '#dc004e'}
                      onChange={(color) =>
                        setBrandingData({ ...brandingData, secondary_color: color })
                      }
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <ColorPicker
                      label="Accent Color"
                      value={brandingData.accent_color || '#f50057'}
                      onChange={(color) =>
                        setBrandingData({ ...brandingData, accent_color: color })
                      }
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <ColorPicker
                      label="Background Color"
                      value={brandingData.background_color || '#ffffff'}
                      onChange={(color) =>
                        setBrandingData({ ...brandingData, background_color: color })
                      }
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <ColorPicker
                      label="Text Color"
                      value={brandingData.text_color || '#000000'}
                      onChange={(color) => setBrandingData({ ...brandingData, text_color: color })}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Custom Domain
                </Typography>
                <Divider sx={{ my: 2 }} />

                <Stack spacing={3}>
                  {branding?.custom_domain && (
                    <Box>
                      <Alert
                        severity={branding.domain_verified ? 'success' : 'warning'}
                        icon={branding.domain_verified ? <CheckCircleIcon /> : <WarningIcon />}
                        action={
                          !branding.domain_verified && (
                            <Button color="inherit" size="small" onClick={handleVerifyDomain}>
                              Verify
                            </Button>
                          )
                        }
                      >
                        Domain: {branding.custom_domain} -{' '}
                        {branding.domain_verified ? 'Verified' : 'Pending Verification'}
                      </Alert>
                    </Box>
                  )}

                  <TextField
                    label="Subdomain"
                    value={brandingData.subdomain || ''}
                    onChange={(e) =>
                      setBrandingData({ ...brandingData, subdomain: e.target.value })
                    }
                    helperText="e.g., 'school' for school.yourdomain.com"
                    fullWidth
                  />

                  <Button variant="outlined" onClick={() => setDomainDialogOpen(true)}>
                    Configure Custom Domain
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </TabPanel>

          <TabPanel value={tabValue} index={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Email Branding
                </Typography>
                <Divider sx={{ my: 2 }} />

                <Stack spacing={3}>
                  <ColorPicker
                    label="Email Header Color"
                    value={brandingData.email_header_color || '#1976d2'}
                    onChange={(color) =>
                      setBrandingData({ ...brandingData, email_header_color: color })
                    }
                  />

                  <TextField
                    label="Email From Name"
                    value={brandingData.email_from_name || ''}
                    onChange={(e) =>
                      setBrandingData({ ...brandingData, email_from_name: e.target.value })
                    }
                    fullWidth
                  />

                  <TextField
                    label="Email Footer Text"
                    value={brandingData.email_footer_text || ''}
                    onChange={(e) =>
                      setBrandingData({ ...brandingData, email_footer_text: e.target.value })
                    }
                    multiline
                    rows={3}
                    fullWidth
                  />
                </Stack>
              </CardContent>
            </Card>
          </TabPanel>

          <TabPanel value={tabValue} index={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Login Page Customization
                </Typography>
                <Divider sx={{ my: 2 }} />

                <Stack spacing={3}>
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Background Image
                    </Typography>
                    {branding?.login_background_url && (
                      <Box sx={{ mb: 2 }}>
                        <img
                          src={branding.login_background_url}
                          alt="Login Background"
                          style={{ maxHeight: 200, maxWidth: '100%', objectFit: 'cover' }}
                        />
                      </Box>
                    )}
                    <input
                      accept="image/*"
                      style={{ display: 'none' }}
                      id="login-bg-upload"
                      type="file"
                      onChange={(e) => handleFileUpload('login_background', e)}
                    />
                    <label htmlFor="login-bg-upload">
                      <Button
                        variant="outlined"
                        component="span"
                        startIcon={
                          uploadingField === 'login_background' ? (
                            <CircularProgress size={20} />
                          ) : (
                            <UploadIcon />
                          )
                        }
                        disabled={uploadingField === 'login_background'}
                      >
                        Upload Background
                      </Button>
                    </label>
                  </Box>

                  <TextField
                    label="Banner Text"
                    value={brandingData.login_banner_text || ''}
                    onChange={(e) =>
                      setBrandingData({ ...brandingData, login_banner_text: e.target.value })
                    }
                    fullWidth
                  />

                  <TextField
                    label="Welcome Message"
                    value={brandingData.login_welcome_message || ''}
                    onChange={(e) =>
                      setBrandingData({
                        ...brandingData,
                        login_welcome_message: e.target.value,
                      })
                    }
                    multiline
                    rows={3}
                    fullWidth
                  />
                </Stack>
              </CardContent>
            </Card>
          </TabPanel>

          <TabPanel value={tabValue} index={5}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Advanced Settings
                </Typography>
                <Divider sx={{ my: 2 }} />

                <Stack spacing={3}>
                  <TextField
                    label="Institution Name Override"
                    value={brandingData.institution_name_override || ''}
                    onChange={(e) =>
                      setBrandingData({
                        ...brandingData,
                        institution_name_override: e.target.value,
                      })
                    }
                    helperText="Override the institution name displayed to users"
                    fullWidth
                  />

                  <TextField
                    label="Custom CSS"
                    value={brandingData.custom_css || ''}
                    onChange={(e) =>
                      setBrandingData({ ...brandingData, custom_css: e.target.value })
                    }
                    multiline
                    rows={6}
                    fullWidth
                    helperText="Add custom CSS to further customize the appearance"
                  />

                  <FormControlLabel
                    control={
                      <Switch
                        checked={brandingData.show_powered_by ?? true}
                        onChange={(e) =>
                          setBrandingData({
                            ...brandingData,
                            show_powered_by: e.target.checked,
                          })
                        }
                      />
                    }
                    label="Show 'Powered By' branding"
                  />

                  <FormControlLabel
                    control={
                      <Switch
                        checked={brandingData.is_active ?? true}
                        onChange={(e) =>
                          setBrandingData({ ...brandingData, is_active: e.target.checked })
                        }
                      />
                    }
                    label="Branding Active"
                  />
                </Stack>
              </CardContent>
            </Card>
          </TabPanel>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Card sx={{ position: 'sticky', top: 20 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Live Preview
              </Typography>
              <Divider sx={{ my: 2 }} />

              <Paper
                sx={{
                  p: 3,
                  backgroundColor: brandingData.background_color || '#ffffff',
                  color: brandingData.text_color || '#000000',
                  minHeight: 200,
                }}
              >
                {branding?.logo_url && (
                  <Box sx={{ mb: 2, textAlign: 'center' }}>
                    <img
                      src={branding.logo_url}
                      alt="Preview Logo"
                      style={{ maxHeight: 60, maxWidth: '100%' }}
                    />
                  </Box>
                )}

                <Typography
                  variant="h6"
                  sx={{ color: brandingData.primary_color || '#1976d2', mb: 1 }}
                >
                  {brandingData.institution_name_override || 'Institution Name'}
                </Typography>

                <Button
                  variant="contained"
                  size="small"
                  sx={{
                    backgroundColor: brandingData.primary_color || '#1976d2',
                    color: '#fff',
                    mb: 1,
                    '&:hover': {
                      backgroundColor: brandingData.secondary_color || '#dc004e',
                    },
                  }}
                >
                  Primary Button
                </Button>

                <Button
                  variant="outlined"
                  size="small"
                  sx={{
                    borderColor: brandingData.secondary_color || '#dc004e',
                    color: brandingData.secondary_color || '#dc004e',
                    ml: 1,
                  }}
                >
                  Secondary
                </Button>

                <Box sx={{ mt: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    Preview how your branding will appear to users
                  </Typography>
                </Box>
              </Paper>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Dialog
        open={domainDialogOpen}
        onClose={() => setDomainDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Configure Custom Domain</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Custom Domain"
              value={customDomain}
              onChange={(e) => setCustomDomain(e.target.value)}
              placeholder="school.yourdomain.com"
              fullWidth
            />

            <FormControlLabel
              control={
                <Switch checked={sslEnabled} onChange={(e) => setSslEnabled(e.target.checked)} />
              }
              label="Enable SSL"
            />

            {domainResponse && (
              <Box>
                <Alert severity="info" sx={{ mb: 2 }}>
                  {domainResponse.verification_instructions}
                </Alert>
                <Typography variant="subtitle2" gutterBottom>
                  DNS Records:
                </Typography>
                <List dense>
                  {domainResponse.dns_records.map((record, index) => (
                    <ListItem key={index}>
                      <ListItemText
                        primary={`${record.type}: ${record.name}`}
                        secondary={`Value: ${record.value} | TTL: ${record.ttl}`}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDomainDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSetCustomDomain}
            variant="contained"
            disabled={!customDomain || saving}
          >
            {saving ? 'Configuring...' : 'Configure'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={previewDialogOpen}
        onClose={() => setPreviewDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Branding Preview</DialogTitle>
        <DialogContent>
          <Box sx={{ p: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              This is how your institution&apos;s branding will appear to users.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

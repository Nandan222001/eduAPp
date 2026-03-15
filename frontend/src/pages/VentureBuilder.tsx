import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Button,
  Stepper,
  Step,
  StepLabel,
  TextField,
  Paper,
  Stack,
  Divider,
  IconButton,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  LinearProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Slider,
  Avatar,
} from '@mui/material';
import {
  Save as SaveIcon,
  NavigateNext as NextIcon,
  NavigateBefore as BackIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Preview as PreviewIcon,
  Calculate as CalculateIcon,
  Palette as PaletteIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import entrepreneurshipApi from '@/api/entrepreneurship';
import { BusinessPlanData, PitchDeckSlide, LogoDesign } from '@/types/entrepreneurship';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
};

const businessPlanSteps = [
  'Executive Summary',
  'Business Description',
  'Market Analysis',
  'Organization & Management',
  'Marketing & Sales',
  'Financial Projections',
  'Funding Request',
];

const pitchSlideTemplates = [
  { type: 'title', title: 'Title Slide', layout: 'center' },
  { type: 'problem', title: 'Problem Statement', layout: 'text' },
  { type: 'solution', title: 'Our Solution', layout: 'text-image' },
  { type: 'market', title: 'Market Opportunity', layout: 'stats' },
  { type: 'product', title: 'Product Demo', layout: 'image' },
  { type: 'business_model', title: 'Business Model', layout: 'diagram' },
  { type: 'traction', title: 'Traction', layout: 'metrics' },
  { type: 'team', title: 'Team', layout: 'team' },
  { type: 'financials', title: 'Financial Projections', layout: 'chart' },
  { type: 'ask', title: 'The Ask', layout: 'center' },
];

export default function VentureBuilder() {
  const [activeTab, setActiveTab] = useState(0);
  const [activeStep, setActiveStep] = useState(0);
  const [businessPlan, setBusinessPlan] = useState<BusinessPlanData>({});
  const [pitchSlides, setPitchSlides] = useState<PitchDeckSlide[]>([]);
  const [logoDesign, setLogoDesign] = useState<LogoDesign>({
    business_name: '',
    color_scheme: ['#1976d2', '#ffffff'],
    style: 'modern',
    font_family: 'Arial',
  });
  const [financialData, setFinancialData] = useState({
    initial_investment: 0,
    monthly_revenue: 0,
    monthly_expenses: 0,
    growth_rate: 0,
    period_months: 12,
  });
  const [projections, setProjections] = useState<Record<string, unknown>[]>([]);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const institutionId = parseInt(localStorage.getItem('institution_id') || '1');

  useEffect(() => {
    calculateProgress();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessPlan, pitchSlides, logoDesign]);

  const calculateProgress = () => {
    let completed = 0;
    let total = 0;

    if (activeTab === 0) {
      const fields = Object.keys(businessPlan).length;
      total = 7;
      completed = fields;
    } else if (activeTab === 1) {
      total = pitchSlideTemplates.length;
      completed = pitchSlides.length;
    } else if (activeTab === 2) {
      total = 4;
      if (logoDesign.business_name) completed++;
      if (logoDesign.color_scheme.length > 0) completed++;
      if (logoDesign.style) completed++;
      if (logoDesign.font_family) completed++;
    }

    setProgress((completed / total) * 100);
  };

  const handleNext = () => {
    setActiveStep((prev) => Math.min(prev + 1, businessPlanSteps.length - 1));
  };

  const handleBack = () => {
    setActiveStep((prev) => Math.max(prev - 1, 0));
  };

  const handleBusinessPlanChange = (field: keyof BusinessPlanData, value: string) => {
    setBusinessPlan((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveBusinessPlan = async () => {
    try {
      setLoading(true);
      const ventureId = 1;
      await entrepreneurshipApi.saveBusinessPlan(institutionId, ventureId, businessPlan);
      alert('Business plan saved successfully!');
    } catch (error) {
      console.error('Failed to save business plan:', error);
      alert('Failed to save business plan');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSlide = (template: (typeof pitchSlideTemplates)[0]) => {
    const newSlide: PitchDeckSlide = {
      id: Date.now().toString(),
      type: template.type,
      title: template.title,
      content: '',
      layout: template.layout,
    };
    setPitchSlides((prev) => [...prev, newSlide]);
  };

  const handleUpdateSlide = (id: string, field: keyof PitchDeckSlide, value: string) => {
    setPitchSlides((prev) =>
      prev.map((slide) => (slide.id === id ? { ...slide, [field]: value } : slide))
    );
  };

  const handleDeleteSlide = (id: string) => {
    setPitchSlides((prev) => prev.filter((slide) => slide.id !== id));
  };

  const handleSavePitchDeck = async () => {
    try {
      setLoading(true);
      const ventureId = 1;
      await entrepreneurshipApi.savePitchDeck(institutionId, ventureId, pitchSlides);
      alert('Pitch deck saved successfully!');
    } catch (error) {
      console.error('Failed to save pitch deck:', error);
      alert('Failed to save pitch deck');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateLogo = async () => {
    try {
      setLoading(true);
      const result = await entrepreneurshipApi.generateLogo(logoDesign);
      alert('Logo generated! URL: ' + result.logo_url);
    } catch (error) {
      console.error('Failed to generate logo:', error);
      alert('Failed to generate logo');
    } finally {
      setLoading(false);
    }
  };

  const handleCalculateProjections = async () => {
    try {
      setLoading(true);
      const result = await entrepreneurshipApi.calculateFinancialProjections(financialData);
      setProjections(result.projections);
    } catch (error) {
      console.error('Failed to calculate projections:', error);
      alert('Failed to calculate projections');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" fontWeight={700} gutterBottom>
          Venture Builder
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Build your business plan, pitch deck, and brand identity
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardHeader title="Progress Tracker" />
            <CardContent>
              <Box sx={{ mb: 2 }}>
                <Typography variant="h2" fontWeight={700} textAlign="center">
                  {Math.round(progress)}%
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={progress}
                  sx={{ height: 10, borderRadius: 5, mt: 2 }}
                />
              </Box>
              <Divider sx={{ my: 2 }} />
              <Stack spacing={1}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Business Plan</Typography>
                  <Chip
                    label={`${Object.keys(businessPlan).length}/7`}
                    size="small"
                    color={Object.keys(businessPlan).length === 7 ? 'success' : 'default'}
                  />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Pitch Deck</Typography>
                  <Chip
                    label={`${pitchSlides.length}/${pitchSlideTemplates.length}`}
                    size="small"
                    color={
                      pitchSlides.length === pitchSlideTemplates.length ? 'success' : 'default'
                    }
                  />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Logo Design</Typography>
                  <Chip
                    label={logoDesign.business_name ? 'Done' : 'Pending'}
                    size="small"
                    color={logoDesign.business_name ? 'success' : 'default'}
                  />
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={9}>
          <Paper>
            <Tabs
              value={activeTab}
              onChange={(_, newValue) => setActiveTab(newValue)}
              variant="fullWidth"
            >
              <Tab label="Business Plan" />
              <Tab label="Pitch Deck" />
              <Tab label="Logo Designer" />
              <Tab label="Financial Calculator" />
            </Tabs>

            <TabPanel value={activeTab} index={0}>
              <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
                {businessPlanSteps.map((label) => (
                  <Step key={label}>
                    <StepLabel>{label}</StepLabel>
                  </Step>
                ))}
              </Stepper>

              <Card>
                <CardContent>
                  {activeStep === 0 && (
                    <Stack spacing={3}>
                      <Typography variant="h6">Executive Summary</Typography>
                      <Alert severity="info">
                        Provide a brief overview of your business concept, mission, and key
                        highlights.
                      </Alert>
                      <TextField
                        fullWidth
                        multiline
                        rows={6}
                        label="Executive Summary"
                        value={businessPlan.executive_summary || ''}
                        onChange={(e) =>
                          handleBusinessPlanChange('executive_summary', e.target.value)
                        }
                        placeholder="Write a compelling executive summary..."
                      />
                    </Stack>
                  )}

                  {activeStep === 1 && (
                    <Stack spacing={3}>
                      <Typography variant="h6">Business Description</Typography>
                      <Alert severity="info">
                        Describe your business in detail, including products/services and unique
                        value proposition.
                      </Alert>
                      <TextField
                        fullWidth
                        multiline
                        rows={6}
                        label="Business Description"
                        value={businessPlan.business_description || ''}
                        onChange={(e) =>
                          handleBusinessPlanChange('business_description', e.target.value)
                        }
                        placeholder="Describe your business..."
                      />
                    </Stack>
                  )}

                  {activeStep === 2 && (
                    <Stack spacing={3}>
                      <Typography variant="h6">Market Analysis</Typography>
                      <Alert severity="info">
                        Analyze your target market, competitors, and market trends.
                      </Alert>
                      <TextField
                        fullWidth
                        multiline
                        rows={6}
                        label="Market Analysis"
                        value={businessPlan.market_analysis || ''}
                        onChange={(e) =>
                          handleBusinessPlanChange('market_analysis', e.target.value)
                        }
                        placeholder="Analyze your market..."
                      />
                    </Stack>
                  )}

                  {activeStep === 3 && (
                    <Stack spacing={3}>
                      <Typography variant="h6">Organization & Management</Typography>
                      <Alert severity="info">
                        Describe your team structure, key roles, and management approach.
                      </Alert>
                      <TextField
                        fullWidth
                        multiline
                        rows={6}
                        label="Organization & Management"
                        value={businessPlan.organization_management || ''}
                        onChange={(e) =>
                          handleBusinessPlanChange('organization_management', e.target.value)
                        }
                        placeholder="Describe your organization..."
                      />
                    </Stack>
                  )}

                  {activeStep === 4 && (
                    <Stack spacing={3}>
                      <Typography variant="h6">Marketing & Sales Strategy</Typography>
                      <Alert severity="info">
                        Outline your marketing channels, customer acquisition strategy, and sales
                        process.
                      </Alert>
                      <TextField
                        fullWidth
                        multiline
                        rows={6}
                        label="Marketing & Sales"
                        value={businessPlan.marketing_sales || ''}
                        onChange={(e) =>
                          handleBusinessPlanChange('marketing_sales', e.target.value)
                        }
                        placeholder="Describe your marketing strategy..."
                      />
                    </Stack>
                  )}

                  {activeStep === 5 && (
                    <Stack spacing={3}>
                      <Typography variant="h6">Financial Projections</Typography>
                      <Alert severity="info">
                        Provide financial forecasts including revenue, expenses, and profitability.
                      </Alert>
                      <TextField
                        fullWidth
                        multiline
                        rows={6}
                        label="Financial Projections"
                        placeholder="Describe your financial projections..."
                      />
                    </Stack>
                  )}

                  {activeStep === 6 && (
                    <Stack spacing={3}>
                      <Typography variant="h6">Funding Request</Typography>
                      <Alert severity="info">
                        Specify how much funding you need and how you will use it.
                      </Alert>
                      <TextField
                        fullWidth
                        multiline
                        rows={6}
                        label="Funding Request"
                        value={businessPlan.funding_request || ''}
                        onChange={(e) =>
                          handleBusinessPlanChange('funding_request', e.target.value)
                        }
                        placeholder="Describe your funding needs..."
                      />
                    </Stack>
                  )}

                  <Stack direction="row" spacing={2} sx={{ mt: 3 }} justifyContent="space-between">
                    <Button
                      disabled={activeStep === 0}
                      onClick={handleBack}
                      startIcon={<BackIcon />}
                    >
                      Back
                    </Button>
                    <Stack direction="row" spacing={2}>
                      <Button
                        variant="outlined"
                        startIcon={<SaveIcon />}
                        onClick={handleSaveBusinessPlan}
                        disabled={loading}
                      >
                        Save Draft
                      </Button>
                      {activeStep < businessPlanSteps.length - 1 && (
                        <Button variant="contained" endIcon={<NextIcon />} onClick={handleNext}>
                          Next
                        </Button>
                      )}
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            </TabPanel>

            <TabPanel value={activeTab} index={1}>
              <Stack spacing={3}>
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Pitch Deck Creator
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Build your pitch deck using professional slide templates
                  </Typography>
                </Box>

                <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Available Templates
                  </Typography>
                  <Grid container spacing={2} sx={{ mt: 1 }}>
                    {pitchSlideTemplates.map((template) => (
                      <Grid item xs={12} sm={6} md={4} key={template.type}>
                        <Card sx={{ cursor: 'pointer' }} onClick={() => handleAddSlide(template)}>
                          <CardContent>
                            <Typography variant="subtitle2" gutterBottom>
                              {template.title}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {template.layout}
                            </Typography>
                            <Box sx={{ mt: 1 }}>
                              <Button size="small" startIcon={<AddIcon />} fullWidth>
                                Add Slide
                              </Button>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </Paper>

                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Your Slides ({pitchSlides.length})
                  </Typography>
                  <Stack spacing={2} sx={{ mt: 2 }}>
                    {pitchSlides.map((slide, index) => (
                      <Card key={slide.id}>
                        <CardContent>
                          <Stack
                            direction="row"
                            justifyContent="space-between"
                            alignItems="center"
                            sx={{ mb: 2 }}
                          >
                            <Chip label={`Slide ${index + 1}`} size="small" />
                            <IconButton size="small" onClick={() => handleDeleteSlide(slide.id)}>
                              <DeleteIcon />
                            </IconButton>
                          </Stack>
                          <TextField
                            fullWidth
                            label="Slide Title"
                            value={slide.title}
                            onChange={(e) => handleUpdateSlide(slide.id, 'title', e.target.value)}
                            sx={{ mb: 2 }}
                          />
                          <TextField
                            fullWidth
                            multiline
                            rows={3}
                            label="Slide Content"
                            value={slide.content}
                            onChange={(e) => handleUpdateSlide(slide.id, 'content', e.target.value)}
                          />
                        </CardContent>
                      </Card>
                    ))}
                  </Stack>
                </Box>

                <Stack direction="row" spacing={2}>
                  <Button
                    variant="outlined"
                    startIcon={<SaveIcon />}
                    onClick={handleSavePitchDeck}
                    disabled={loading || pitchSlides.length === 0}
                  >
                    Save Pitch Deck
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<PreviewIcon />}
                    onClick={() => setPreviewOpen(true)}
                    disabled={pitchSlides.length === 0}
                  >
                    Preview
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    disabled={pitchSlides.length === 0}
                  >
                    Export as PDF
                  </Button>
                </Stack>
              </Stack>
            </TabPanel>

            <TabPanel value={activeTab} index={2}>
              <Stack spacing={3}>
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Logo Designer
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Create a professional logo for your venture
                  </Typography>
                </Box>

                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Stack spacing={3}>
                      <TextField
                        fullWidth
                        label="Business Name"
                        value={logoDesign.business_name}
                        onChange={(e) =>
                          setLogoDesign({ ...logoDesign, business_name: e.target.value })
                        }
                      />

                      <TextField
                        fullWidth
                        label="Tagline (Optional)"
                        value={logoDesign.tagline || ''}
                        onChange={(e) => setLogoDesign({ ...logoDesign, tagline: e.target.value })}
                      />

                      <FormControl fullWidth>
                        <InputLabel>Logo Style</InputLabel>
                        <Select
                          value={logoDesign.style}
                          onChange={(e) => setLogoDesign({ ...logoDesign, style: e.target.value })}
                        >
                          <MenuItem value="modern">Modern</MenuItem>
                          <MenuItem value="classic">Classic</MenuItem>
                          <MenuItem value="minimalist">Minimalist</MenuItem>
                          <MenuItem value="playful">Playful</MenuItem>
                          <MenuItem value="professional">Professional</MenuItem>
                        </Select>
                      </FormControl>

                      <FormControl fullWidth>
                        <InputLabel>Font Family</InputLabel>
                        <Select
                          value={logoDesign.font_family}
                          onChange={(e) =>
                            setLogoDesign({ ...logoDesign, font_family: e.target.value })
                          }
                        >
                          <MenuItem value="Arial">Arial</MenuItem>
                          <MenuItem value="Helvetica">Helvetica</MenuItem>
                          <MenuItem value="Times New Roman">Times New Roman</MenuItem>
                          <MenuItem value="Georgia">Georgia</MenuItem>
                          <MenuItem value="Courier">Courier</MenuItem>
                        </Select>
                      </FormControl>

                      <Box>
                        <Typography variant="subtitle2" gutterBottom>
                          Color Scheme
                        </Typography>
                        <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                          <TextField
                            type="color"
                            label="Primary Color"
                            value={logoDesign.color_scheme[0]}
                            onChange={(e) =>
                              setLogoDesign({
                                ...logoDesign,
                                color_scheme: [e.target.value, logoDesign.color_scheme[1]],
                              })
                            }
                          />
                          <TextField
                            type="color"
                            label="Secondary Color"
                            value={logoDesign.color_scheme[1]}
                            onChange={(e) =>
                              setLogoDesign({
                                ...logoDesign,
                                color_scheme: [logoDesign.color_scheme[0], e.target.value],
                              })
                            }
                          />
                        </Stack>
                      </Box>

                      <Button
                        variant="contained"
                        startIcon={<PaletteIcon />}
                        onClick={handleGenerateLogo}
                        disabled={loading || !logoDesign.business_name}
                      >
                        Generate Logo
                      </Button>
                    </Stack>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Paper
                      sx={{
                        p: 4,
                        height: 400,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: 'background.default',
                      }}
                    >
                      <Box sx={{ textAlign: 'center' }}>
                        <Avatar
                          sx={{
                            width: 120,
                            height: 120,
                            bgcolor: logoDesign.color_scheme[0],
                            color: logoDesign.color_scheme[1],
                            fontSize: 48,
                            fontFamily: logoDesign.font_family,
                            mx: 'auto',
                            mb: 2,
                          }}
                        >
                          {logoDesign.business_name.charAt(0) || 'L'}
                        </Avatar>
                        <Typography
                          variant="h4"
                          fontWeight={700}
                          sx={{
                            fontFamily: logoDesign.font_family,
                            color: logoDesign.color_scheme[0],
                          }}
                        >
                          {logoDesign.business_name || 'Your Business'}
                        </Typography>
                        {logoDesign.tagline && (
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            {logoDesign.tagline}
                          </Typography>
                        )}
                      </Box>
                    </Paper>
                  </Grid>
                </Grid>
              </Stack>
            </TabPanel>

            <TabPanel value={activeTab} index={3}>
              <Stack spacing={3}>
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Financial Projection Calculator
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Calculate revenue projections based on your business model
                  </Typography>
                </Box>

                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Stack spacing={3}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Initial Investment ($)"
                        value={financialData.initial_investment}
                        onChange={(e) =>
                          setFinancialData({
                            ...financialData,
                            initial_investment: Number(e.target.value),
                          })
                        }
                      />

                      <TextField
                        fullWidth
                        type="number"
                        label="Expected Monthly Revenue ($)"
                        value={financialData.monthly_revenue}
                        onChange={(e) =>
                          setFinancialData({
                            ...financialData,
                            monthly_revenue: Number(e.target.value),
                          })
                        }
                      />

                      <TextField
                        fullWidth
                        type="number"
                        label="Monthly Expenses ($)"
                        value={financialData.monthly_expenses}
                        onChange={(e) =>
                          setFinancialData({
                            ...financialData,
                            monthly_expenses: Number(e.target.value),
                          })
                        }
                      />

                      <Box>
                        <Typography variant="subtitle2" gutterBottom>
                          Monthly Growth Rate: {financialData.growth_rate}%
                        </Typography>
                        <Slider
                          value={financialData.growth_rate}
                          onChange={(_, value) =>
                            setFinancialData({ ...financialData, growth_rate: value as number })
                          }
                          min={0}
                          max={50}
                          valueLabelDisplay="auto"
                        />
                      </Box>

                      <TextField
                        fullWidth
                        type="number"
                        label="Projection Period (Months)"
                        value={financialData.period_months}
                        onChange={(e) =>
                          setFinancialData({
                            ...financialData,
                            period_months: Number(e.target.value),
                          })
                        }
                      />

                      <Button
                        variant="contained"
                        startIcon={<CalculateIcon />}
                        onClick={handleCalculateProjections}
                        disabled={loading}
                      >
                        Calculate Projections
                      </Button>
                    </Stack>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    {projections.length > 0 ? (
                      <Card>
                        <CardHeader title="Financial Projections" />
                        <CardContent>
                          <Stack spacing={2}>
                            {projections.map((projection, index) => (
                              <Paper key={index} sx={{ p: 2, bgcolor: 'background.default' }}>
                                <Typography variant="subtitle2" gutterBottom>
                                  {projection.period}
                                </Typography>
                                <Grid container spacing={2}>
                                  <Grid item xs={4}>
                                    <Typography variant="caption" color="text.secondary">
                                      Revenue
                                    </Typography>
                                    <Typography
                                      variant="body2"
                                      fontWeight={600}
                                      color="success.main"
                                    >
                                      ${projection.revenue.toLocaleString()}
                                    </Typography>
                                  </Grid>
                                  <Grid item xs={4}>
                                    <Typography variant="caption" color="text.secondary">
                                      Expenses
                                    </Typography>
                                    <Typography variant="body2" fontWeight={600} color="error.main">
                                      ${projection.expenses.toLocaleString()}
                                    </Typography>
                                  </Grid>
                                  <Grid item xs={4}>
                                    <Typography variant="caption" color="text.secondary">
                                      Profit
                                    </Typography>
                                    <Typography variant="body2" fontWeight={600}>
                                      ${projection.profit.toLocaleString()}
                                    </Typography>
                                  </Grid>
                                </Grid>
                              </Paper>
                            ))}
                          </Stack>
                        </CardContent>
                      </Card>
                    ) : (
                      <Paper
                        sx={{
                          p: 4,
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: 'background.default',
                        }}
                      >
                        <Typography variant="body2" color="text.secondary" textAlign="center">
                          Enter your financial data and click Calculate to see projections
                        </Typography>
                      </Paper>
                    )}
                  </Grid>
                </Grid>
              </Stack>
            </TabPanel>
          </Paper>
        </Grid>
      </Grid>

      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Pitch Deck Preview</DialogTitle>
        <DialogContent>
          <Stack spacing={3}>
            {pitchSlides.map((slide, index) => (
              <Paper key={slide.id} sx={{ p: 3, bgcolor: 'background.default' }}>
                <Typography variant="caption" color="text.secondary">
                  Slide {index + 1}
                </Typography>
                <Typography variant="h5" fontWeight={700} gutterBottom>
                  {slide.title}
                </Typography>
                <Typography variant="body1">{slide.content}</Typography>
              </Paper>
            ))}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

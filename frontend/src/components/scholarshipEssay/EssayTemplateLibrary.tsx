import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Button,
  Chip,
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
  Paper,
  Stack,
  useTheme,
  alpha,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Rating,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { Search as SearchIcon, Visibility as ViewIcon } from '@mui/icons-material';
import { scholarshipEssayApi } from '@/api/scholarshipEssay';
import type { EssayTemplate } from '@/types/scholarshipEssay';

export default function EssayTemplateLibrary() {
  const theme = useTheme();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [templates, setTemplates] = useState<EssayTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<EssayTemplate[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedApproach, setSelectedApproach] = useState<string>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<EssayTemplate | null>(null);
  const [showViewDialog, setShowViewDialog] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  useEffect(() => {
    filterTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templates, searchQuery, selectedApproach]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const data = await scholarshipEssayApi.getTemplates();
      setTemplates(data);
      setError(null);
    } catch (err) {
      setError('Failed to load templates');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filterTemplates = () => {
    let filtered = templates;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.title.toLowerCase().includes(query) ||
          t.description.toLowerCase().includes(query) ||
          t.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    if (selectedApproach !== 'all') {
      filtered = filtered.filter((t) => t.approach === selectedApproach);
    }

    setFilteredTemplates(filtered);
  };

  const handleViewTemplate = (template: EssayTemplate) => {
    setSelectedTemplate(template);
    setShowViewDialog(true);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Essay Template Library
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Learn from successful scholarship essays with different approaches
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper elevation={0} sx={{ p: 3, mb: 3, border: `1px solid ${theme.palette.divider}` }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Approach</InputLabel>
              <Select
                value={selectedApproach}
                onChange={(e) => setSelectedApproach(e.target.value)}
                label="Approach"
              >
                <MenuItem value="all">All Approaches</MenuItem>
                <MenuItem value="narrative">Narrative</MenuItem>
                <MenuItem value="analytical">Analytical</MenuItem>
                <MenuItem value="reflective">Reflective</MenuItem>
                <MenuItem value="creative">Creative</MenuItem>
                <MenuItem value="hybrid">Hybrid</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      <Grid container spacing={3}>
        {filteredTemplates.map((template) => (
          <Grid item xs={12} md={6} lg={4} key={template.id}>
            <Card
              elevation={0}
              sx={{
                border: `1px solid ${theme.palette.divider}`,
                height: '100%',
                transition: 'all 0.3s',
                '&:hover': {
                  boxShadow: theme.shadows[4],
                  transform: 'translateY(-4px)',
                },
              }}
            >
              <CardHeader
                title={template.title}
                subheader={
                  <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                    <Chip label={template.approach} size="small" color="primary" />
                    <Chip label={template.promptType} size="small" variant="outlined" />
                  </Stack>
                }
              />
              <CardContent>
                <Stack spacing={2}>
                  <Typography variant="body2" color="text.secondary">
                    {template.description}
                  </Typography>

                  <Divider />

                  <Box>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      display="block"
                      gutterBottom
                    >
                      Key Highlights:
                    </Typography>
                    <Stack spacing={0.5}>
                      {template.highlights.slice(0, 3).map((highlight, index) => (
                        <Typography key={index} variant="body2" sx={{ fontSize: '0.85rem' }}>
                          • {highlight}
                        </Typography>
                      ))}
                    </Stack>
                  </Box>

                  <Box
                    sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Rating value={template.rating} size="small" readOnly precision={0.1} />
                      <Typography variant="caption" color="text.secondary">
                        ({template.rating.toFixed(1)})
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {template.views} views
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {template.tags.slice(0, 4).map((tag, index) => (
                      <Chip key={index} label={tag} size="small" variant="outlined" />
                    ))}
                  </Box>

                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<ViewIcon />}
                    onClick={() => handleViewTemplate(template)}
                  >
                    View Template
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog
        open={showViewDialog}
        onClose={() => setShowViewDialog(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedTemplate && (
          <>
            <DialogTitle>
              <Box>
                <Typography variant="h5" fontWeight={700} gutterBottom>
                  {selectedTemplate.title}
                </Typography>
                <Stack direction="row" spacing={1}>
                  <Chip label={selectedTemplate.approach} size="small" color="primary" />
                  <Chip label={selectedTemplate.promptType} size="small" variant="outlined" />
                </Stack>
              </Box>
            </DialogTitle>
            <DialogContent>
              <Stack spacing={3}>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Description
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedTemplate.description}
                  </Typography>
                </Box>

                <Divider />

                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Author Background
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedTemplate.authorBackground}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Key Highlights
                  </Typography>
                  <Stack spacing={1}>
                    {selectedTemplate.highlights.map((highlight, index) => (
                      <Paper
                        key={index}
                        elevation={0}
                        sx={{
                          p: 1.5,
                          bgcolor: alpha(theme.palette.success.main, 0.05),
                          border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                        }}
                      >
                        <Typography variant="body2">{highlight}</Typography>
                      </Paper>
                    ))}
                  </Stack>
                </Box>

                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Essay Content
                  </Typography>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 3,
                      bgcolor: 'background.default',
                      maxHeight: '400px',
                      overflowY: 'auto',
                      fontFamily: 'Georgia, serif',
                      fontSize: '16px',
                      lineHeight: 1.8,
                    }}
                  >
                    <Typography variant="body1" component="div" sx={{ whiteSpace: 'pre-wrap' }}>
                      {selectedTemplate.content}
                    </Typography>
                  </Paper>
                </Box>

                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Outcome
                  </Typography>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      bgcolor: alpha(theme.palette.primary.main, 0.05),
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                    }}
                  >
                    <Typography variant="body2">{selectedTemplate.outcome}</Typography>
                  </Paper>
                </Box>
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setShowViewDialog(false)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}

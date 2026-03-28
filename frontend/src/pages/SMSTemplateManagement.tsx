import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  TextField,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Chip,
  FormControlLabel,
  Switch,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Send as SendIcon,
} from '@mui/icons-material';
import schoolAdminApi, { SMSTemplate, SMSTemplateCreate } from '../api/schoolAdmin';

export const SMSTemplateManagement: React.FC = () => {
  const [templates, setTemplates] = useState<SMSTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<SMSTemplate | null>(null);
  const [_loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<SMSTemplate | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  const [formData, setFormData] = useState<SMSTemplateCreate>({
    name: '',
    template_type: '',
    message_template: '',
    variables: [],
    is_active: true,
  });

  useEffect(() => {
    loadTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const data = await schoolAdminApi.smsTemplates.list();
      setTemplates(data);
    } catch (error) {
      showSnackbar('Failed to load templates', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error' = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCreate = () => {
    setEditingTemplate(null);
    setFormData({
      name: '',
      template_type: '',
      message_template: '',
      variables: [],
      is_active: true,
    });
    setDialogOpen(true);
  };

  const handleEdit = (template: SMSTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      template_type: template.template_type,
      message_template: template.message_template,
      variables: template.variables || [],
      is_active: template.is_active,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editingTemplate) {
        await schoolAdminApi.smsTemplates.update(editingTemplate.id, formData);
        showSnackbar('Template updated successfully', 'success');
      } else {
        await schoolAdminApi.smsTemplates.create(formData);
        showSnackbar('Template created successfully', 'success');
      }
      setDialogOpen(false);
      loadTemplates();
    } catch (error) {
      showSnackbar('Failed to save template', 'error');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      await schoolAdminApi.smsTemplates.delete(id);
      showSnackbar('Template deleted successfully', 'success');
      loadTemplates();
    } catch (error) {
      showSnackbar('Failed to delete template', 'error');
    }
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          SMS Template Management
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Create and manage SMS templates for bulk messaging
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">Templates</Typography>
              <Button
                variant="contained"
                size="small"
                startIcon={<AddIcon />}
                onClick={handleCreate}
              >
                New
              </Button>
            </Box>
            <List>
              {templates.map((template) => (
                <ListItem
                  key={template.id}
                  button
                  selected={selectedTemplate?.id === template.id}
                  onClick={() => setSelectedTemplate(template)}
                  secondaryAction={
                    <Box>
                      <IconButton edge="end" size="small" onClick={() => handleEdit(template)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton edge="end" size="small" onClick={() => handleDelete(template.id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  }
                >
                  <ListItemText primary={template.name} secondary={template.template_type} />
                  {template.is_active && (
                    <Chip label="Active" color="success" size="small" sx={{ mr: 1 }} />
                  )}
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        <Grid item xs={12} md={8}>
          {selectedTemplate ? (
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h5">{selectedTemplate.name}</Typography>
                <Box>
                  <Button
                    variant="outlined"
                    startIcon={<EditIcon />}
                    onClick={() => handleEdit(selectedTemplate)}
                    sx={{ mr: 1 }}
                  >
                    Edit
                  </Button>
                  <Button variant="contained" startIcon={<SendIcon />}>
                    Send SMS
                  </Button>
                </Box>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Template Type
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {selectedTemplate.template_type}
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Message Template
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50', mt: 1 }}>
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                      {selectedTemplate.message_template}
                    </Typography>
                  </Paper>
                </Grid>

                {selectedTemplate.variables && selectedTemplate.variables.length > 0 && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Variables
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {selectedTemplate.variables.map((variable, index) => (
                        <Chip key={index} label={`{${variable}}`} size="small" />
                      ))}
                    </Box>
                  </Grid>
                )}

                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Status
                  </Typography>
                  <Chip
                    label={selectedTemplate.is_active ? 'Active' : 'Inactive'}
                    color={selectedTemplate.is_active ? 'success' : 'default'}
                  />
                </Grid>
              </Grid>
            </Paper>
          ) : (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary">
                Select a template to view details or create a new one
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleCreate}
                sx={{ mt: 2 }}
              >
                Create Template
              </Button>
            </Paper>
          )}
        </Grid>
      </Grid>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editingTemplate ? 'Edit Template' : 'Create Template'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Template Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Template Type"
                value={formData.template_type}
                onChange={(e) => setFormData({ ...formData, template_type: e.target.value })}
                placeholder="e.g., attendance_reminder, fee_reminder, announcement"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={6}
                label="Message Template"
                value={formData.message_template}
                onChange={(e) => setFormData({ ...formData, message_template: e.target.value })}
                placeholder="Dear {parent_name}, your child {student_name} was absent on {date}."
                helperText="Use variables in curly braces: {variable_name}"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Variables (comma-separated)"
                value={formData.variables?.join(', ') || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    variables: e.target.value
                      .split(',')
                      .map((v) => v.trim())
                      .filter(Boolean),
                  })
                }
                placeholder="student_name, parent_name, date"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  />
                }
                label="Active"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default SMSTemplateManagement;

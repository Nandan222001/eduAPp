import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Box,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Typography,
  Stack,
} from '@mui/material';
import {
  Close as CloseIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';
import { OrganizationContact, ServiceCategory } from '@/types/communityService';
import communityServiceApi from '@/api/communityService';

interface OrganizationManagerDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  organizations: OrganizationContact[];
}

export default function OrganizationManagerDialog({
  open,
  onClose,
  onSuccess,
  organizations,
}: OrganizationManagerDialogProps) {
  const [mode, setMode] = useState<'list' | 'add' | 'edit'>('list');
  const [selectedOrg, setSelectedOrg] = useState<OrganizationContact | null>(null);
  const [formData, setFormData] = useState({
    organization_name: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    address: '',
    website: '',
    category: ServiceCategory.OTHER,
    notes: '',
    is_verified: false,
  });
  const [loading, setLoading] = useState(false);

  const handleAdd = () => {
    setMode('add');
    setFormData({
      organization_name: '',
      contact_name: '',
      contact_email: '',
      contact_phone: '',
      address: '',
      website: '',
      category: ServiceCategory.OTHER,
      notes: '',
      is_verified: false,
    });
  };

  const handleEdit = (org: OrganizationContact) => {
    setMode('edit');
    setSelectedOrg(org);
    setFormData({
      organization_name: org.organization_name,
      contact_name: org.contact_name,
      contact_email: org.contact_email,
      contact_phone: org.contact_phone || '',
      address: org.address || '',
      website: org.website || '',
      category: org.category,
      notes: org.notes || '',
      is_verified: org.is_verified,
    });
  };

  const handleDelete = async (orgId: number) => {
    if (window.confirm('Are you sure you want to delete this organization?')) {
      try {
        await communityServiceApi.deleteOrganization(orgId);
        onSuccess();
      } catch (err) {
        console.error('Failed to delete organization:', err);
        alert('Failed to delete organization');
      }
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      if (mode === 'edit' && selectedOrg) {
        await communityServiceApi.updateOrganization(selectedOrg.id, formData);
      } else {
        await communityServiceApi.createOrganization(formData);
      }
      onSuccess();
      setMode('list');
    } catch (err) {
      console.error('Failed to save organization:', err);
      alert('Failed to save organization');
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
          {mode === 'list'
            ? 'Manage Organizations'
            : mode === 'add'
              ? 'Add Organization'
              : 'Edit Organization'}
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        {mode === 'list' ? (
          <>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAdd}
              sx={{ mb: 2 }}
              fullWidth
            >
              Add New Organization
            </Button>
            <List>
              {organizations.map((org, index) => (
                <Box key={org.id}>
                  <ListItem
                    secondaryAction={
                      <Stack direction="row" spacing={1}>
                        <IconButton edge="end" onClick={() => handleEdit(org)}>
                          <EditIcon />
                        </IconButton>
                        <IconButton edge="end" onClick={() => handleDelete(org.id)}>
                          <DeleteIcon />
                        </IconButton>
                      </Stack>
                    }
                  >
                    <ListItemAvatar>
                      <Avatar>
                        <BusinessIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={org.organization_name}
                      secondary={
                        <>
                          {org.contact_name} • {org.contact_email}
                          <br />
                          {org.activities_count} activities • {org.total_hours} hours
                        </>
                      }
                    />
                  </ListItem>
                  {index < organizations.length - 1 && <Divider />}
                </Box>
              ))}
              {organizations.length === 0 && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ textAlign: 'center', py: 4 }}
                >
                  No organizations added yet
                </Typography>
              )}
            </List>
          </>
        ) : (
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Organization Name"
                required
                value={formData.organization_name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, organization_name: e.target.value }))
                }
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Contact Name"
                required
                value={formData.contact_name}
                onChange={(e) => setFormData((prev) => ({ ...prev, contact_name: e.target.value }))}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Contact Email"
                type="email"
                required
                value={formData.contact_email}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, contact_email: e.target.value }))
                }
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Contact Phone"
                value={formData.contact_phone}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, contact_phone: e.target.value }))
                }
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={formData.category}
                  label="Category"
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      category: e.target.value as ServiceCategory,
                    }))
                  }
                >
                  {Object.values(ServiceCategory).map((category) => (
                    <MenuItem key={category} value={category}>
                      {getCategoryLabel(category)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address"
                value={formData.address}
                onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Website"
                value={formData.website}
                onChange={(e) => setFormData((prev) => ({ ...prev, website: e.target.value }))}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Notes"
                value={formData.notes}
                onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              />
            </Grid>
          </Grid>
        )}
      </DialogContent>
      <DialogActions>
        {mode === 'list' ? (
          <Button onClick={onClose}>Close</Button>
        ) : (
          <>
            <Button onClick={() => setMode('list')}>Back</Button>
            <Button variant="contained" onClick={handleSubmit} disabled={loading}>
              {loading ? 'Saving...' : 'Save'}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}

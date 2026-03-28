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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { DataGrid, GridColDef, GridActionsCellItem } from '@mui/x-data-grid';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import schoolAdminApi, { Enquiry, EnquiryCreate } from '../api/schoolAdmin';

export const EnquiryManagement: React.FC = () => {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEnquiry, setEditingEnquiry] = useState<Enquiry | null>(null);
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
  const [totalRows, setTotalRows] = useState(0);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  const [formData, setFormData] = useState<EnquiryCreate>({
    student_name: '',
    parent_name: '',
    parent_phone: '',
    parent_email: '',
    grade_interested: '',
    notes: '',
  });

  useEffect(() => {
    loadEnquiries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paginationModel, filterStatus]);

  const loadEnquiries = async () => {
    setLoading(true);
    try {
      const response = await schoolAdminApi.enquiries.list({
        skip: paginationModel.page * paginationModel.pageSize,
        limit: paginationModel.pageSize,
        status: filterStatus || undefined,
      });
      setEnquiries(response.items);
      setTotalRows(response.total);
    } catch (error) {
      showSnackbar('Failed to load enquiries', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error' = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCreate = () => {
    setEditingEnquiry(null);
    setFormData({
      student_name: '',
      parent_name: '',
      parent_phone: '',
      parent_email: '',
      grade_interested: '',
      notes: '',
    });
    setDialogOpen(true);
  };

  const handleEdit = (enquiry: Enquiry) => {
    setEditingEnquiry(enquiry);
    setFormData({
      student_name: enquiry.student_name,
      parent_name: enquiry.parent_name,
      parent_phone: enquiry.parent_phone,
      parent_email: enquiry.parent_email || '',
      grade_interested: enquiry.grade_interested || '',
      notes: enquiry.notes || '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editingEnquiry) {
        await schoolAdminApi.enquiries.update(editingEnquiry.id, formData);
        showSnackbar('Enquiry updated successfully', 'success');
      } else {
        await schoolAdminApi.enquiries.create(formData);
        showSnackbar('Enquiry created successfully', 'success');
      }
      setDialogOpen(false);
      loadEnquiries();
    } catch (error) {
      showSnackbar('Failed to save enquiry', 'error');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this enquiry?')) return;

    try {
      await schoolAdminApi.enquiries.delete(id);
      showSnackbar('Enquiry deleted successfully', 'success');
      loadEnquiries();
    } catch (error) {
      showSnackbar('Failed to delete enquiry', 'error');
    }
  };

  const handleStatusChange = async (id: number, status: string) => {
    try {
      await schoolAdminApi.enquiries.update(id, { status });
      showSnackbar('Status updated successfully', 'success');
      loadEnquiries();
    } catch (error) {
      showSnackbar('Failed to update status', 'error');
    }
  };

  const columns: GridColDef[] = [
    { field: 'student_name', headerName: 'Student Name', width: 150 },
    { field: 'parent_name', headerName: 'Parent Name', width: 150 },
    { field: 'parent_phone', headerName: 'Phone', width: 130 },
    { field: 'parent_email', headerName: 'Email', width: 180 },
    { field: 'grade_interested', headerName: 'Grade', width: 100 },
    { field: 'enquiry_date', headerName: 'Date', width: 120 },
    {
      field: 'status',
      headerName: 'Status',
      width: 130,
      renderCell: (params) => (
        <FormControl size="small" fullWidth>
          <Select
            value={params.value}
            onChange={(e) => handleStatusChange(params.row.id, e.target.value)}
            size="small"
          >
            <MenuItem value="new">New</MenuItem>
            <MenuItem value="contacted">Contacted</MenuItem>
            <MenuItem value="visited">Visited</MenuItem>
            <MenuItem value="converted">Converted</MenuItem>
            <MenuItem value="closed">Closed</MenuItem>
          </Select>
        </FormControl>
      ),
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 120,
      getActions: (params) => [
        <GridActionsCellItem
          key="edit"
          icon={<EditIcon />}
          label="Edit"
          onClick={() => handleEdit(params.row)}
        />,
        <GridActionsCellItem
          key="delete"
          icon={<DeleteIcon />}
          label="Delete"
          onClick={() => handleDelete(params.row.id)}
        />,
      ],
    },
  ];

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Enquiry Management
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Track and manage admission enquiries
        </Typography>
      </Box>

      <Paper sx={{ p: 3 }}>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Filter by Status</InputLabel>
              <Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                label="Filter by Status"
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="new">New</MenuItem>
                <MenuItem value="contacted">Contacted</MenuItem>
                <MenuItem value="visited">Visited</MenuItem>
                <MenuItem value="converted">Converted</MenuItem>
                <MenuItem value="closed">Closed</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={8}>
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreate}>
              Add Enquiry
            </Button>
          </Grid>
        </Grid>

        <DataGrid
          rows={enquiries}
          columns={columns}
          loading={loading}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          rowCount={totalRows}
          paginationMode="server"
          pageSizeOptions={[10, 25, 50]}
          autoHeight
          disableRowSelectionOnClick
        />
      </Paper>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editingEnquiry ? 'Edit Enquiry' : 'Add Enquiry'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Student Name"
                value={formData.student_name}
                onChange={(e) => setFormData({ ...formData, student_name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Parent Name"
                value={formData.parent_name}
                onChange={(e) => setFormData({ ...formData, parent_name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Parent Phone"
                value={formData.parent_phone}
                onChange={(e) => setFormData({ ...formData, parent_phone: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Parent Email"
                type="email"
                value={formData.parent_email}
                onChange={(e) => setFormData({ ...formData, parent_email: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Grade Interested"
                value={formData.grade_interested}
                onChange={(e) => setFormData({ ...formData, grade_interested: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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

export default EnquiryManagement;

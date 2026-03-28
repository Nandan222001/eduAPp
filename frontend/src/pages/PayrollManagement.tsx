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
  Chip,
} from '@mui/material';
import { DataGrid, GridColDef, GridActionsCellItem } from '@mui/x-data-grid';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import schoolAdminApi, { PayrollRecord, PayrollRecordCreate } from '../api/schoolAdmin';

export const PayrollManagement: React.FC = () => {
  const [payrolls, setPayrolls] = useState<PayrollRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPayroll, setEditingPayroll] = useState<PayrollRecord | null>(null);
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
  const [totalRows, setTotalRows] = useState(0);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  const [formData, setFormData] = useState<PayrollRecordCreate>({
    staff_id: 0,
    month: '',
    year: new Date().getFullYear(),
    basic_salary: 0,
    allowances: 0,
    deductions: 0,
  });

  useEffect(() => {
    loadPayrolls();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paginationModel]);

  const loadPayrolls = async () => {
    setLoading(true);
    try {
      const response = await schoolAdminApi.payroll.list({
        skip: paginationModel.page * paginationModel.pageSize,
        limit: paginationModel.pageSize,
      });
      setPayrolls(response.items);
      setTotalRows(response.total);
    } catch (error) {
      showSnackbar('Failed to load payroll records', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error' = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCreate = () => {
    setEditingPayroll(null);
    setFormData({
      staff_id: 0,
      month: new Date().toISOString().slice(0, 7),
      year: new Date().getFullYear(),
      basic_salary: 0,
      allowances: 0,
      deductions: 0,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editingPayroll) {
        await schoolAdminApi.payroll.update(editingPayroll.id, {
          basic_salary: formData.basic_salary,
          allowances: formData.allowances,
          deductions: formData.deductions,
        });
        showSnackbar('Payroll updated successfully', 'success');
      } else {
        await schoolAdminApi.payroll.create(formData);
        showSnackbar('Payroll created successfully', 'success');
      }
      setDialogOpen(false);
      loadPayrolls();
    } catch (error) {
      showSnackbar('Failed to save payroll', 'error');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this payroll record?')) return;

    try {
      await schoolAdminApi.payroll.delete(id);
      showSnackbar('Payroll deleted successfully', 'success');
      loadPayrolls();
    } catch (error) {
      showSnackbar('Failed to delete payroll', 'error');
    }
  };

  const handleDownloadPayslip = async (id: number) => {
    try {
      const blob = await schoolAdminApi.payroll.generatePayslip(id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payslip_${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showSnackbar('Payslip downloaded', 'success');
    } catch (error) {
      showSnackbar('Failed to download payslip', 'error');
    }
  };

  const columns: GridColDef[] = [
    { field: 'staff_name', headerName: 'Staff Name', width: 200 },
    { field: 'month', headerName: 'Month', width: 120 },
    { field: 'year', headerName: 'Year', width: 100 },
    { field: 'basic_salary', headerName: 'Basic Salary', width: 130 },
    { field: 'allowances', headerName: 'Allowances', width: 130 },
    { field: 'deductions', headerName: 'Deductions', width: 130 },
    { field: 'net_salary', headerName: 'Net Salary', width: 130 },
    {
      field: 'payment_status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={
            params.value === 'paid' ? 'success' : params.value === 'pending' ? 'warning' : 'default'
          }
          size="small"
        />
      ),
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 150,
      getActions: (params) => [
        <GridActionsCellItem
          key="download"
          icon={<DownloadIcon />}
          label="Download Payslip"
          onClick={() => handleDownloadPayslip(params.row.id)}
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
          Payroll Management
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Manage staff payroll and generate payslips
        </Typography>
      </Box>

      <Paper sx={{ p: 3 }}>
        <Box sx={{ mb: 3 }}>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreate}>
            Create Payroll Record
          </Button>
        </Box>

        <DataGrid
          rows={payrolls}
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

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingPayroll ? 'Edit Payroll' : 'Create Payroll Record'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Staff ID"
                type="number"
                value={formData.staff_id}
                onChange={(e) => setFormData({ ...formData, staff_id: Number(e.target.value) })}
                disabled={!!editingPayroll}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Month"
                type="month"
                value={formData.month}
                onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                InputLabelProps={{ shrink: true }}
                disabled={!!editingPayroll}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Year"
                type="number"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
                disabled={!!editingPayroll}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Basic Salary"
                type="number"
                value={formData.basic_salary}
                onChange={(e) => setFormData({ ...formData, basic_salary: Number(e.target.value) })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Allowances"
                type="number"
                value={formData.allowances}
                onChange={(e) => setFormData({ ...formData, allowances: Number(e.target.value) })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Deductions"
                type="number"
                value={formData.deductions}
                onChange={(e) => setFormData({ ...formData, deductions: Number(e.target.value) })}
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

export default PayrollManagement;

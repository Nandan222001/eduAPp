import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Tabs,
  Tab,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  Autocomplete,
  CircularProgress,
  IconButton,
  Chip,
  Card,
  CardContent,
  CardMedia,
  CardActions,
} from '@mui/material';
import { DataGrid, GridColDef, GridActionsCellItem } from '@mui/x-data-grid';
import {
  Download as DownloadIcon,
  Print as PrintIcon,
  Cancel as CancelIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Visibility as VisibilityIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import schoolAdminApi, {
  CertificateType,
  Certificate,
  IssueCertificateRequest,
  CertificateTemplate,
  CertificateTemplateConfig,
} from '@/api/schoolAdmin';
import studentsApi, { Student } from '@/api/students';
import { isDemoUser, demoCertificatesApi } from '@/api/demoDataApi';

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

const certificateTypes: CertificateType[] = [
  'TC',
  'LC',
  'Bonafide',
  'Character',
  'Study',
  'Conduct',
  'Migration',
  'Fee',
  'No Dues',
  'Sports',
  'Merit',
  'Participation',
];

export const CertificateManagement: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({ open: false, message: '', severity: 'success' });

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Certificate Management
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Issue and manage student certificates with customizable templates
        </Typography>
      </Box>

      <Paper sx={{ width: '100%' }}>
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
          <Tab label="Issue Certificate" />
          <Tab label="Issued Certificates" />
          <Tab label="Certificate Templates" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <IssueCertificateTab showSnackbar={showSnackbar} />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <IssuedCertificatesTab showSnackbar={showSnackbar} />
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <CertificateTemplatesTab showSnackbar={showSnackbar} />
        </TabPanel>
      </Paper>

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

interface TabProps {
  showSnackbar: (message: string, severity?: 'success' | 'error' | 'info') => void;
}

const IssueCertificateTab: React.FC<TabProps> = ({ showSnackbar }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [certificateType, setCertificateType] = useState<string>('Bonafide');
  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<number | undefined>(undefined);
  const [remarks, setRemarks] = useState('');
  const [reasonForLeaving, setReasonForLeaving] = useState('');
  const [additionalData, setAdditionalData] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [studentSearchLoading, setStudentSearchLoading] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
  const [issuedCertificate, setIssuedCertificate] = useState<Certificate | null>(null);

  const isDemo = isDemoUser();

  useEffect(() => {
    loadTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [certificateType]);

  const loadTemplates = async () => {
    try {
      let data: CertificateTemplate[];
      if (isDemo) {
        data = await demoCertificatesApi.getCertificateTemplates(
          certificateType as CertificateType
        );
      } else {
        data = await schoolAdminApi.certificateTemplates.list(certificateType as CertificateType);
      }
      setTemplates(data);
      if (data.length > 0) {
        const defaultTemplate = data.find((t) => t.is_default);
        setSelectedTemplate(defaultTemplate?.id || data[0]?.id);
      }
    } catch (error) {
      showSnackbar('Failed to load templates', 'error');
    }
  };

  const handleStudentSearch = async (searchTerm: string) => {
    if (searchTerm.length < 2) return;
    setStudentSearchLoading(true);
    try {
      const response = await studentsApi.listStudents({ search: searchTerm, limit: 20 });
      setStudents(response.items);
    } catch (error) {
      showSnackbar('Failed to search students', 'error');
    } finally {
      setStudentSearchLoading(false);
    }
  };

  const handlePreview = async () => {
    if (!selectedStudent || !selectedTemplate) {
      showSnackbar('Please select a student and template', 'error');
      return;
    }

    setLoading(true);
    try {
      const studentData = {
        student_name: `${selectedStudent.first_name} ${selectedStudent.last_name}`,
        admission_number: selectedStudent.admission_number,
        class: selectedStudent.section?.grade?.name || '',
        section: selectedStudent.section?.name || '',
        date_of_birth: selectedStudent.date_of_birth,
        reason_for_leaving: reasonForLeaving,
        remarks,
        ...additionalData,
      };

      if (isDemo) {
        const preview = await demoCertificatesApi.previewCertificateTemplate(
          selectedTemplate,
          studentData
        );
        const htmlBlob = new Blob([preview.preview_html], { type: 'text/html' });
        setPreviewBlob(htmlBlob);
      } else {
        // For production, generate a simple HTML preview from template
        const template = templates.find((t) => t.id === selectedTemplate);
        if (template) {
          const previewHtml = `
            <html>
              <head><style>body { padding: 40px; font-family: Arial; }</style></head>
              <body>
                <h1 style="text-align: center;">${template.template_config.header}</h1>
                <p style="white-space: pre-wrap; margin: 40px 0;">${template.template_config.body_text}</p>
                <footer style="text-align: center; margin-top: 60px;">${template.template_config.footer_text}</footer>
              </body>
            </html>
          `;
          const htmlBlob = new Blob([previewHtml], { type: 'text/html' });
          setPreviewBlob(htmlBlob);
        }
      }

      setPreviewDialogOpen(true);
    } catch (error) {
      showSnackbar('Failed to generate preview', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleIssueCertificate = async () => {
    if (!selectedStudent) {
      showSnackbar('Please select a student', 'error');
      return;
    }

    setLoading(true);
    try {
      const data: IssueCertificateRequest = {
        student_id: selectedStudent.id,
        certificate_type: certificateType as CertificateType,
        template_id: selectedTemplate,
        remarks: remarks || undefined,
      };

      let certificate: Certificate;
      if (isDemo) {
        certificate = await demoCertificatesApi.issue({
          ...data,
          data: {
            student_name: `${selectedStudent.first_name} ${selectedStudent.last_name}`,
            reason_for_leaving: reasonForLeaving,
            additional_data: additionalData,
          },
        });
      } else {
        certificate = await schoolAdminApi.certificates.issue(data);
      }

      setIssuedCertificate(certificate);

      const blob = isDemo
        ? await demoCertificatesApi.downloadCertificatePDF(certificate.id)
        : await schoolAdminApi.certificates.download(certificate.id);

      setPreviewBlob(blob);
      setPreviewDialogOpen(true);

      showSnackbar('Certificate issued successfully', 'success');
      setSelectedStudent(null);
      setRemarks('');
      setReasonForLeaving('');
      setAdditionalData({});
    } catch (error) {
      showSnackbar('Failed to issue certificate', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (previewBlob && issuedCertificate) {
      const url = URL.createObjectURL(previewBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${certificateType}_${issuedCertificate.serial_number}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handlePrint = () => {
    if (previewBlob) {
      const url = URL.createObjectURL(previewBlob);
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = url;
      document.body.appendChild(iframe);
      iframe.onload = () => {
        iframe.contentWindow?.print();
      };
    }
  };

  const showAdditionalFields = ['TC', 'LC', 'Migration'].includes(certificateType);

  return (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Autocomplete
            options={students}
            getOptionLabel={(option) =>
              `${option.first_name} ${option.last_name} - ${option.admission_number || 'N/A'}`
            }
            value={selectedStudent}
            onChange={(_, newValue) => setSelectedStudent(newValue)}
            onInputChange={(_, newInputValue) => handleStudentSearch(newInputValue)}
            loading={studentSearchLoading}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Search Student"
                placeholder="Type student name or admission number"
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {studentSearchLoading ? <CircularProgress size={20} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Certificate Type</InputLabel>
            <Select
              value={certificateType}
              onChange={(e) => setCertificateType(e.target.value)}
              label="Certificate Type"
            >
              {certificateTypes.map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Template</InputLabel>
            <Select
              value={selectedTemplate || ''}
              onChange={(e) => setSelectedTemplate(Number(e.target.value))}
              label="Template"
              disabled={templates.length === 0}
            >
              {templates.map((template) => (
                <MenuItem key={template.id} value={template.id}>
                  {template.name} {template.is_default && '(Default)'}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {showAdditionalFields && (
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Reason for Leaving"
              value={reasonForLeaving}
              onChange={(e) => setReasonForLeaving(e.target.value)}
              placeholder="Enter reason for leaving"
            />
          </Grid>
        )}

        <Grid item xs={12}>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Additional Remarks"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Enter any additional remarks or notes"
          />
        </Grid>

        <Grid item xs={12}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              size="large"
              onClick={handlePreview}
              disabled={loading || !selectedStudent || !selectedTemplate}
              startIcon={<VisibilityIcon />}
            >
              Preview
            </Button>
            <Button
              variant="contained"
              size="large"
              onClick={handleIssueCertificate}
              disabled={loading || !selectedStudent}
              startIcon={loading ? <CircularProgress size={20} /> : <CheckCircleIcon />}
            >
              Issue Certificate
            </Button>
          </Box>
        </Grid>
      </Grid>

      <Dialog
        open={previewDialogOpen}
        onClose={() => setPreviewDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Certificate Preview</DialogTitle>
        <DialogContent>
          {previewBlob && (
            <Box sx={{ width: '100%', height: '500px' }}>
              <iframe
                src={URL.createObjectURL(previewBlob)}
                width="100%"
                height="100%"
                style={{ border: 'none' }}
                title="Certificate Preview"
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewDialogOpen(false)}>Close</Button>
          <Button startIcon={<DownloadIcon />} onClick={handleDownload} variant="outlined">
            Download
          </Button>
          <Button startIcon={<PrintIcon />} onClick={handlePrint} variant="contained">
            Print
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

const IssuedCertificatesTab: React.FC<TabProps> = ({ showSnackbar }) => {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(false);
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
  const [totalRows, setTotalRows] = useState(0);
  const [filterType, setFilterType] = useState<CertificateType | ''>('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'revoked'>('all');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  const isDemo = isDemoUser();

  useEffect(() => {
    loadCertificates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paginationModel, filterType, filterStatus, filterDateFrom, filterDateTo]);

  const loadCertificates = async () => {
    setLoading(true);
    try {
      if (isDemo) {
        const allCerts = await demoCertificatesApi.list({
          certificate_type: filterType || undefined,
        });
        let filteredCerts = allCerts;

        if (filterStatus === 'active') {
          filteredCerts = filteredCerts.filter((c) => !c.is_revoked);
        } else if (filterStatus === 'revoked') {
          filteredCerts = filteredCerts.filter((c) => c.is_revoked);
        }

        setCertificates(filteredCerts);
        setTotalRows(filteredCerts.length);
      } else {
        const response = await schoolAdminApi.certificates.list({
          skip: paginationModel.page * paginationModel.pageSize,
          limit: paginationModel.pageSize,
          certificate_type: filterType || undefined,
          from_date: filterDateFrom || undefined,
          to_date: filterDateTo || undefined,
          is_revoked: filterStatus === 'all' ? undefined : filterStatus === 'revoked',
        });
        setCertificates(response.items);
        setTotalRows(response.total);
      }
    } catch (error) {
      showSnackbar('Failed to load certificates', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (id: number, serialNumber: string, type: string) => {
    try {
      const blob = isDemo
        ? await demoCertificatesApi.downloadCertificatePDF(id)
        : await schoolAdminApi.certificates.download(id);

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}_${serialNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showSnackbar('Certificate downloaded', 'success');
    } catch (error) {
      showSnackbar('Failed to download certificate', 'error');
    }
  };

  const handleRevoke = async (id: number) => {
    if (!confirm('Are you sure you want to revoke this certificate?')) return;

    const reason = prompt('Please enter the reason for revocation:');
    if (!reason) return;

    try {
      if (isDemo) {
        showSnackbar('Certificate revocation is not available in demo mode', 'info');
      } else {
        await schoolAdminApi.certificates.revoke(id, { reason });
        showSnackbar('Certificate revoked successfully', 'success');
        loadCertificates();
      }
    } catch (error) {
      showSnackbar('Failed to revoke certificate', 'error');
    }
  };

  const columns: GridColDef[] = [
    { field: 'serial_number', headerName: 'Serial Number', width: 150 },
    { field: 'certificate_type', headerName: 'Type', width: 120 },
    { field: 'student_name', headerName: 'Student', width: 200 },
    {
      field: 'issue_date',
      headerName: 'Issue Date',
      width: 120,
      valueFormatter: (params) => {
        return new Date(params).toLocaleDateString();
      },
    },
    { field: 'issued_by_name', headerName: 'Issued By', width: 150 },
    {
      field: 'is_revoked',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value ? 'Revoked' : 'Active'}
          color={params.value ? 'error' : 'success'}
          size="small"
        />
      ),
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 120,
      getActions: (params) => [
        <GridActionsCellItem
          key="download"
          icon={<DownloadIcon />}
          label="Download"
          onClick={() =>
            handleDownload(params.row.id, params.row.serial_number, params.row.certificate_type)
          }
        />,
        <GridActionsCellItem
          key="revoke"
          icon={<CancelIcon />}
          label="Revoke"
          onClick={() => handleRevoke(params.row.id)}
          disabled={params.row.is_revoked}
        />,
      ],
    },
  ];

  return (
    <Box>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <FormControl fullWidth size="small">
            <InputLabel>Filter by Type</InputLabel>
            <Select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as CertificateType | '')}
              label="Filter by Type"
            >
              <MenuItem value="">All Types</MenuItem>
              {certificateTypes.map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={3}>
          <FormControl fullWidth size="small">
            <InputLabel>Filter by Status</InputLabel>
            <Select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'revoked')}
              label="Filter by Status"
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="revoked">Revoked</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={3}>
          <TextField
            fullWidth
            size="small"
            type="date"
            label="From Date"
            InputLabelProps={{ shrink: true }}
            value={filterDateFrom}
            onChange={(e) => setFilterDateFrom(e.target.value)}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <TextField
            fullWidth
            size="small"
            type="date"
            label="To Date"
            InputLabelProps={{ shrink: true }}
            value={filterDateTo}
            onChange={(e) => setFilterDateTo(e.target.value)}
          />
        </Grid>
      </Grid>

      <DataGrid
        rows={certificates}
        columns={columns}
        loading={loading}
        paginationModel={paginationModel}
        onPaginationModelChange={setPaginationModel}
        rowCount={totalRows}
        paginationMode={isDemo ? 'client' : 'server'}
        pageSizeOptions={[10, 25, 50]}
        autoHeight
        disableRowSelectionOnClick
      />
    </Box>
  );
};

const CertificateTemplatesTab: React.FC<TabProps> = ({ showSnackbar }) => {
  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<CertificateTemplate | null>(null);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<CertificateTemplate | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    certificate_type: CertificateType;
    template_config: CertificateTemplateConfig;
    is_default: boolean;
  }>({
    name: '',
    certificate_type: 'Bonafide',
    template_config: {
      header: 'Certificate Header',
      body_text: 'This is to certify that...',
      footer_text: 'Institution Name and Seal',
      custom_fields: [],
    },
    is_default: false,
  });

  const isDemo = isDemoUser();

  useEffect(() => {
    loadTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadTemplates = async () => {
    try {
      let data: CertificateTemplate[];
      if (isDemo) {
        data = await demoCertificatesApi.getCertificateTemplates();
      } else {
        data = await schoolAdminApi.certificateTemplates.list();
      }
      setTemplates(data);
    } catch (error) {
      showSnackbar('Failed to load templates', 'error');
    }
  };

  const handleCreate = () => {
    setEditingTemplate(null);
    setFormData({
      name: '',
      certificate_type: 'Bonafide',
      template_config: {
        header: 'Certificate Header',
        body_text: 'This is to certify that...',
        footer_text: 'Institution Name and Seal',
        custom_fields: [],
      },
      is_default: false,
    });
    setDialogOpen(true);
  };

  const handleEdit = (template: CertificateTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      certificate_type: template.certificate_type,
      template_config: template.template_config,
      is_default: template.is_default,
    });
    setDialogOpen(true);
  };

  const handlePreview = (template: CertificateTemplate) => {
    setPreviewTemplate(template);
    setPreviewDialogOpen(true);
  };

  const handleSave = async () => {
    if (isDemo) {
      showSnackbar('Template creation/editing is not available in demo mode', 'info');
      setDialogOpen(false);
      return;
    }

    try {
      if (editingTemplate) {
        await schoolAdminApi.certificateTemplates.update(editingTemplate.id, formData);
        showSnackbar('Template updated successfully', 'success');
      } else {
        await schoolAdminApi.certificateTemplates.create(formData);
        showSnackbar('Template created successfully', 'success');
      }
      setDialogOpen(false);
      loadTemplates();
    } catch (error) {
      showSnackbar('Failed to save template', 'error');
    }
  };

  const handleDelete = async (id: number) => {
    if (isDemo) {
      showSnackbar('Template deletion is not available in demo mode', 'info');
      return;
    }

    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      await schoolAdminApi.certificateTemplates.delete(id);
      showSnackbar('Template deleted successfully', 'success');
      loadTemplates();
    } catch (error) {
      showSnackbar('Failed to delete template', 'error');
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreate}>
          Create Template
        </Button>
      </Box>

      <Grid container spacing={3}>
        {templates.map((template) => (
          <Grid item xs={12} md={6} lg={4} key={template.id}>
            <Card>
              <CardMedia
                sx={{
                  height: 140,
                  bgcolor: 'primary.light',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                }}
              >
                <Box sx={{ textAlign: 'center', p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    {template.certificate_type}
                  </Typography>
                  <Typography variant="caption">Template Preview</Typography>
                </Box>
              </CardMedia>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      {template.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Type: {template.certificate_type}
                    </Typography>
                    {template.is_default && (
                      <Chip label="Default" color="primary" size="small" sx={{ mt: 1 }} />
                    )}
                  </Box>
                </Box>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Configuration:
                  </Typography>
                  <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>
                    • Header: {template.template_config.header || 'Not set'}
                  </Typography>
                  <Typography variant="caption" sx={{ display: 'block' }}>
                    • Custom fields: {template.template_config.custom_fields?.length || 0}
                  </Typography>
                </Box>
              </CardContent>
              <CardActions>
                <Button
                  size="small"
                  startIcon={<VisibilityIcon />}
                  onClick={() => handlePreview(template)}
                >
                  Preview
                </Button>
                <Button size="small" startIcon={<EditIcon />} onClick={() => handleEdit(template)}>
                  Edit
                </Button>
                <IconButton size="small" onClick={() => handleDelete(template.id)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {templates.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No templates found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Create your first certificate template to get started
          </Typography>
        </Box>
      )}

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
              <FormControl fullWidth>
                <InputLabel>Certificate Type</InputLabel>
                <Select
                  value={formData.certificate_type}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      certificate_type: e.target.value as CertificateType,
                    })
                  }
                  label="Certificate Type"
                >
                  {certificateTypes.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Header Text"
                value={formData.template_config.header || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    template_config: { ...formData.template_config, header: e.target.value },
                  })
                }
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Body Text"
                value={formData.template_config.body_text || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    template_config: { ...formData.template_config, body_text: e.target.value },
                  })
                }
                helperText="Use {{student_name}}, {{admission_number}}, etc. as placeholders"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Footer Text"
                value={formData.template_config.footer_text || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    template_config: { ...formData.template_config, footer_text: e.target.value },
                  })
                }
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

      <Dialog
        open={previewDialogOpen}
        onClose={() => setPreviewDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Template Preview: {previewTemplate?.name}</DialogTitle>
        <DialogContent>
          {previewTemplate && (
            <Box sx={{ p: 3, bgcolor: 'grey.100', borderRadius: 1 }}>
              <Paper sx={{ p: 4 }}>
                <Typography variant="h5" align="center" gutterBottom>
                  {previewTemplate.template_config.header}
                </Typography>
                <Typography variant="body1" sx={{ my: 3, whiteSpace: 'pre-wrap' }}>
                  {previewTemplate.template_config.body_text}
                </Typography>
                <Typography variant="body2" align="center" sx={{ mt: 4 }}>
                  {previewTemplate.template_config.footer_text}
                </Typography>
              </Paper>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CertificateManagement;

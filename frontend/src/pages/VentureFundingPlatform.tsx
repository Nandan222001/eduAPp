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
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Stack,
  LinearProgress,
  Paper,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Avatar,
  alpha,
} from '@mui/material';
import {
  AttachMoney as MoneyIcon,
  Close as CloseIcon,
  Send as SendIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  CheckCircle as ApprovedIcon,
  Pending as PendingIcon,
  Cancel as RejectedIcon,
  AccountBalance as BankIcon,
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import entrepreneurshipApi from '@/api/entrepreneurship';
import { VentureFundingRequest, FundingStatus, FundsBreakdown } from '@/types/entrepreneurship';

const fundingSteps = ['Request Details', 'Budget Breakdown', 'Justification', 'Review & Submit'];

export default function VentureFundingPlatform() {
  const [fundingRequests, setFundingRequests] = useState<VentureFundingRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<VentureFundingRequest | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [requestForm, setRequestForm] = useState({
    venture_id: 0,
    amount_requested: 0,
    funding_purpose: '',
    justification: '',
    expected_outcomes: '',
    use_of_funds_breakdown: [] as FundsBreakdown[],
  });

  const institutionId = parseInt(localStorage.getItem('institution_id') || '1');

  useEffect(() => {
    fetchFundingRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchFundingRequests = async () => {
    try {
      setLoading(true);
      const data = await entrepreneurshipApi.getFundingRequests(institutionId);
      setFundingRequests(data);
    } catch (error) {
      console.error('Failed to fetch funding requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewRequest = (request: VentureFundingRequest) => {
    setSelectedRequest(request);
    setDetailDialogOpen(true);
  };

  const handleNext = () => {
    setActiveStep((prev) => Math.min(prev + 1, fundingSteps.length - 1));
  };

  const handleBack = () => {
    setActiveStep((prev) => Math.max(prev - 1, 0));
  };

  const addBreakdownItem = () => {
    setRequestForm({
      ...requestForm,
      use_of_funds_breakdown: [
        ...requestForm.use_of_funds_breakdown,
        { category: '', amount: 0, description: '' },
      ],
    });
  };

  const updateBreakdownItem = (
    index: number,
    field: keyof FundsBreakdown,
    value: string | number
  ) => {
    const newBreakdown = [...requestForm.use_of_funds_breakdown];
    newBreakdown[index] = { ...newBreakdown[index], [field]: value };
    setRequestForm({ ...requestForm, use_of_funds_breakdown: newBreakdown });
  };

  const removeBreakdownItem = (index: number) => {
    const newBreakdown = requestForm.use_of_funds_breakdown.filter((_, i) => i !== index);
    setRequestForm({ ...requestForm, use_of_funds_breakdown: newBreakdown });
  };

  const handleSubmitRequest = async () => {
    try {
      setLoading(true);
      await entrepreneurshipApi.createFundingRequest(institutionId, requestForm);
      setCreateDialogOpen(false);
      setActiveStep(0);
      setRequestForm({
        venture_id: 0,
        amount_requested: 0,
        funding_purpose: '',
        justification: '',
        expected_outcomes: '',
        use_of_funds_breakdown: [],
      });
      alert('Funding request submitted successfully!');
      await fetchFundingRequests();
    } catch (error) {
      console.error('Failed to submit funding request:', error);
      alert('Failed to submit funding request');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: FundingStatus) => {
    switch (status) {
      case FundingStatus.APPROVED:
        return 'success';
      case FundingStatus.DISBURSED:
        return 'success';
      case FundingStatus.UNDER_REVIEW:
        return 'warning';
      case FundingStatus.REQUESTED:
        return 'info';
      case FundingStatus.REJECTED:
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: FundingStatus) => {
    switch (status) {
      case FundingStatus.APPROVED:
      case FundingStatus.DISBURSED:
        return <ApprovedIcon />;
      case FundingStatus.REQUESTED:
      case FundingStatus.UNDER_REVIEW:
        return <PendingIcon />;
      case FundingStatus.REJECTED:
        return <RejectedIcon />;
      default:
        return null;
    }
  };

  const totalBreakdown = requestForm.use_of_funds_breakdown.reduce(
    (sum, item) => sum + Number(item.amount),
    0
  );

  if (loading && fundingRequests.length === 0) {
    return (
      <Box sx={{ width: '100%', mt: 4 }}>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h3" fontWeight={700} gutterBottom>
              Venture Funding Platform
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Request and manage micro-grants for your venture
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
          >
            Request Funding
          </Button>
        </Stack>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Total Requests
                  </Typography>
                  <Typography variant="h3" fontWeight={700}>
                    {fundingRequests.length}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1) }}>
                  <MoneyIcon color="primary" />
                </Avatar>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Approved
                  </Typography>
                  <Typography variant="h3" fontWeight={700} color="success.main">
                    {fundingRequests.filter((r) => r.status === FundingStatus.APPROVED).length}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: (theme) => alpha(theme.palette.success.main, 0.1) }}>
                  <ApprovedIcon color="success" />
                </Avatar>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Total Approved
                  </Typography>
                  <Typography variant="h3" fontWeight={700}>
                    $
                    {fundingRequests
                      .filter(
                        (r) =>
                          r.status === FundingStatus.APPROVED ||
                          r.status === FundingStatus.DISBURSED
                      )
                      .reduce((sum, r) => sum + Number(r.approved_amount || 0), 0)
                      .toLocaleString()}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: (theme) => alpha(theme.palette.warning.main, 0.1) }}>
                  <BankIcon color="warning" />
                </Avatar>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Disbursed
                  </Typography>
                  <Typography variant="h3" fontWeight={700}>
                    $
                    {fundingRequests
                      .reduce((sum, r) => sum + Number(r.disbursed_amount || 0), 0)
                      .toLocaleString()}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: (theme) => alpha(theme.palette.info.main, 0.1) }}>
                  <MoneyIcon color="info" />
                </Avatar>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card>
        <CardHeader title="Funding Requests" />
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Venture</TableCell>
                  <TableCell>Purpose</TableCell>
                  <TableCell align="right">Amount Requested</TableCell>
                  <TableCell align="right">Approved Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {fundingRequests.map((request) => (
                  <TableRow key={request.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {request.venture?.venture_name || 'Unknown Venture'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{
                          maxWidth: 200,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {request.funding_purpose}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={600}>
                        ${Number(request.amount_requested).toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      {request.approved_amount ? (
                        <Typography variant="body2" fontWeight={600} color="success.main">
                          ${Number(request.approved_amount).toLocaleString()}
                        </Typography>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          -
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getStatusIcon(request.status) || undefined}
                        label={request.status.replace('_', ' ').toUpperCase()}
                        color={getStatusColor(request.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {format(parseISO(request.created_at), 'MMM d, yyyy')}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Button size="small" onClick={() => handleViewRequest(request)}>
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Dialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedRequest && (
          <>
            <DialogTitle>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="h5" fontWeight={700}>
                  Funding Request Details
                </Typography>
                <IconButton onClick={() => setDetailDialogOpen(false)}>
                  <CloseIcon />
                </IconButton>
              </Stack>
            </DialogTitle>
            <DialogContent>
              <Stack spacing={3}>
                <Box>
                  <Chip
                    icon={getStatusIcon(selectedRequest.status) || undefined}
                    label={selectedRequest.status.replace('_', ' ').toUpperCase()}
                    color={getStatusColor(selectedRequest.status)}
                  />
                </Box>

                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                      <Typography variant="caption" color="text.secondary">
                        Amount Requested
                      </Typography>
                      <Typography variant="h4" fontWeight={700}>
                        ${Number(selectedRequest.amount_requested).toLocaleString()}
                      </Typography>
                    </Paper>
                  </Grid>
                  {selectedRequest.approved_amount && (
                    <Grid item xs={6}>
                      <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                        <Typography variant="caption" color="text.secondary">
                          Approved Amount
                        </Typography>
                        <Typography variant="h4" fontWeight={700} color="success.main">
                          ${Number(selectedRequest.approved_amount).toLocaleString()}
                        </Typography>
                      </Paper>
                    </Grid>
                  )}
                </Grid>

                <Box>
                  <Typography variant="h6" gutterBottom>
                    Funding Purpose
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {selectedRequest.funding_purpose}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="h6" gutterBottom>
                    Justification
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {selectedRequest.justification}
                  </Typography>
                </Box>

                {selectedRequest.expected_outcomes && (
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      Expected Outcomes
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      {selectedRequest.expected_outcomes}
                    </Typography>
                  </Box>
                )}

                {selectedRequest.use_of_funds_breakdown &&
                  selectedRequest.use_of_funds_breakdown.length > 0 && (
                    <Box>
                      <Typography variant="h6" gutterBottom>
                        Budget Breakdown
                      </Typography>
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Category</TableCell>
                              <TableCell>Description</TableCell>
                              <TableCell align="right">Amount</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {selectedRequest.use_of_funds_breakdown.map((item, idx) => (
                              <TableRow key={idx}>
                                <TableCell>{item.category}</TableCell>
                                <TableCell>{item.description}</TableCell>
                                <TableCell align="right">
                                  ${Number(item.amount).toLocaleString()}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Box>
                  )}

                {selectedRequest.review_notes && (
                  <Alert
                    severity={
                      selectedRequest.status === FundingStatus.APPROVED ? 'success' : 'info'
                    }
                  >
                    <Typography variant="subtitle2" gutterBottom>
                      Review Notes
                    </Typography>
                    <Typography variant="body2">{selectedRequest.review_notes}</Typography>
                  </Alert>
                )}
              </Stack>
            </DialogContent>
          </>
        )}
      </Dialog>

      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Request Funding</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
              {fundingSteps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            {activeStep === 0 && (
              <Stack spacing={3}>
                <TextField
                  fullWidth
                  type="number"
                  label="Venture ID"
                  value={requestForm.venture_id}
                  onChange={(e) =>
                    setRequestForm({ ...requestForm, venture_id: Number(e.target.value) })
                  }
                />
                <TextField
                  fullWidth
                  type="number"
                  label="Amount Requested ($)"
                  value={requestForm.amount_requested}
                  onChange={(e) =>
                    setRequestForm({ ...requestForm, amount_requested: Number(e.target.value) })
                  }
                />
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Funding Purpose"
                  value={requestForm.funding_purpose}
                  onChange={(e) =>
                    setRequestForm({ ...requestForm, funding_purpose: e.target.value })
                  }
                  placeholder="Describe how you will use the funding..."
                />
              </Stack>
            )}

            {activeStep === 1 && (
              <Stack spacing={3}>
                <Alert severity="info">
                  Break down how you plan to use the funds. The total should match your requested
                  amount.
                </Alert>

                {requestForm.use_of_funds_breakdown.map((item, idx) => (
                  <Paper key={idx} sx={{ p: 2, bgcolor: 'background.default' }}>
                    <Stack spacing={2}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="subtitle2">Item {idx + 1}</Typography>
                        <IconButton size="small" onClick={() => removeBreakdownItem(idx)}>
                          <DeleteIcon />
                        </IconButton>
                      </Stack>
                      <TextField
                        fullWidth
                        size="small"
                        label="Category"
                        value={item.category}
                        onChange={(e) => updateBreakdownItem(idx, 'category', e.target.value)}
                      />
                      <TextField
                        fullWidth
                        size="small"
                        label="Description"
                        value={item.description}
                        onChange={(e) => updateBreakdownItem(idx, 'description', e.target.value)}
                      />
                      <TextField
                        fullWidth
                        size="small"
                        type="number"
                        label="Amount ($)"
                        value={item.amount}
                        onChange={(e) => updateBreakdownItem(idx, 'amount', Number(e.target.value))}
                      />
                    </Stack>
                  </Paper>
                ))}

                <Button startIcon={<AddIcon />} onClick={addBreakdownItem}>
                  Add Item
                </Button>

                <Paper sx={{ p: 2, bgcolor: 'primary.light' }}>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="subtitle1" fontWeight={600}>
                      Total:
                    </Typography>
                    <Typography
                      variant="subtitle1"
                      fontWeight={600}
                      color={
                        totalBreakdown === requestForm.amount_requested
                          ? 'success.main'
                          : 'error.main'
                      }
                    >
                      ${totalBreakdown.toLocaleString()}
                    </Typography>
                  </Stack>
                </Paper>
              </Stack>
            )}

            {activeStep === 2 && (
              <Stack spacing={3}>
                <TextField
                  fullWidth
                  multiline
                  rows={6}
                  label="Justification"
                  value={requestForm.justification}
                  onChange={(e) =>
                    setRequestForm({ ...requestForm, justification: e.target.value })
                  }
                  placeholder="Explain why your venture needs this funding and how it will help you achieve your goals..."
                />
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Expected Outcomes"
                  value={requestForm.expected_outcomes}
                  onChange={(e) =>
                    setRequestForm({ ...requestForm, expected_outcomes: e.target.value })
                  }
                  placeholder="What do you expect to achieve with this funding?..."
                />
              </Stack>
            )}

            {activeStep === 3 && (
              <Stack spacing={3}>
                <Alert severity="success">Review your funding request before submitting</Alert>

                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      Venture ID
                    </Typography>
                    <Typography variant="body1" fontWeight={600}>
                      {requestForm.venture_id}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      Amount Requested
                    </Typography>
                    <Typography variant="body1" fontWeight={600}>
                      ${requestForm.amount_requested.toLocaleString()}
                    </Typography>
                  </Grid>
                </Grid>

                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Purpose
                  </Typography>
                  <Typography variant="body2">{requestForm.funding_purpose}</Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Budget Items
                  </Typography>
                  <Typography variant="body2">
                    {requestForm.use_of_funds_breakdown.length} items totaling $
                    {totalBreakdown.toLocaleString()}
                  </Typography>
                </Box>
              </Stack>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Box sx={{ flex: 1 }} />
          <Button onClick={handleBack} disabled={activeStep === 0}>
            Back
          </Button>
          {activeStep < fundingSteps.length - 1 ? (
            <Button variant="contained" onClick={handleNext}>
              Next
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleSubmitRequest}
              disabled={loading}
              startIcon={<SendIcon />}
            >
              Submit Request
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Container>
  );
}

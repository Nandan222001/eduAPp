import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  Grid,
  Paper,
  Alert,
  CircularProgress,
  Stack,
  Divider,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormControl,
  FormLabel,
  alpha,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Verified as VerifiedIcon,
} from '@mui/icons-material';
import communityServiceApi from '@/api/communityService';
import { ServiceVerificationRequest } from '@/types/communityService';

export default function ServiceVerificationPortal() {
  const { verificationCode } = useParams<{ verificationCode: string }>();
  const [request, setRequest] = useState<ServiceVerificationRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [decision, setDecision] = useState<'approved' | 'rejected'>('approved');
  const [verifierName, setVerifierName] = useState('');
  const [verifierEmail, setVerifierEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const fetchVerificationRequest = async () => {
    try {
      setLoading(true);
      const data = await communityServiceApi.getVerificationRequest(verificationCode!);
      setRequest(data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch verification request:', err);
      setError(
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ||
          'Invalid or expired verification code'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (verificationCode) {
      fetchVerificationRequest();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verificationCode]);

  const handleSubmit = async () => {
    if (!verificationCode) return;

    if (!verifierName.trim() || !verifierEmail.trim()) {
      setError('Please provide your name and email');
      return;
    }

    try {
      setSubmitting(true);
      await communityServiceApi.submitVerification(verificationCode, {
        status: decision,
        notes: notes.trim() || undefined,
        verifier_name: verifierName,
        verifier_email: verifierEmail,
      });
      setSuccess(true);
      setError(null);
    } catch (err) {
      console.error('Failed to submit verification:', err);
      setError(
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ||
          'Failed to submit verification'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          bgcolor: 'background.default',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (success) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          bgcolor: 'background.default',
          p: 3,
        }}
      >
        <Card sx={{ maxWidth: 600, width: '100%' }}>
          <CardContent sx={{ textAlign: 'center', p: 6 }}>
            <VerifiedIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
            <Typography variant="h4" fontWeight={700} gutterBottom>
              Verification Submitted!
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              Thank you for verifying the community service hours. The student has been notified of
              your decision.
            </Typography>
            <Paper sx={{ p: 2, bgcolor: (theme) => alpha(theme.palette.success.main, 0.1) }}>
              <Typography variant="body2" color="text.secondary">
                Decision:{' '}
                <strong style={{ color: decision === 'approved' ? 'green' : 'red' }}>
                  {decision === 'approved' ? 'Approved' : 'Rejected'}
                </strong>
              </Typography>
            </Paper>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', py: 6 }}>
      <Container maxWidth="md">
        <Paper sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography variant="h4" fontWeight={700} gutterBottom>
              Community Service Verification
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Please review and verify the student&apos;s community service hours
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {request ? (
            <>
              <Card sx={{ mb: 4, bgcolor: (theme) => alpha(theme.palette.primary.main, 0.05) }}>
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Student Name
                      </Typography>
                      <Typography variant="h6" fontWeight={600}>
                        {request.student_name}
                      </Typography>
                    </Grid>

                    <Grid item xs={12}>
                      <Divider />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Organization
                      </Typography>
                      <Typography variant="body1">{request.organization_name}</Typography>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Activity
                      </Typography>
                      <Typography variant="body1">{request.activity_name}</Typography>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Hours Claimed
                      </Typography>
                      <Typography variant="h5" fontWeight={700} color="primary.main">
                        {request.hours} hours
                      </Typography>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Date Range
                      </Typography>
                      <Typography variant="body1">{request.date_range}</Typography>
                    </Grid>

                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Activity Description
                      </Typography>
                      <Typography variant="body1">{request.description}</Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    Your Verification
                  </Typography>

                  <Stack spacing={3}>
                    <FormControl component="fieldset">
                      <FormLabel component="legend">Verification Decision</FormLabel>
                      <RadioGroup
                        value={decision}
                        onChange={(e) => setDecision(e.target.value as 'approved' | 'rejected')}
                      >
                        <FormControlLabel
                          value="approved"
                          control={<Radio />}
                          label={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <CheckCircleIcon color="success" />
                              <Box>
                                <Typography variant="body1" fontWeight={600}>
                                  Approve
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  Confirm that the student completed the stated hours
                                </Typography>
                              </Box>
                            </Box>
                          }
                        />
                        <FormControlLabel
                          value="rejected"
                          control={<Radio />}
                          label={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <CancelIcon color="error" />
                              <Box>
                                <Typography variant="body1" fontWeight={600}>
                                  Reject
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  The information provided is incorrect or cannot be verified
                                </Typography>
                              </Box>
                            </Box>
                          }
                        />
                      </RadioGroup>
                    </FormControl>

                    <TextField
                      fullWidth
                      label="Your Full Name"
                      required
                      value={verifierName}
                      onChange={(e) => setVerifierName(e.target.value)}
                      helperText="Please provide your name for verification records"
                    />

                    <TextField
                      fullWidth
                      label="Your Email Address"
                      type="email"
                      required
                      value={verifierEmail}
                      onChange={(e) => setVerifierEmail(e.target.value)}
                      helperText="We'll send a confirmation to this email"
                    />

                    <TextField
                      fullWidth
                      multiline
                      rows={4}
                      label="Additional Notes (Optional)"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      helperText="Add any comments or clarifications about this verification"
                    />

                    <Button
                      fullWidth
                      variant="contained"
                      size="large"
                      onClick={handleSubmit}
                      disabled={submitting || !verifierName.trim() || !verifierEmail.trim()}
                      startIcon={decision === 'approved' ? <CheckCircleIcon /> : <CancelIcon />}
                      color={decision === 'approved' ? 'success' : 'error'}
                    >
                      {submitting
                        ? 'Submitting...'
                        : decision === 'approved'
                          ? 'Approve Hours'
                          : 'Reject Hours'}
                    </Button>
                  </Stack>
                </CardContent>
              </Card>

              <Alert severity="info" sx={{ mt: 3 }}>
                <Typography variant="body2">
                  <strong>Privacy Note:</strong> Your verification decision will be recorded and
                  shared with the student and school administration. Your email will only be used
                  for confirmation purposes.
                </Typography>
              </Alert>
            </>
          ) : (
            <Alert severity="error">
              Unable to load verification request. The link may be invalid or expired.
            </Alert>
          )}
        </Paper>
      </Container>
    </Box>
  );
}

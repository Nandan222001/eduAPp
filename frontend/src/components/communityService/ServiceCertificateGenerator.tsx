import { useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  Stack,
  Grid,
} from '@mui/material';
import { ServiceHourCertificate } from '@/types/communityService';

interface ServiceCertificateGeneratorProps {
  certificate: ServiceHourCertificate;
}

export default function ServiceCertificateGenerator({
  certificate,
}: ServiceCertificateGeneratorProps) {
  const certificateRef = useRef<HTMLDivElement>(null);

  return (
    <Paper
      ref={certificateRef}
      elevation={0}
      sx={{
        p: 6,
        bgcolor: 'white',
        border: '8px double',
        borderColor: 'primary.main',
        position: 'relative',
        minHeight: '800px',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity: 0.05,
          backgroundImage: certificate.school_seal ? `url(${certificate.school_seal})` : 'none',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          backgroundSize: '400px',
          pointerEvents: 'none',
        }}
      />

      <Box sx={{ position: 'relative', zIndex: 1 }}>
        {certificate.school_seal && (
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <img
              src={certificate.school_seal}
              alt="School Seal"
              style={{ height: '80px', objectFit: 'contain' }}
            />
          </Box>
        )}

        <Typography
          variant="h3"
          align="center"
          fontWeight={700}
          color="primary"
          gutterBottom
          sx={{ fontFamily: 'serif' }}
        >
          Community Service Hours Certificate
        </Typography>

        <Typography variant="h6" align="center" color="text.secondary" gutterBottom sx={{ mb: 4 }}>
          {certificate.school_name}
        </Typography>

        <Divider sx={{ mb: 4 }} />

        <Typography variant="body1" align="center" sx={{ mb: 2 }}>
          This certificate is proudly presented to
        </Typography>

        <Typography
          variant="h4"
          align="center"
          fontWeight={700}
          sx={{ mb: 2, fontFamily: 'serif', textDecoration: 'underline' }}
        >
          {certificate.student_name}
        </Typography>

        <Typography variant="body1" align="center" sx={{ mb: 1 }}>
          Student ID: {certificate.student_id} • Grade: {certificate.grade}
        </Typography>

        <Typography variant="body1" align="center" sx={{ mb: 4, lineHeight: 1.8 }}>
          In recognition of outstanding community service and dedication to making a positive
          impact. Your generous contribution of time and effort has benefited our community and
          demonstrated exemplary civic responsibility.
        </Typography>

        <Box sx={{ my: 4, p: 3, bgcolor: 'grey.50', borderRadius: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="h5" align="center" fontWeight={600} color="primary" gutterBottom>
                {certificate.total_hours}
              </Typography>
              <Typography variant="body2" align="center" color="text.secondary">
                Total Hours Completed
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography
                variant="h5"
                align="center"
                fontWeight={600}
                color="success.main"
                gutterBottom
              >
                {certificate.approved_hours}
              </Typography>
              <Typography variant="body2" align="center" color="text.secondary">
                Verified Hours
              </Typography>
            </Grid>
          </Grid>
          <Typography variant="body2" align="center" color="text.secondary" sx={{ mt: 2 }}>
            Academic Year {certificate.academic_year}
          </Typography>
        </Box>

        {certificate.activity_breakdown && certificate.activity_breakdown.length > 0 && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom fontWeight={600} align="center" sx={{ mb: 2 }}>
              Service Categories
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>
                      <strong>Category</strong>
                    </TableCell>
                    <TableCell align="right">
                      <strong>Hours</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Activities</strong>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {certificate.activity_breakdown.map((activity, index) => (
                    <TableRow key={index}>
                      <TableCell>{activity.category}</TableCell>
                      <TableCell align="right">{activity.hours}</TableCell>
                      <TableCell>
                        {activity.activities.length > 0 ? activity.activities.join(', ') : 'N/A'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        <Divider sx={{ my: 4 }} />

        <Stack direction="row" justifyContent="space-around" alignItems="flex-end" sx={{ mt: 6 }}>
          <Box sx={{ textAlign: 'center', minWidth: 200 }}>
            {certificate.principal_signature && (
              <Box sx={{ mb: 1 }}>
                <img
                  src={certificate.principal_signature}
                  alt="Principal Signature"
                  style={{ height: '50px', objectFit: 'contain' }}
                />
              </Box>
            )}
            <Divider sx={{ mb: 1 }} />
            <Typography variant="body1" fontWeight={600}>
              {certificate.principal_name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Principal
            </Typography>
          </Box>

          {certificate.counselor_name && (
            <Box sx={{ textAlign: 'center', minWidth: 200 }}>
              {certificate.counselor_signature && (
                <Box sx={{ mb: 1 }}>
                  <img
                    src={certificate.counselor_signature}
                    alt="Counselor Signature"
                    style={{ height: '50px', objectFit: 'contain' }}
                  />
                </Box>
              )}
              <Divider sx={{ mb: 1 }} />
              <Typography variant="body1" fontWeight={600}>
                {certificate.counselor_name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                School Counselor
              </Typography>
            </Box>
          )}
        </Stack>

        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Issue Date:{' '}
            {new Date(certificate.issue_date).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Certificate ID: {certificate.certificate_id}
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
}

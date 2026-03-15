import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Stack,
  Button,
  TextField,
  Stepper,
  Step,
  StepLabel,
  Alert,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  CircularProgress,
  Divider,
} from '@mui/material';
import {
  PersonAdd as PersonAddIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Link as LinkIcon,
} from '@mui/icons-material';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { parentsApi } from '@/api/parents';
import type { SiblingLinkRequest } from '@/types/parent';

const steps = ['Add Student IDs', 'Verify Information', 'Link Siblings'];

export const SiblingLinkingWorkflow: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [studentIds, setStudentIds] = useState<number[]>([]);
  const [newStudentId, setNewStudentId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: existingChildren } = useQuery({
    queryKey: ['parent-children'],
    queryFn: () => parentsApi.getChildren(),
  });

  const linkSiblingsMutation = useMutation({
    mutationFn: (request: SiblingLinkRequest) => parentsApi.linkSiblings(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parent-children'] });
      queryClient.invalidateQueries({ queryKey: ['family-overview-metrics'] });
      setActiveStep(2);
      setStudentIds([]);
      setNewStudentId('');
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { detail?: string } } };
      setError(err.response?.data?.detail || 'Failed to link siblings');
    },
  });

  const handleAddStudentId = () => {
    const id = Number(newStudentId);
    if (!id || isNaN(id)) {
      setError('Please enter a valid student ID');
      return;
    }
    if (studentIds.includes(id)) {
      setError('This student ID is already added');
      return;
    }
    if (existingChildren?.some((child) => child.id === id)) {
      setError('This child is already linked to your account');
      return;
    }
    setStudentIds([...studentIds, id]);
    setNewStudentId('');
    setError(null);
  };

  const handleRemoveStudentId = (id: number) => {
    setStudentIds(studentIds.filter((sid) => sid !== id));
  };

  const handleNext = () => {
    if (activeStep === 0 && studentIds.length === 0) {
      setError('Please add at least one student ID');
      return;
    }
    setError(null);
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setError(null);
    setActiveStep((prev) => prev - 1);
  };

  const handleSubmit = () => {
    const parentId = 1;
    const request: SiblingLinkRequest = {
      parent_id: parentId,
      student_ids: studentIds,
    };
    linkSiblingsMutation.mutate(request);
  };

  const handleReset = () => {
    setActiveStep(0);
    setStudentIds([]);
    setNewStudentId('');
    setError(null);
  };

  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" gap={2} mb={3}>
          <LinkIcon color="primary" fontSize="large" />
          <Box>
            <Typography variant="h6">Link Siblings</Typography>
            <Typography variant="body2" color="text.secondary">
              Add multiple children to your account
            </Typography>
          </Box>
        </Box>

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {activeStep === 0 && (
          <Stack spacing={3}>
            <Alert severity="info">
              Enter the student IDs or admission numbers of your children. You can get these from
              the school administration.
            </Alert>
            <Box display="flex" gap={2}>
              <TextField
                fullWidth
                label="Student ID / Admission Number"
                value={newStudentId}
                onChange={(e) => setNewStudentId(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddStudentId()}
                type="number"
              />
              <Button
                variant="contained"
                onClick={handleAddStudentId}
                startIcon={<PersonAddIcon />}
              >
                Add
              </Button>
            </Box>

            {studentIds.length > 0 && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Students to Link ({studentIds.length})
                </Typography>
                <List>
                  {studentIds.map((id) => (
                    <ListItem key={id} divider>
                      <ListItemText primary={`Student ID: ${id}`} />
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          onClick={() => handleRemoveStudentId(id)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
          </Stack>
        )}

        {activeStep === 1 && (
          <Stack spacing={3}>
            <Alert severity="warning">
              Please verify the following information before proceeding. Once linked, these students
              will be associated with your parent account.
            </Alert>

            {existingChildren && existingChildren.length > 0 && (
              <Box>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Currently Linked Children
                </Typography>
                <List>
                  {existingChildren.map((child) => (
                    <ListItem key={child.id}>
                      <ListItemText
                        primary={`${child.first_name} ${child.last_name}`}
                        secondary={`ID: ${child.id} - ${child.grade_name} ${child.section_name}`}
                      />
                      <Chip label="Linked" color="success" size="small" />
                    </ListItem>
                  ))}
                </List>
                <Divider sx={{ my: 2 }} />
              </Box>
            )}

            <Box>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                New Children to Link
              </Typography>
              <List>
                {studentIds.map((id) => (
                  <ListItem key={id}>
                    <ListItemText primary={`Student ID: ${id}`} />
                    <Chip label="To be linked" color="primary" size="small" />
                  </ListItem>
                ))}
              </List>
            </Box>
          </Stack>
        )}

        {activeStep === 2 && (
          <Stack spacing={3} alignItems="center" textAlign="center">
            <CheckCircleIcon sx={{ fontSize: 80 }} color="success" />
            <Typography variant="h5">Siblings Linked Successfully!</Typography>
            <Typography variant="body1" color="text.secondary">
              The children have been added to your account. You can now view and manage all their
              information from the family dashboard.
            </Typography>
            <Button variant="contained" onClick={handleReset}>
              Link More Children
            </Button>
          </Stack>
        )}

        {activeStep < 2 && (
          <Box display="flex" justifyContent="space-between" mt={4}>
            <Button disabled={activeStep === 0} onClick={handleBack}>
              Back
            </Button>
            <Button
              variant="contained"
              onClick={activeStep === 1 ? handleSubmit : handleNext}
              disabled={linkSiblingsMutation.isPending}
              startIcon={linkSiblingsMutation.isPending ? <CircularProgress size={20} /> : null}
            >
              {activeStep === 1 ? 'Link Siblings' : 'Next'}
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

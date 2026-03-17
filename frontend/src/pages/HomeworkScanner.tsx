import { useState, useRef } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Paper,
  Button,
  IconButton,
  Avatar,
  Chip,
  List,
  ListItem,
  ListItemText,
  Divider,
  CircularProgress,
  LinearProgress,
  Stepper,
  Step,
  StepLabel,
  Alert,
  useTheme,
  alpha,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Badge,
  Tabs,
  Tab,
} from '@mui/material';
import {
  CameraAlt as CameraIcon,
  Photo as PhotoIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  HelpOutline as HelpIcon,
  TrendingUp as TrendingUpIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  ExpandMore as ExpandMoreIcon,
  Check as CheckIcon,
  Lightbulb as LightbulbIcon,
  School as SchoolIcon,
  Email as EmailIcon,
} from '@mui/icons-material';

interface ScannedPage {
  id: string;
  imageUrl: string;
  pageNumber: number;
}

interface Question {
  id: string;
  questionNumber: number;
  isCorrect: boolean;
  studentAnswer: string;
  correctAnswer: string;
  marks: number;
  totalMarks: number;
  feedback: string;
  mistakeExplanation: string;
  improvementTips: string[];
}

interface ScanResult {
  id: string;
  subject: string;
  topic: string;
  totalQuestions: number;
  correctAnswers: number;
  totalMarks: number;
  obtainedMarks: number;
  percentage: number;
  grade: string;
  questions: Question[];
  overallFeedback: string;
  teacherNotified: boolean;
  scannedAt: Date;
}

export default function HomeworkScanner() {
  const theme = useTheme();
  const [activeStep, setActiveStep] = useState(0);
  const [scannedPages, setScannedPages] = useState<ScannedPage[]>([]);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [selectedTab, setSelectedTab] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const steps = ['Capture/Upload', 'Processing', 'Results'];

  const handleCameraCapture = () => {
    cameraInputRef.current?.click();
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newPages: ScannedPage[] = [];
    Array.from(files).forEach((file, index) => {
      const imageUrl = URL.createObjectURL(file);
      newPages.push({
        id: Date.now().toString() + index,
        imageUrl,
        pageNumber: scannedPages.length + index + 1,
      });
    });

    setScannedPages((prev) => [...prev, ...newPages]);
    if (scannedPages.length === 0 && newPages.length > 0) {
      setActiveStep(0);
    }
  };

  const handleRemovePage = (pageId: string) => {
    setScannedPages((prev) => {
      const filtered = prev.filter((p) => p.id !== pageId);
      return filtered.map((p, index) => ({ ...p, pageNumber: index + 1 }));
    });
  };

  const handleProcessScans = () => {
    if (scannedPages.length === 0) return;

    setActiveStep(1);
    setProcessingProgress(0);

    const interval = setInterval(() => {
      setProcessingProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setActiveStep(2);
          generateMockResults();
          return 100;
        }
        return prev + 10;
      });
    }, 300);
  };

  const generateMockResults = () => {
    const mockQuestions: Question[] = [
      {
        id: '1',
        questionNumber: 1,
        isCorrect: true,
        studentAnswer: 'x = 5',
        correctAnswer: 'x = 5',
        marks: 5,
        totalMarks: 5,
        feedback: 'Perfect! Your solution is correct and well-structured.',
        mistakeExplanation: '',
        improvementTips: ['Great work! Keep using this systematic approach.'],
      },
      {
        id: '2',
        questionNumber: 2,
        isCorrect: false,
        studentAnswer: 'y = 3x + 2',
        correctAnswer: 'y = 3x - 2',
        marks: 2,
        totalMarks: 5,
        feedback: 'Close! You got the slope right but made a sign error in the y-intercept.',
        mistakeExplanation:
          'You correctly identified the slope as 3, but when calculating the y-intercept, you should subtract 2 instead of adding. Check the point (0, -2) which shows the line crosses the y-axis at -2.',
        improvementTips: [
          'Always verify your answer by substituting the given points',
          'Pay attention to negative signs when calculating intercepts',
          'Draw a quick sketch to visualize the line',
        ],
      },
      {
        id: '3',
        questionNumber: 3,
        isCorrect: true,
        studentAnswer: 'Area = 24 sq units',
        correctAnswer: 'Area = 24 sq units',
        marks: 4,
        totalMarks: 4,
        feedback: 'Excellent! You applied the formula correctly.',
        mistakeExplanation: '',
        improvementTips: [
          'Consider showing your working steps for partial credit even if the answer is correct.',
        ],
      },
      {
        id: '4',
        questionNumber: 4,
        isCorrect: false,
        studentAnswer: '45°',
        correctAnswer: '60°',
        marks: 0,
        totalMarks: 4,
        feedback: 'Incorrect. Review the properties of equilateral triangles.',
        mistakeExplanation:
          'In an equilateral triangle, all angles are equal and sum to 180°. Therefore, each angle is 180° ÷ 3 = 60°. You may have confused this with a right isosceles triangle where two angles are 45°.',
        improvementTips: [
          'Remember: equilateral triangle = all sides equal = all angles equal = 60° each',
          'Draw the triangle and mark known properties',
          'Make a reference sheet of common triangle types and their angles',
        ],
      },
      {
        id: '5',
        questionNumber: 5,
        isCorrect: true,
        studentAnswer: 'Perimeter = 36 cm',
        correctAnswer: 'Perimeter = 36 cm',
        marks: 3,
        totalMarks: 3,
        feedback: 'Correct! Well done.',
        mistakeExplanation: '',
        improvementTips: [],
      },
    ];

    const totalMarks = mockQuestions.reduce((sum, q) => sum + q.totalMarks, 0);
    const obtainedMarks = mockQuestions.reduce((sum, q) => sum + q.marks, 0);
    const correctAnswers = mockQuestions.filter((q) => q.isCorrect).length;
    const percentage = (obtainedMarks / totalMarks) * 100;

    const result: ScanResult = {
      id: Date.now().toString(),
      subject: 'Mathematics',
      topic: 'Geometry & Algebra',
      totalQuestions: mockQuestions.length,
      correctAnswers,
      totalMarks,
      obtainedMarks,
      percentage,
      grade: percentage >= 90 ? 'A' : percentage >= 80 ? 'B' : percentage >= 70 ? 'C' : 'D',
      questions: mockQuestions,
      overallFeedback:
        'Good effort! You have a solid understanding of basic concepts. Focus on being more careful with signs and reviewing triangle properties. With a bit more practice on the areas you struggled with, you can achieve even better results!',
      teacherNotified: false,
      scannedAt: new Date(),
    };

    setScanResult(result);
  };

  const handleNotifyTeacher = () => {
    if (!scanResult) return;
    setScanResult({ ...scanResult, teacherNotified: true });
  };

  const handleReset = () => {
    setActiveStep(0);
    setScannedPages([]);
    setProcessingProgress(0);
    setScanResult(null);
    setSelectedTab(0);
  };

  const renderCaptureStep = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <Typography variant="h5" fontWeight={700} gutterBottom>
              Scan Your Homework
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mb: 4, maxWidth: 600, mx: 'auto' }}
            >
              Take photos of your homework pages or upload existing images. The AI will analyze your
              answers and provide detailed feedback.
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                size="large"
                startIcon={<CameraIcon />}
                onClick={handleCameraCapture}
              >
                Take Photo
              </Button>
              <Button
                variant="outlined"
                size="large"
                startIcon={<PhotoIcon />}
                onClick={handleFileUpload}
              >
                Upload Images
              </Button>
            </Box>
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              multiple
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </CardContent>
        </Card>
      </Grid>

      {scannedPages.length > 0 && (
        <>
          <Grid item xs={12}>
            <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
              <CardHeader
                title="Scanned Pages"
                subheader={`${scannedPages.length} page${scannedPages.length !== 1 ? 's' : ''} ready`}
                action={
                  <Button startIcon={<AddIcon />} onClick={handleFileUpload}>
                    Add More
                  </Button>
                }
              />
              <CardContent>
                <Grid container spacing={2}>
                  {scannedPages.map((page) => (
                    <Grid item xs={6} sm={4} md={3} key={page.id}>
                      <Paper
                        elevation={0}
                        sx={{
                          position: 'relative',
                          border: `2px solid ${theme.palette.divider}`,
                          borderRadius: 2,
                          overflow: 'hidden',
                          '&:hover .delete-btn': {
                            opacity: 1,
                          },
                        }}
                      >
                        <Box
                          component="img"
                          src={page.imageUrl}
                          alt={`Page ${page.pageNumber}`}
                          sx={{
                            width: '100%',
                            height: 200,
                            objectFit: 'cover',
                          }}
                        />
                        <Box
                          sx={{
                            position: 'absolute',
                            top: 0,
                            right: 0,
                            p: 1,
                          }}
                        >
                          <IconButton
                            className="delete-btn"
                            size="small"
                            onClick={() => handleRemovePage(page.id)}
                            sx={{
                              bgcolor: 'rgba(0, 0, 0, 0.6)',
                              color: 'white',
                              opacity: 0,
                              transition: 'opacity 0.2s',
                              '&:hover': {
                                bgcolor: 'rgba(0, 0, 0, 0.8)',
                              },
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                        <Box
                          sx={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            bgcolor: 'rgba(0, 0, 0, 0.7)',
                            color: 'white',
                            p: 1,
                            textAlign: 'center',
                          }}
                        >
                          <Typography variant="caption">Page {page.pageNumber}</Typography>
                        </Box>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="contained" size="large" onClick={handleProcessScans}>
                Process Homework
              </Button>
            </Box>
          </Grid>
        </>
      )}
    </Grid>
  );

  const renderProcessingStep = () => (
    <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
      <CardContent sx={{ textAlign: 'center', py: 8 }}>
        <CircularProgress size={80} sx={{ mb: 3 }} />
        <Typography variant="h5" fontWeight={700} gutterBottom>
          Analyzing Your Homework
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          AI is scanning your answers and preparing detailed feedback...
        </Typography>
        <Box sx={{ maxWidth: 600, mx: 'auto' }}>
          <LinearProgress
            variant="determinate"
            value={processingProgress}
            sx={{
              height: 8,
              borderRadius: 4,
              mb: 1,
            }}
          />
          <Typography variant="caption" color="text.secondary">
            {processingProgress}% complete
          </Typography>
        </Box>
        <List sx={{ mt: 4, maxWidth: 400, mx: 'auto', textAlign: 'left' }}>
          <ListItem>
            <CheckCircleIcon
              sx={{
                mr: 2,
                color: processingProgress > 20 ? 'success.main' : 'text.disabled',
              }}
            />
            <ListItemText
              primary="Image Enhancement"
              secondary={processingProgress > 20 ? 'Complete' : 'Processing...'}
            />
          </ListItem>
          <ListItem>
            <CheckCircleIcon
              sx={{
                mr: 2,
                color: processingProgress > 50 ? 'success.main' : 'text.disabled',
              }}
            />
            <ListItemText
              primary="Handwriting Recognition"
              secondary={processingProgress > 50 ? 'Complete' : 'Processing...'}
            />
          </ListItem>
          <ListItem>
            <CheckCircleIcon
              sx={{
                mr: 2,
                color: processingProgress > 80 ? 'success.main' : 'text.disabled',
              }}
            />
            <ListItemText
              primary="Answer Verification"
              secondary={processingProgress > 80 ? 'Complete' : 'Processing...'}
            />
          </ListItem>
        </List>
      </CardContent>
    </Card>
  );

  const renderResultsStep = () => {
    if (!scanResult) return null;

    return (
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Alert severity="success" sx={{ mb: 2 }}>
            Analysis complete! Your homework has been graded and feedback is ready.
          </Alert>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card
            elevation={0}
            sx={{
              border: `1px solid ${theme.palette.divider}`,
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
              color: 'white',
            }}
          >
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" gutterBottom>
                Overall Score
              </Typography>
              <Typography variant="h2" fontWeight={700} gutterBottom>
                {scanResult.percentage.toFixed(1)}%
              </Typography>
              <Chip
                label={`Grade: ${scanResult.grade}`}
                sx={{
                  bgcolor: 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: '1rem',
                  mb: 2,
                }}
              />
              <Divider sx={{ my: 2, bgcolor: 'rgba(255, 255, 255, 0.2)' }} />
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="h4" fontWeight={700}>
                    {scanResult.correctAnswers}
                  </Typography>
                  <Typography variant="caption">Correct</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="h4" fontWeight={700}>
                    {scanResult.totalQuestions - scanResult.correctAnswers}
                  </Typography>
                  <Typography variant="caption">Incorrect</Typography>
                </Grid>
              </Grid>
              <Typography variant="caption" sx={{ mt: 2, display: 'block', opacity: 0.9 }}>
                {scanResult.obtainedMarks} / {scanResult.totalMarks} marks
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
            <CardHeader
              title="Subject Details"
              avatar={
                <Avatar sx={{ bgcolor: alpha(theme.palette.info.main, 0.1) }}>
                  <SchoolIcon sx={{ color: theme.palette.info.main }} />
                </Avatar>
              }
            />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Paper elevation={0} sx={{ p: 2, bgcolor: alpha(theme.palette.info.main, 0.05) }}>
                    <Typography variant="body2" color="text.secondary">
                      Subject
                    </Typography>
                    <Typography variant="h6" fontWeight={600}>
                      {scanResult.subject}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Paper elevation={0} sx={{ p: 2, bgcolor: alpha(theme.palette.info.main, 0.05) }}>
                    <Typography variant="body2" color="text.secondary">
                      Topic
                    </Typography>
                    <Typography variant="h6" fontWeight={600}>
                      {scanResult.topic}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                  Overall Feedback
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {scanResult.overallFeedback}
                </Typography>
              </Box>
              <Box sx={{ mt: 3 }}>
                <Button
                  variant={scanResult.teacherNotified ? 'outlined' : 'contained'}
                  startIcon={scanResult.teacherNotified ? <CheckIcon /> : <EmailIcon />}
                  onClick={handleNotifyTeacher}
                  disabled={scanResult.teacherNotified}
                  fullWidth
                >
                  {scanResult.teacherNotified ? 'Teacher Notified' : 'Notify Teacher'}
                </Button>
                {scanResult.teacherNotified && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    Your teacher has been notified about this homework submission and will review
                    your progress.
                  </Alert>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
            <CardHeader title="Question-by-Question Analysis" />
            <CardContent sx={{ pt: 0 }}>
              <Tabs value={selectedTab} onChange={(_, v) => setSelectedTab(v)} sx={{ mb: 2 }}>
                <Tab label="All Questions" />
                <Tab
                  label={
                    <Badge
                      badgeContent={scanResult.totalQuestions - scanResult.correctAnswers}
                      color="error"
                    >
                      <span style={{ paddingRight: 8 }}>Incorrect Only</span>
                    </Badge>
                  }
                />
              </Tabs>

              {scanResult.questions
                .filter((q) => selectedTab === 0 || !q.isCorrect)
                .map((question) => (
                  <Accordion
                    key={question.id}
                    elevation={0}
                    sx={{
                      border: `1px solid ${theme.palette.divider}`,
                      mb: 2,
                      '&:before': { display: 'none' },
                    }}
                  >
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2,
                          width: '100%',
                        }}
                      >
                        {question.isCorrect ? (
                          <CheckCircleIcon sx={{ color: 'success.main', fontSize: 28 }} />
                        ) : (
                          <CancelIcon sx={{ color: 'error.main', fontSize: 28 }} />
                        )}
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle1" fontWeight={600}>
                            Question {question.questionNumber}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {question.marks} / {question.totalMarks} marks
                          </Typography>
                        </Box>
                        <Chip
                          label={question.isCorrect ? 'Correct' : 'Incorrect'}
                          color={question.isCorrect ? 'success' : 'error'}
                          size="small"
                        />
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <Paper
                            elevation={0}
                            sx={{
                              p: 2,
                              bgcolor: alpha(theme.palette.info.main, 0.05),
                              border: `1px solid ${theme.palette.divider}`,
                            }}
                          >
                            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                              Your Answer
                            </Typography>
                            <Typography variant="body2">{question.studentAnswer}</Typography>
                          </Paper>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Paper
                            elevation={0}
                            sx={{
                              p: 2,
                              bgcolor: alpha(theme.palette.success.main, 0.05),
                              border: `1px solid ${theme.palette.divider}`,
                            }}
                          >
                            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                              Correct Answer
                            </Typography>
                            <Typography variant="body2">{question.correctAnswer}</Typography>
                          </Paper>
                        </Grid>
                        <Grid item xs={12}>
                          <Alert
                            severity={question.isCorrect ? 'success' : 'info'}
                            icon={<HelpIcon />}
                          >
                            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                              AI Feedback
                            </Typography>
                            <Typography variant="body2">{question.feedback}</Typography>
                          </Alert>
                        </Grid>
                        {!question.isCorrect && question.mistakeExplanation && (
                          <Grid item xs={12}>
                            <Paper
                              elevation={0}
                              sx={{
                                p: 2,
                                bgcolor: alpha(theme.palette.warning.main, 0.05),
                                border: `1px solid ${alpha(theme.palette.warning.main, 0.3)}`,
                              }}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <LightbulbIcon
                                  sx={{ color: theme.palette.warning.main, fontSize: 20 }}
                                />
                                <Typography variant="subtitle2" fontWeight={600}>
                                  Understanding Your Mistake
                                </Typography>
                              </Box>
                              <Typography variant="body2">{question.mistakeExplanation}</Typography>
                            </Paper>
                          </Grid>
                        )}
                        {question.improvementTips.length > 0 && (
                          <Grid item xs={12}>
                            <Paper
                              elevation={0}
                              sx={{
                                p: 2,
                                bgcolor: alpha(theme.palette.primary.main, 0.05),
                                border: `1px solid ${theme.palette.divider}`,
                              }}
                            >
                              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                                Tips for Improvement
                              </Typography>
                              <List dense sx={{ py: 0 }}>
                                {question.improvementTips.map((tip, i) => (
                                  <ListItem key={i} sx={{ px: 0 }}>
                                    <TrendingUpIcon
                                      sx={{
                                        mr: 1,
                                        fontSize: 16,
                                        color: theme.palette.primary.main,
                                      }}
                                    />
                                    <ListItemText
                                      primary={tip}
                                      primaryTypographyProps={{ variant: 'body2' }}
                                    />
                                  </ListItem>
                                ))}
                              </List>
                            </Paper>
                          </Grid>
                        )}
                      </Grid>
                    </AccordionDetails>
                  </Accordion>
                ))}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button variant="outlined" onClick={handleReset}>
              Scan Another Homework
            </Button>
          </Box>
        </Grid>
      </Grid>
    );
  };

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Smart Homework Scanner
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Scan your homework for instant AI-powered grading and personalized feedback
      </Typography>

      <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, mb: 3 }}>
        <CardContent>
          <Stepper activeStep={activeStep}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </CardContent>
      </Card>

      {activeStep === 0 && renderCaptureStep()}
      {activeStep === 1 && renderProcessingStep()}
      {activeStep === 2 && renderResultsStep()}
    </Box>
  );
}

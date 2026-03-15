import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Stepper,
  Step,
  StepLabel,
  LinearProgress,
  Radio,
  RadioGroup,
  FormControlLabel,
  Slider,
  Paper,
  Alert,
  CircularProgress,
  useTheme,
  alpha,
  Chip,
  Stack,
} from '@mui/material';
import {
  Psychology as PsychologyIcon,
  Visibility as VisibilityIcon,
  Hearing as HearingIcon,
  TouchApp as TouchIcon,
  MenuBook as BookIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import learningStyleApi from '@/api/learningStyle';
import { LearningStyleQuestion, LearningStyleAnswer } from '@/types/learningStyle';
import PatternRecognitionTask from '@/components/learningStyle/PatternRecognitionTask';
import MemoryRecallTask from '@/components/learningStyle/MemoryRecallTask';
import SpatialReasoningTask from '@/components/learningStyle/SpatialReasoningTask';
import ResultsDashboard from '@/components/learningStyle/ResultsDashboard';

const categoryIcons = {
  visual: <VisibilityIcon />,
  auditory: <HearingIcon />,
  kinesthetic: <TouchIcon />,
  reading_writing: <BookIcon />,
};

export default function LearningStyleAssessment() {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<LearningStyleQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<LearningStyleAnswer[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState<string | number | unknown>('');
  const [startTime, setStartTime] = useState(Date.now());
  const [assessmentComplete, setAssessmentComplete] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profileId, setProfileId] = useState<number | null>(null);

  const studentId = parseInt(localStorage.getItem('user_id') || '1');

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const data = await learningStyleApi.getAssessmentQuestions();
      setQuestions(data);
      setStartTime(Date.now());
    } catch (err) {
      setError('Failed to load assessment questions');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (value: string | number | unknown) => {
    setCurrentAnswer(value);
  };

  const calculateCategoryImpact = (
    question: LearningStyleQuestion,
    answer: string | number | unknown
  ) => {
    const impact: Record<string, number> = {};

    if (question.type === 'scenario' && question.options) {
      const selectedOption = question.options.find((opt) => opt.id === answer);
      if (selectedOption) {
        impact[selectedOption.category] = selectedOption.value;
      }
    } else if (question.type === 'preference' && question.sliderConfig) {
      const numValue = typeof answer === 'number' ? answer : 50;
      question.sliderConfig.categories.forEach((cat) => {
        const distance = Math.abs(numValue - cat.position);
        const score = Math.max(0, 100 - distance);
        impact[cat.category] = score;
      });
    } else if (question.type === 'cognitive') {
      impact[question.category] = typeof answer === 'number' ? answer : 50;
    }

    return impact;
  };

  const handleNext = () => {
    if (currentAnswer !== '' && currentAnswer !== null && currentAnswer !== undefined) {
      const timeTaken = Date.now() - startTime;
      const currentQuestion = questions[currentQuestionIndex];

      const answerData: LearningStyleAnswer = {
        question_id: currentQuestion.id,
        answer: currentAnswer,
        time_taken: timeTaken,
        category_impact: calculateCategoryImpact(currentQuestion, currentAnswer),
      };

      setAnswers([...answers, answerData]);
      setCurrentAnswer('');
      setStartTime(Date.now());

      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      } else {
        handleSubmit([...answers, answerData]);
      }
    }
  };

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      const previousAnswer = answers[currentQuestionIndex - 1];
      if (previousAnswer) {
        setCurrentAnswer(previousAnswer.answer);
      }
    }
  };

  const handleSubmit = async (allAnswers: LearningStyleAnswer[]) => {
    try {
      setSubmitting(true);
      const profile = await learningStyleApi.submitAssessment(studentId, allAnswers);
      setProfileId(profile.id);
      setAssessmentComplete(true);
    } catch (err) {
      setError('Failed to submit assessment');
    } finally {
      setSubmitting(false);
    }
  };

  const renderQuestion = (question: LearningStyleQuestion) => {
    switch (question.type) {
      case 'scenario':
        return (
          <Box>
            {question.scenario && (
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  mb: 3,
                  bgcolor: alpha(theme.palette.primary.main, 0.05),
                  borderLeft: `4px solid ${theme.palette.primary.main}`,
                }}
              >
                <Typography variant="body1" sx={{ fontStyle: 'italic' }}>
                  {question.scenario}
                </Typography>
              </Paper>
            )}
            <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
              {question.question}
            </Typography>
            <RadioGroup value={currentAnswer} onChange={(e) => handleAnswerChange(e.target.value)}>
              <Stack spacing={2}>
                {question.options?.map((option) => (
                  <Paper
                    key={option.id}
                    elevation={0}
                    sx={{
                      border: `2px solid ${
                        currentAnswer === option.id
                          ? theme.palette.primary.main
                          : theme.palette.divider
                      }`,
                      borderRadius: 2,
                      transition: 'all 0.3s',
                      '&:hover': {
                        borderColor: theme.palette.primary.main,
                        bgcolor: alpha(theme.palette.primary.main, 0.02),
                      },
                    }}
                  >
                    <FormControlLabel
                      value={option.id}
                      control={<Radio />}
                      label={option.text}
                      sx={{ p: 2, m: 0, width: '100%' }}
                    />
                  </Paper>
                ))}
              </Stack>
            </RadioGroup>
          </Box>
        );

      case 'preference':
        return (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ mb: 4 }}>
              {question.question}
            </Typography>
            {question.sliderConfig && (
              <Box sx={{ px: 4 }}>
                <Slider
                  value={typeof currentAnswer === 'number' ? currentAnswer : 50}
                  onChange={(_, value) => handleAnswerChange(value)}
                  min={question.sliderConfig.min}
                  max={question.sliderConfig.max}
                  marks={question.sliderConfig.categories.map((cat) => ({
                    value: cat.position,
                    label: cat.category.replace('_', ' ').toUpperCase(),
                  }))}
                  valueLabelDisplay="auto"
                  sx={{ mt: 4, mb: 6 }}
                />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    {question.sliderConfig.leftLabel}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {question.sliderConfig.rightLabel}
                  </Typography>
                </Box>
              </Box>
            )}
          </Box>
        );

      case 'cognitive':
        if (!question.cognitiveTask) return null;

        switch (question.cognitiveTask.taskType) {
          case 'pattern_recognition':
            return (
              <PatternRecognitionTask
                data={question.cognitiveTask.data}
                onComplete={(score) => handleAnswerChange(score)}
                timeLimit={question.cognitiveTask.timeLimit}
              />
            );
          case 'memory_recall':
            return (
              <MemoryRecallTask
                data={question.cognitiveTask.data}
                onComplete={(score) => handleAnswerChange(score)}
                timeLimit={question.cognitiveTask.timeLimit}
              />
            );
          case 'spatial_reasoning':
            return (
              <SpatialReasoningTask
                data={question.cognitiveTask.data}
                onComplete={(score) => handleAnswerChange(score)}
                timeLimit={question.cognitiveTask.timeLimit}
              />
            );
          default:
            return null;
        }

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Box
        sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (assessmentComplete && profileId) {
    return <ResultsDashboard studentId={studentId} profileId={profileId} />;
  }

  if (questions.length === 0) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Alert severity="error">No assessment questions available</Alert>
      </Container>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', py: 4 }}>
      <Container maxWidth="lg">
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <PsychologyIcon sx={{ fontSize: 40, color: 'primary.main' }} />
            <Box>
              <Typography variant="h4" fontWeight={700}>
                Learning Style Assessment
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Discover your unique learning preferences
              </Typography>
            </Box>
          </Box>

          <Box sx={{ mt: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Question {currentQuestionIndex + 1} of {questions.length}
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                {progress.toFixed(0)}% Complete
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Question Card */}
        <Card elevation={3}>
          <CardContent sx={{ p: 4 }}>
            {/* Category Badge */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
              <Chip
                icon={categoryIcons[currentQuestion.category]}
                label={currentQuestion.category.replace('_', ' ').toUpperCase()}
                color="primary"
                variant="outlined"
              />
              <Chip
                label={currentQuestion.type.replace('_', ' ').toUpperCase()}
                size="small"
                sx={{
                  bgcolor: alpha(theme.palette.secondary.main, 0.1),
                  color: 'secondary.main',
                }}
              />
            </Box>

            {/* Question Content */}
            {renderQuestion(currentQuestion)}

            {/* Navigation */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                mt: 4,
                pt: 3,
                borderTop: `1px solid ${theme.palette.divider}`,
              }}
            >
              <Button
                startIcon={<ArrowBackIcon />}
                onClick={handleBack}
                disabled={currentQuestionIndex === 0}
              >
                Back
              </Button>

              <Button
                variant="contained"
                endIcon={
                  currentQuestionIndex === questions.length - 1 ? (
                    <CheckCircleIcon />
                  ) : (
                    <ArrowForwardIcon />
                  )
                }
                onClick={handleNext}
                disabled={
                  currentAnswer === '' ||
                  currentAnswer === null ||
                  currentAnswer === undefined ||
                  submitting
                }
              >
                {submitting ? (
                  <CircularProgress size={24} color="inherit" />
                ) : currentQuestionIndex === questions.length - 1 ? (
                  'Complete Assessment'
                ) : (
                  'Next Question'
                )}
              </Button>
            </Box>
          </CardContent>
        </Card>

        {/* Progress Stepper */}
        <Box sx={{ mt: 4 }}>
          <Stepper activeStep={currentQuestionIndex} alternativeLabel>
            {questions.map((q, index) => (
              <Step key={q.id} completed={index < currentQuestionIndex}>
                <StepLabel
                  StepIconComponent={() => (
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        bgcolor:
                          index <= currentQuestionIndex
                            ? 'primary.main'
                            : alpha(theme.palette.primary.main, 0.2),
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 600,
                      }}
                    >
                      {index < currentQuestionIndex ? (
                        <CheckCircleIcon sx={{ fontSize: 20 }} />
                      ) : (
                        index + 1
                      )}
                    </Box>
                  )}
                />
              </Step>
            ))}
          </Stepper>
        </Box>
      </Container>
    </Box>
  );
}

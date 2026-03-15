export interface EssayPrompt {
  id: string;
  title: string;
  description: string;
  type:
    | 'personal_statement'
    | 'extracurricular'
    | 'community_service'
    | 'leadership'
    | 'career_goals'
    | 'diversity'
    | 'challenge_overcome'
    | 'other';
  wordLimit: number;
  tips: string[];
  commonMistakes: string[];
  exampleEssays: string[];
  popularity: number;
  successRate: number;
}

export interface SavedEssay {
  id: string;
  promptId: string;
  promptTitle: string;
  title: string;
  content: string;
  wordCount: number;
  completionStatus: 'not_started' | 'draft' | 'in_review' | 'completed';
  createdAt: string;
  updatedAt: string;
  versions: EssayVersion[];
  aiSuggestions: AISuggestion[];
  grammarIssues: GrammarIssue[];
  peerReviews: PeerReview[];
  counselorFeedback?: CounselorFeedback;
}

export interface EssayVersion {
  id: string;
  essayId: string;
  versionNumber: number;
  content: string;
  wordCount: number;
  createdAt: string;
  changesSummary: string;
}

export interface AISuggestion {
  id: string;
  type: 'structure' | 'clarity' | 'word_choice' | 'tone' | 'impact' | 'grammar';
  severity: 'low' | 'medium' | 'high';
  suggestion: string;
  originalText: string;
  suggestedText: string;
  location: {
    start: number;
    end: number;
  };
  explanation: string;
  accepted: boolean;
}

export interface GrammarIssue {
  id: string;
  type: 'spelling' | 'grammar' | 'punctuation' | 'style' | 'word_choice';
  message: string;
  shortMessage: string;
  offset: number;
  length: number;
  replacements: string[];
  severity: 'info' | 'warning' | 'error';
  rule: string;
  category: string;
}

export interface PeerReview {
  id: string;
  essayId: string;
  reviewerId: string;
  reviewerName: string;
  reviewerAvatar?: string;
  status: 'assigned' | 'in_progress' | 'completed';
  assignedAt: string;
  completedAt?: string;
  rubricScores: RubricScore[];
  strengthComments: string;
  improvementComments: string;
  grammarSuggestions: string[];
  overallRating: number;
  wouldRecommend: boolean;
}

export interface RubricScore {
  criterion: string;
  score: number;
  maxScore: number;
  weight: number;
  comment?: string;
}

export interface CounselorFeedback {
  id: string;
  essayId: string;
  counselorId: string;
  counselorName: string;
  approved: boolean;
  overallRating: number;
  strengthsHighlighted: string[];
  areasForImprovement: string[];
  specificComments: string;
  suggestedRevisions: string[];
  approvalDate?: string;
  status: 'pending' | 'approved' | 'needs_revision';
}

export interface EssayTemplate {
  id: string;
  title: string;
  description: string;
  promptType: string;
  approach: 'narrative' | 'analytical' | 'reflective' | 'creative' | 'hybrid';
  content: string;
  highlights: string[];
  authorBackground: string;
  outcome: string;
  wordCount: number;
  tags: string[];
  rating: number;
  views: number;
}

export interface EssayAnalytics {
  essayId: string;
  versionsCompared: {
    versionNumber: number;
    date: string;
    wordCount: number;
    readabilityScore: number;
    grammarIssues: number;
    structureScore: number;
    impactScore: number;
  }[];
  improvementMetrics: {
    metric: string;
    initialValue: number;
    currentValue: number;
    change: number;
    trend: 'improving' | 'declining' | 'stable';
  }[];
  timeSpentWriting: number;
  revisionsCount: number;
  peerReviewsReceived: number;
  avgPeerRating: number;
}

export interface AssignedEssayForReview {
  id: string;
  essayId: string;
  essayTitle: string;
  promptTitle: string;
  authorName: string;
  wordCount: number;
  content: string;
  assignedAt: string;
  dueDate: string;
  status: 'assigned' | 'in_progress' | 'completed';
}

export interface EssayFeedbackSummary {
  essayId: string;
  essayTitle: string;
  totalReviews: number;
  avgOverallRating: number;
  aggregatedScores: {
    criterion: string;
    avgScore: number;
    maxScore: number;
  }[];
  commonStrengths: { text: string; count: number }[];
  commonImprovements: { text: string; count: number }[];
  actionableSuggestions: string[];
  reviewersConsensus: string;
}

export interface GrammarCheckRequest {
  text: string;
  language: string;
}

export interface GrammarCheckResponse {
  matches: GrammarIssue[];
  language: {
    code: string;
    name: string;
  };
}

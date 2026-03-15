import type {
  EssayPrompt,
  SavedEssay,
  AISuggestion,
  GrammarIssue,
  EssayTemplate,
  EssayAnalytics,
  AssignedEssayForReview,
  EssayFeedbackSummary,
} from '@/types/scholarshipEssay';

export const mockPrompts: EssayPrompt[] = [
  {
    id: '1',
    title: 'Tell us your story',
    description:
      'Some students have a background, identity, interest, or talent that is so meaningful they believe their application would be incomplete without it.',
    type: 'personal_statement',
    wordLimit: 650,
    tips: [
      'Be authentic and genuine',
      "Show, don't tell - use specific examples",
      'Connect your story to your future goals',
    ],
    commonMistakes: [
      'Being too generic or vague',
      'Not connecting to larger themes',
      'Trying to cover too many topics',
    ],
    exampleEssays: ['essay1', 'essay2'],
    popularity: 95,
    successRate: 78,
  },
  {
    id: '2',
    title: 'Overcoming Challenges',
    description:
      'The lessons we take from obstacles we encounter can be fundamental to later success. Recount a time when you faced a challenge, setback, or failure.',
    type: 'challenge_overcome',
    wordLimit: 650,
    tips: [
      'Focus on what you learned',
      'Show resilience and growth',
      'Be specific about the challenge',
    ],
    commonMistakes: [
      'Dwelling too much on the problem',
      'Not showing personal growth',
      "Choosing a challenge that's too trivial",
    ],
    exampleEssays: ['essay3'],
    popularity: 88,
    successRate: 82,
  },
  {
    id: '3',
    title: 'Community Impact',
    description:
      'Describe a time when you made a meaningful contribution to others in which the greater good was your focus.',
    type: 'community_service',
    wordLimit: 500,
    tips: [
      'Emphasize impact over hours',
      'Show leadership and initiative',
      'Connect to personal values',
    ],
    commonMistakes: [
      'Just listing activities',
      'Not showing genuine passion',
      'Ignoring the impact on yourself',
    ],
    exampleEssays: [],
    popularity: 76,
    successRate: 75,
  },
];

export const mockEssays: SavedEssay[] = [
  {
    id: 'e1',
    promptId: '1',
    promptTitle: 'Tell us your story',
    title: 'My Journey with Robotics',
    content:
      'The smell of burnt solder and the whir of servos have become the soundtrack to my high school years...',
    wordCount: 487,
    completionStatus: 'draft',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-03-10T14:30:00Z',
    versions: [],
    aiSuggestions: [],
    grammarIssues: [],
    peerReviews: [],
  },
  {
    id: 'e2',
    promptId: '2',
    promptTitle: 'Overcoming Challenges',
    title: 'Learning to Lead Through Failure',
    content:
      'Standing in front of my team after our robot failed to qualify, I felt the weight of responsibility...',
    wordCount: 612,
    completionStatus: 'in_review',
    createdAt: '2024-02-01T09:00:00Z',
    updatedAt: '2024-03-12T16:45:00Z',
    versions: [],
    aiSuggestions: [],
    grammarIssues: [],
    peerReviews: [],
  },
];

export const mockTemplates: EssayTemplate[] = [
  {
    id: 't1',
    title: "The Immigrant's Perspective",
    description: 'A powerful narrative about cultural identity and adaptation',
    promptType: 'personal_statement',
    approach: 'narrative',
    content:
      'I was seven years old when I first tasted American chocolate. The sweetness was overwhelming...',
    highlights: [
      'Strong opening hook with sensory details',
      'Clear narrative arc showing growth',
      'Effective use of cultural contrast',
    ],
    authorBackground: 'First-generation immigrant student, admitted to Stanford',
    outcome: 'Received full scholarship to Stanford University',
    wordCount: 645,
    tags: ['immigrant', 'cultural-identity', 'family', 'adaptation'],
    rating: 4.8,
    views: 1234,
  },
  {
    id: 't2',
    title: 'From Failure to Innovation',
    description: 'An analytical approach to discussing a major setback',
    promptType: 'challenge_overcome',
    approach: 'analytical',
    content:
      'The notification came at 11:47 PM: "Your project submission has been rejected." Three months of work...',
    highlights: [
      'Specific, concrete examples',
      'Clear analysis of lessons learned',
      'Connection to future goals',
    ],
    authorBackground: 'Computer Science student, admitted to MIT',
    outcome: 'Awarded Gates Scholarship',
    wordCount: 598,
    tags: ['failure', 'resilience', 'innovation', 'STEM'],
    rating: 4.9,
    views: 987,
  },
];

export const mockAssignedEssays: AssignedEssayForReview[] = [
  {
    id: 'a1',
    essayId: 'e1',
    essayTitle: 'My Journey with Robotics',
    promptTitle: 'Tell us your story',
    authorName: 'Sarah Johnson',
    wordCount: 487,
    content:
      "The smell of burnt solder and the whir of servos have become the soundtrack to my high school years. When I joined the robotics club as a freshman, I barely knew the difference between a motor and a servo. Four years later, I'm leading our team to nationals...",
    assignedAt: '2024-03-10T09:00:00Z',
    dueDate: '2024-03-17T23:59:59Z',
    status: 'assigned',
  },
];

export const mockFeedbackSummary: EssayFeedbackSummary = {
  essayId: 'e2',
  essayTitle: 'Learning to Lead Through Failure',
  totalReviews: 3,
  avgOverallRating: 4.3,
  aggregatedScores: [
    { criterion: 'Content & Relevance', avgScore: 8.7, maxScore: 10 },
    { criterion: 'Structure & Organization', avgScore: 7.8, maxScore: 10 },
    { criterion: 'Writing Quality', avgScore: 8.2, maxScore: 10 },
    { criterion: 'Personal Voice & Authenticity', avgScore: 9.1, maxScore: 10 },
    { criterion: 'Impact & Persuasiveness', avgScore: 8.5, maxScore: 10 },
  ],
  commonStrengths: [
    { text: 'Authentic voice and genuine reflection', count: 3 },
    { text: 'Clear demonstration of leadership growth', count: 2 },
    { text: 'Strong conclusion tying back to opening', count: 2 },
  ],
  commonImprovements: [
    { text: 'Could provide more specific examples in the middle section', count: 2 },
    { text: 'Transition between paragraphs could be smoother', count: 2 },
  ],
  actionableSuggestions: [
    'Add a specific anecdote in paragraph 3 to illustrate the leadership challenge',
    'Consider restructuring the second paragraph for better flow',
    'Strengthen the connection between the failure and long-term goals',
  ],
  reviewersConsensus:
    'This is a strong essay with authentic voice and clear growth narrative. Minor revisions to improve flow and add specific details would make it excellent.',
};

export const mockAnalytics: EssayAnalytics = {
  essayId: 'e2',
  versionsCompared: [
    {
      versionNumber: 1,
      date: '2024-02-01T09:00:00Z',
      wordCount: 423,
      readabilityScore: 65,
      grammarIssues: 12,
      structureScore: 68,
      impactScore: 70,
    },
    {
      versionNumber: 2,
      date: '2024-02-15T14:30:00Z',
      wordCount: 567,
      readabilityScore: 72,
      grammarIssues: 7,
      structureScore: 75,
      impactScore: 78,
    },
    {
      versionNumber: 3,
      date: '2024-03-12T16:45:00Z',
      wordCount: 612,
      readabilityScore: 82,
      grammarIssues: 2,
      structureScore: 85,
      impactScore: 88,
    },
  ],
  improvementMetrics: [
    {
      metric: 'Readability Score',
      initialValue: 65,
      currentValue: 82,
      change: 26,
      trend: 'improving',
    },
    {
      metric: 'Grammar Issues',
      initialValue: 12,
      currentValue: 2,
      change: -83,
      trend: 'improving',
    },
    {
      metric: 'Structure Score',
      initialValue: 68,
      currentValue: 85,
      change: 25,
      trend: 'improving',
    },
    {
      metric: 'Impact Score',
      initialValue: 70,
      currentValue: 88,
      change: 26,
      trend: 'improving',
    },
  ],
  timeSpentWriting: 720,
  revisionsCount: 3,
  peerReviewsReceived: 3,
  avgPeerRating: 4.3,
};

export const mockAISuggestions: AISuggestion[] = [
  {
    id: 'ai1',
    type: 'word_choice',
    severity: 'medium',
    suggestion: 'Consider using a more powerful verb here',
    originalText: 'I felt really bad',
    suggestedText: 'I was devastated',
    location: { start: 145, end: 161 },
    explanation: 'Stronger verbs create more vivid imagery and emotional impact',
    accepted: false,
  },
  {
    id: 'ai2',
    type: 'structure',
    severity: 'high',
    suggestion: 'This paragraph could be split for better readability',
    originalText: '',
    suggestedText: '',
    location: { start: 234, end: 467 },
    explanation: 'Breaking long paragraphs improves flow and keeps readers engaged',
    accepted: false,
  },
];

export const mockGrammarIssues: GrammarIssue[] = [
  {
    id: 'g1',
    type: 'grammar',
    message: 'Possible agreement error',
    shortMessage: 'Agreement error',
    offset: 234,
    length: 8,
    replacements: ['were'],
    severity: 'error',
    rule: 'subject_verb_agreement',
    category: 'grammar',
  },
  {
    id: 'g2',
    type: 'spelling',
    message: 'Possible spelling mistake',
    shortMessage: 'Spelling',
    offset: 456,
    length: 7,
    replacements: ['receive', 'receiver'],
    severity: 'warning',
    rule: 'spelling',
    category: 'typos',
  },
];

export interface LearningStyleQuestion {
  id: number;
  type: 'scenario' | 'preference' | 'cognitive';
  question: string;
  category: 'visual' | 'auditory' | 'kinesthetic' | 'reading_writing';
  scenario?: string;
  options?: {
    id: string;
    text: string;
    value: number;
    category: string;
  }[];
  sliderConfig?: {
    min: number;
    max: number;
    leftLabel: string;
    rightLabel: string;
    categories: { position: number; category: string }[];
  };
  cognitiveTask?: {
    taskType: 'pattern_recognition' | 'memory_recall' | 'spatial_reasoning';
    data: unknown;
    timeLimit?: number;
  };
}

export interface LearningStyleProfile {
  id: number;
  student_id: number;
  visual_score: number;
  auditory_score: number;
  kinesthetic_score: number;
  reading_writing_score: number;
  primary_style: string;
  secondary_style?: string;
  preferences: {
    preferred_formats: string[];
    study_environment: string;
    interaction_preference: string;
  };
  completed_at: string;
  created_at: string;
  updated_at: string;
}

export interface LearningStyleAnswer {
  question_id: number;
  answer: string | number | unknown;
  time_taken: number;
  category_impact: {
    visual?: number;
    auditory?: number;
    kinesthetic?: number;
    reading_writing?: number;
  };
}

export interface StudyTip {
  id: number;
  learning_style: string;
  category: string;
  title: string;
  description: string;
  examples: string[];
  icon?: string;
}

export interface AdaptiveContent {
  id: number;
  title: string;
  description: string;
  subject: string;
  topic: string;
  formats: {
    video?: ContentFormat;
    article?: ContentFormat;
    audio?: ContentFormat;
    activity?: ContentFormat;
  };
  recommended_for: string[];
  difficulty_level: number;
  estimated_time: number;
  tags: string[];
  created_at: string;
}

export interface ContentFormat {
  id: string;
  url: string;
  duration?: number;
  pages?: number;
  type: 'video' | 'article' | 'audio' | 'activity';
  thumbnail?: string;
  description?: string;
}

export interface ContentEffectiveness {
  student_id: number;
  content_id: number;
  format: string;
  completion_rate: number;
  time_spent: number;
  quiz_score?: number;
  engagement_score: number;
  last_accessed: string;
}

export interface ClassLearningStyleDistribution {
  class_id: number;
  class_name: string;
  total_students: number;
  distribution: {
    visual: number;
    auditory: number;
    kinesthetic: number;
    reading_writing: number;
  };
  recommendations: string[];
}

export interface ParentLearningGuide {
  student_id: number;
  student_name: string;
  primary_style: string;
  secondary_style?: string;
  strengths: string[];
  challenges: string[];
  home_strategies: {
    category: string;
    strategies: string[];
  }[];
  environment_setup: {
    lighting: string;
    noise: string;
    workspace: string;
    materials: string[];
  };
  communication_tips: string[];
}

export interface AssessmentProgress {
  total_questions: number;
  answered_questions: number;
  current_category: string;
  time_elapsed: number;
  estimated_time_remaining: number;
}

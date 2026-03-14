export interface LearningResource {
  id: number;
  title: string;
  description: string;
  resource_type: 'video' | 'article' | 'quiz' | 'practice' | 'pdf' | 'interactive' | 'live_session';
  subject: string;
  topic: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimated_time: number; // in minutes
  thumbnail_url?: string;
  content_url: string;
  created_at: string;
  updated_at: string;

  // Ratings and feedback
  average_rating: number;
  total_ratings: number;
  helpful_count: number;
  not_helpful_count: number;

  // User interaction
  is_completed?: boolean;
  is_bookmarked?: boolean;
  user_rating?: number;
  user_feedback?: 'helpful' | 'not_helpful';
  progress_percentage?: number;

  // Metadata
  tags: string[];
  prerequisites?: string[];
  learning_objectives?: string[];
  author_name?: string;
  is_curated?: boolean;
  curator_name?: string;
  curator_annotation?: string;
}

export interface RecommendationCategory {
  id: string;
  title: string;
  description: string;
  category_type: 'for_you' | 'struggled_with' | 'similar_students' | 'trending' | 'curated';
  resources: LearningResource[];
  reason?: string; // Why this recommendation
  struggle_topic?: string; // For struggled_with category
  metadata?: {
    confidence_score?: number;
    based_on?: string[];
  };
}

export interface LearningPlaylist {
  id: number;
  name: string;
  description?: string;
  resources: LearningResource[];
  created_at: string;
  updated_at: string;
  is_default?: boolean;
  total_duration: number; // in minutes
  completed_count: number;
  total_count: number;
}

export interface ContentFeedback {
  resource_id: number;
  feedback_type: 'helpful' | 'not_helpful';
  rating?: number;
  comment?: string;
  tags?: string[];
}

export interface FilterOptions {
  subjects: string[];
  formats: string[];
  difficulties: string[];
  duration_ranges: {
    label: string;
    min: number;
    max: number;
  }[];
}

export interface ContentFilters {
  subjects?: string[];
  formats?: string[];
  difficulties?: string[];
  duration_min?: number;
  duration_max?: number;
  show_completed?: boolean;
  show_curated_only?: boolean;
}

export interface TeacherCuratedCollection {
  id: number;
  title: string;
  description: string;
  teacher_name: string;
  teacher_id: number;
  subject: string;
  grade_level?: string;
  resources: LearningResource[];
  created_at: string;
  updated_at: string;
  is_featured?: boolean;
  total_students_enrolled?: number;
}

export interface LearningProgress {
  resource_id: number;
  progress_percentage: number;
  last_accessed: string;
  time_spent: number; // in minutes
  is_completed: boolean;
}

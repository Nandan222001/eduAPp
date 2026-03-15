export interface Recognition {
  id: number;
  sender_id: number;
  sender_name: string;
  sender_avatar?: string;
  recipient_id: number;
  recipient_name: string;
  recipient_avatar?: string;
  recognition_type: RecognitionType;
  message: string;
  is_public: boolean;
  likes_count: number;
  is_liked_by_user: boolean;
  is_flagged: boolean;
  flag_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface RecognitionCreate {
  recipient_id: number;
  recognition_type: RecognitionType;
  message: string;
  is_public: boolean;
}

export interface RecognitionUpdate {
  message?: string;
  is_public?: boolean;
}

export type RecognitionType =
  | 'academic_excellence'
  | 'helpful_peer'
  | 'team_player'
  | 'creative_thinker'
  | 'leadership'
  | 'kindness'
  | 'perseverance'
  | 'improvement';

export interface RecognitionTypeInfo {
  type: RecognitionType;
  label: string;
  description: string;
  icon: string;
  color: string;
}

export interface RecognitionStats {
  total_received: number;
  total_sent: number;
  by_category: Record<RecognitionType, number>;
  recent_trend: 'up' | 'down' | 'stable';
  weekly_count: number;
  monthly_count: number;
}

export interface StudentSpotlight {
  student_id: number;
  student_name: string;
  student_avatar?: string;
  recognition_count: number;
  most_common_type: RecognitionType;
  recent_recognitions: Recognition[];
}

export interface RecognitionListParams {
  skip?: number;
  limit?: number;
  recipient_id?: number;
  sender_id?: number;
  recognition_type?: RecognitionType;
  is_public?: boolean;
  is_flagged?: boolean;
  search?: string;
}

export interface RecognitionListResponse {
  items: Recognition[];
  total: number;
  skip: number;
  limit: number;
}

export interface RecognitionFlag {
  recognition_id: number;
  reason: string;
  description?: string;
}

export interface RecognitionModeration {
  id: number;
  recognition: Recognition;
  flag_count: number;
  flags: Array<{
    id: number;
    user_id: number;
    user_name: string;
    reason: string;
    description?: string;
    created_at: string;
  }>;
  status: 'pending' | 'approved' | 'removed';
  reviewed_by?: number;
  reviewed_at?: string;
  review_notes?: string;
}

export interface RecognitionNotificationPreference {
  instant: boolean;
  daily_digest: boolean;
  weekly_summary: boolean;
  email_enabled: boolean;
  push_enabled: boolean;
}

export interface SchoolCultureAnalytics {
  total_recognitions: number;
  active_participants: number;
  participation_rate: number;
  recognition_trend: Array<{
    date: string;
    count: number;
  }>;
  by_type: Record<RecognitionType, number>;
  by_grade: Record<string, number>;
  top_senders: Array<{
    student_id: number;
    student_name: string;
    count: number;
  }>;
  top_recipients: Array<{
    student_id: number;
    student_name: string;
    count: number;
  }>;
  climate_correlation?: {
    recognition_score: number;
    climate_score: number;
    correlation: number;
  };
}

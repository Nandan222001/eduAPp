export interface ChildBasicInfo {
  id: number;
  first_name: string;
  last_name: string;
  admission_number?: string;
  photo_url?: string;
  section_name?: string;
  grade_name?: string;
}

export interface AttendanceStats {
  total_days: number;
  present_days: number;
  absent_days: number;
  late_days: number;
  half_days: number;
  attendance_percentage: number;
}

export interface ChildOverview {
  id: number;
  first_name: string;
  last_name: string;
  admission_number?: string;
  photo_url?: string;
  section_name?: string;
  grade_name?: string;
  attendance_percentage: number;
  current_rank?: number;
  average_score?: number;
  total_students?: number;
  attendance_status?: string;
}

export interface TodayAttendance {
  date: string;
  status?: string;
  is_absent: boolean;
  is_present: boolean;
  is_late: boolean;
  is_half_day: boolean;
  alert_sent: boolean;
  remarks?: string;
}

export interface RecentGrade {
  subject_name: string;
  exam_name: string;
  exam_type: string;
  marks_obtained: number;
  total_marks: number;
  percentage: number;
  grade?: string;
  exam_date: string;
  rank?: number;
}

export interface PendingAssignment {
  id: number;
  title: string;
  subject_name: string;
  due_date: string;
  days_remaining: number;
  description?: string;
  max_marks: number;
  is_overdue: boolean;
}

export interface SubjectPerformance {
  subject_name: string;
  average_score: number;
  total_assignments: number;
  completed_assignments: number;
  pending_assignments: number;
  attendance_percentage: number;
}

export interface WeeklyProgress {
  week_start: string;
  week_end: string;
  attendance_days: number;
  present_days: number;
  assignments_completed: number;
  assignments_pending: number;
  average_score?: number;
  subject_performance: SubjectPerformance[];
}

export interface TermPerformance {
  term_name: string;
  subject_name: string;
  average_marks: number;
  total_marks: number;
  percentage: number;
  grade?: string;
}

export interface PerformanceComparison {
  current_term: string;
  previous_term: string;
  current_term_data: TermPerformance[];
  previous_term_data: TermPerformance[];
  improvement_subjects: string[];
  declined_subjects: string[];
  overall_improvement: number;
}

export interface GoalProgress {
  id: number;
  title: string;
  description?: string;
  goal_type: string;
  target_value: number;
  current_value: number;
  progress_percentage: number;
  status: string;
  start_date: string;
  end_date: string;
  days_remaining: number;
}

export interface TeacherMessage {
  id: number;
  teacher_name: string;
  subject?: string;
  content: string;
  created_at: string;
  is_read: boolean;
}

export interface ParentDashboard {
  parent_info: {
    id: number;
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string;
    photo_url?: string;
  };
  children: ChildBasicInfo[];
  selected_child?: ChildOverview;
  today_attendance?: TodayAttendance;
  attendance_stats?: AttendanceStats;
  recent_grades: RecentGrade[];
  pending_assignments: PendingAssignment[];
  weekly_progress?: WeeklyProgress;
  goals: GoalProgress[];
  teacher_messages: TeacherMessage[];
  performance_comparison?: PerformanceComparison;
}

export interface FamilyOverviewMetrics {
  total_children: number;
  total_assignments_due: number;
  upcoming_events_count: number;
  average_attendance: number;
  children_metrics: {
    child_id: number;
    child_name: string;
    assignments_due: number;
    attendance_percentage: number;
    average_score: number;
  }[];
}

export interface FamilyCalendarEvent {
  id: number;
  child_id: number;
  child_name: string;
  title: string;
  event_type: 'assignment' | 'exam' | 'event' | 'meeting' | 'holiday';
  start_date: string;
  end_date: string;
  description?: string;
  color?: string;
  status?: string;
  location?: string;
}

export interface ComparativePerformanceData {
  child_id: number;
  child_name: string;
  subjects: {
    subject_name: string;
    average_score: number;
    assignments_completed: number;
    attendance_percentage: number;
  }[];
}

export interface FamilyNotification {
  id: number;
  child_id: number;
  child_name: string;
  notification_type: string;
  title: string;
  message: string;
  priority: string;
  created_at: string;
  is_read: boolean;
  data?: Record<string, unknown>;
}

export interface FamilyNotificationDigest {
  date: string;
  notifications: FamilyNotification[];
  summary: {
    total_count: number;
    by_child: Record<number, number>;
    by_type: Record<string, number>;
    unread_count: number;
  };
}

export interface BulkFeePaymentRequest {
  student_ids: number[];
  fee_structure_id: number;
  payment_method: string;
  amount: number;
  payment_date: string;
}

export interface BulkFeePaymentResponse {
  successful_payments: number[];
  failed_payments: { student_id: number; error: string }[];
  total_amount: number;
  transaction_ids: string[];
}

export interface BulkEventRSVPRequest {
  student_ids: number[];
  event_id: number;
  status: string;
  number_of_guests?: number;
  remarks?: string;
}

export interface SharedFamilyInfo {
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  secondary_emergency_contact_name?: string;
  secondary_emergency_contact_phone?: string;
}

export interface SiblingLinkRequest {
  parent_id: number;
  student_ids: number[];
}

export interface PrivacySettings {
  id: number;
  parent_id: number;
  disable_sibling_comparisons: boolean;
  hide_performance_rankings: boolean;
  hide_attendance_from_siblings: boolean;
  allow_data_sharing: boolean;
  updated_at: string;
}

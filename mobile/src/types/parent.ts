export interface Child {
  id: number;
  first_name: string;
  last_name: string;
  photo_url?: string;
  grade: string;
  class_name: string;
  roll_number?: string;
  student_id: string;
}

export interface ChildStats {
  attendance_percentage: number;
  rank?: number;
  average_score: number;
  total_subjects: number;
}

export interface AttendanceRecord {
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  subject?: string;
  notes?: string;
}

export interface TodayAttendance {
  child_id: number;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused' | 'not_marked';
  marked_at?: string;
  marked_by?: string;
}

export interface Grade {
  id: number;
  subject_name: string;
  exam_name: string;
  exam_type: string;
  marks_obtained: number;
  total_marks: number;
  percentage: number;
  grade: string;
  date: string;
  term?: string;
}

export interface Assignment {
  id: number;
  title: string;
  subject_name: string;
  due_date: string;
  status: 'pending' | 'submitted' | 'graded' | 'overdue';
  marks_obtained?: number;
  total_marks?: number;
}

export interface FeePayment {
  id: number;
  child_id: number;
  fee_type: string;
  amount: number;
  due_date: string;
  paid_date?: string;
  status: 'paid' | 'pending' | 'overdue' | 'partial';
  balance?: number;
}

export interface TeacherMessage {
  id: number;
  sender_name: string;
  sender_role: string;
  subject: string;
  message: string;
  sent_at: string;
  read: boolean;
  priority?: 'low' | 'medium' | 'high';
}

export interface Announcement {
  id: number;
  title: string;
  content: string;
  posted_by: string;
  posted_at: string;
  category: string;
  is_important: boolean;
  attachments?: string[];
}

export interface AttendanceCalendar {
  [date: string]: AttendanceRecord;
}

export interface SubjectAttendance {
  subject_name: string;
  present_count: number;
  total_count: number;
  percentage: number;
}

export interface ExamResult {
  id: number;
  exam_name: string;
  term: string;
  total_marks: number;
  marks_obtained: number;
  percentage: number;
  rank?: number;
  subjects: ExamSubjectResult[];
}

export interface ExamSubjectResult {
  subject_name: string;
  marks_obtained: number;
  total_marks: number;
  percentage: number;
  grade: string;
}

export interface SubjectPerformance {
  subject_name: string;
  average_score: number;
  highest_score: number;
  lowest_score: number;
  total_exams: number;
  trend: 'improving' | 'declining' | 'stable';
}

export interface ParentState {
  children: Child[];
  selectedChildId: number | null;
  childStats: { [childId: number]: ChildStats };
  todayAttendance: { [childId: number]: TodayAttendance };
  recentGrades: { [childId: number]: Grade[] };
  pendingAssignments: { [childId: number]: Assignment[] };
  feePayments: { [childId: number]: FeePayment[] };
  messages: TeacherMessage[];
  announcements: Announcement[];
  attendanceCalendar: { [childId: number]: AttendanceCalendar };
  subjectAttendance: { [childId: number]: SubjectAttendance[] };
  examResults: { [childId: number]: ExamResult[] };
  subjectPerformance: { [childId: number]: SubjectPerformance[] };
  isLoading: boolean;
  error: string | null;
}

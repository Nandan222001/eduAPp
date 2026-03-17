export interface Child {
  id: number;
  firstName: string;
  lastName: string;
  studentId: string;
  grade: string;
  section: string;
  profilePhoto?: string;
  dateOfBirth?: string;
}

export interface ChildAttendanceRecord {
  date: string;
  status: 'present' | 'absent' | 'late';
  subject?: string;
  remarks?: string;
}

export interface ChildAttendanceSummary {
  totalClasses: number;
  attendedClasses: number;
  percentage: number;
  todayStatus: 'present' | 'absent' | 'late' | 'not_marked';
  monthlyRecords: ChildAttendanceRecord[];
  lastUpdated: string;
}

export interface ChildGrade {
  id: number;
  examName: string;
  subject: string;
  subjectCode: string;
  totalMarks: number;
  obtainedMarks: number;
  percentage: number;
  grade: string;
  examDate: string;
  term: string;
}

export interface ChildGradesSummary {
  overallPercentage: number;
  overallGrade: string;
  subjectGrades: {
    subject: string;
    percentage: number;
    grade: string;
    trend: 'improving' | 'stable' | 'declining';
  }[];
  recentGrades: ChildGrade[];
  termComparison: {
    term: string;
    percentage: number;
  }[];
}

export interface FeePaymentStatus {
  totalFees: number;
  paidAmount: number;
  pendingAmount: number;
  dueDate: string;
  status: 'paid' | 'pending' | 'overdue';
  lastPaymentDate?: string;
  lastPaymentAmount?: number;
}

export interface AttendanceAlert {
  childId: number;
  childName: string;
  status: 'absent' | 'late';
  date: string;
  subject?: string;
  remarks?: string;
}

export interface ParentDashboardData {
  children: Child[];
  aggregatedAttendance: {
    childId: number;
    childName: string;
    percentage: number;
    todayStatus: 'present' | 'absent' | 'late' | 'not_marked';
  }[];
  recentGrades: {
    childId: number;
    childName: string;
    subject: string;
    examName: string;
    obtainedMarks: number;
    totalMarks: number;
    percentage: number;
    grade: string;
    examDate: string;
  }[];
  todayAlerts: AttendanceAlert[];
  feePayments: {
    childId: number;
    childName: string;
    status: FeePaymentStatus;
  }[];
}

export interface TeacherMessage {
  id: number;
  threadId: number;
  senderId: number;
  senderName: string;
  senderRole: 'parent' | 'teacher';
  recipientId: number;
  recipientName: string;
  subject: string;
  message: string;
  sentAt: string;
  readAt?: string;
  isRead: boolean;
}

export interface MessageThread {
  id: number;
  childId: number;
  childName: string;
  teacherId: number;
  teacherName: string;
  subject: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  messages: TeacherMessage[];
}

export interface SendMessageData {
  childId: number;
  teacherId: number;
  subject: string;
  message: string;
  threadId?: number;
}

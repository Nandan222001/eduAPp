export interface Profile {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  profilePhoto?: string;
  studentId?: string;
  dateOfBirth?: string;
  phone?: string;
}

export interface StudentProfile {
  id: number;
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  studentId: string;
  rollNumber?: string;
  dateOfBirth?: string;
  phone?: string;
  profilePhoto?: string;
  address?: string;
  classId?: number;
  className?: string;
  sectionId?: number;
  sectionName?: string;
  admissionDate?: string;
  bloodGroup?: string;
  gender?: string;
  parentName?: string;
  parentPhone?: string;
  parentEmail?: string;
}

export interface PerformanceSummary {
  overallPercentage: number;
  overallGrade: string;
  rank?: number;
  totalStudents?: number;
  subjectPerformance: SubjectPerformance[];
  trend: 'improving' | 'stable' | 'declining';
  attendancePercentage: number;
  assignmentCompletionRate: number;
  recentExams: RecentExam[];
  strengths: string[];
  weaknesses: string[];
}

export interface SubjectPerformance {
  subjectId: number;
  subjectName: string;
  averageScore: number;
  totalTests: number;
  bestScore: number;
  worstScore: number;
  trend: 'up' | 'down' | 'stable';
}

export interface RecentExam {
  id: number;
  examName: string;
  subject: string;
  totalMarks: number;
  obtainedMarks: number;
  percentage: number;
  date: string;
}

export interface Assignment {
  id: number;
  title: string;
  description: string;
  dueDate: string;
  subject: string;
  subjectCode?: string;
  teacherName?: string;
  status: 'pending' | 'submitted' | 'graded' | 'overdue';
  totalMarks?: number;
  obtainedMarks?: number;
  submittedAt?: string;
  feedback?: string;
  attachments?: {
    id: number;
    fileName: string;
    fileUrl: string;
    fileType: string;
    fileSize: number;
  }[];
  createdAt?: string;
}

export interface Grade {
  id: number;
  examName: string;
  subject: string;
  totalMarks: number;
  obtainedMarks: number;
  percentage: number;
  grade: string;
  examDate: string;
  remarks?: string;
}

export interface AIPrediction {
  predictedPercentage: number;
  confidence: number;
  trend: 'improving' | 'stable' | 'declining';
  lastUpdated: string;
  nextMilestone?: {
    target: number;
    daysRemaining: number;
  };
}

export interface WeakArea {
  id: number;
  topic: string;
  subject: string;
  score: number;
  difficulty: 'easy' | 'medium' | 'hard';
  recommendedResources: number;
  lastPracticed?: string;
}

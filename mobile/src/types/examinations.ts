export interface Exam {
  id: number;
  name: string;
  description?: string;
  examType: 'unit_test' | 'midterm' | 'final' | 'quiz' | 'practical' | 'assignment';
  startDate: string;
  endDate: string;
  duration?: number;
  totalMarks: number;
  passingMarks: number;
  subjectId: number;
  subjectName: string;
  classId: number;
  className: string;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  venue?: string;
  instructions?: string;
  syllabusTopics?: string[];
  createdAt: string;
}

export interface ExamResult {
  id: number;
  examId: number;
  examName: string;
  studentId: number;
  subjectId: number;
  subjectName: string;
  totalMarks: number;
  obtainedMarks: number;
  percentage: number;
  grade: string;
  rank?: number;
  classAverage?: number;
  highestMarks?: number;
  lowestMarks?: number;
  remarks?: string;
  publishedDate?: string;
  sectionBreakdown?: SectionBreakdown[];
}

export interface SectionBreakdown {
  sectionName: string;
  maxMarks: number;
  obtainedMarks: number;
  percentage: number;
}

export interface Marksheet {
  studentId: number;
  studentName: string;
  rollNumber: string;
  className: string;
  sectionName: string;
  examName: string;
  examDate: string;
  academicYear: string;
  results: ExamResult[];
  totalMarks: number;
  totalObtained: number;
  overallPercentage: number;
  overallGrade: string;
  rank?: number;
  totalStudents?: number;
  attendance?: number;
  remarks?: string;
  publishedDate: string;
}

export interface ExamSchedule {
  examId: number;
  examName: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  subjectId: number;
  subjectName: string;
  subjectCode?: string;
  venue?: string;
  invigilator?: string;
  instructions?: string;
  syllabusTopics?: string[];
}

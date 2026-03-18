export interface AttendanceSummary {
  totalClasses: number;
  attendedClasses: number;
  absentClasses: number;
  lateClasses: number;
  percentage: number;
  monthlyPercentage: number;
  todayStatus: 'present' | 'absent' | 'late' | 'not_marked';
  subjectWiseAttendance: SubjectAttendance[];
}

export interface SubjectAttendance {
  subjectId: number;
  subjectName: string;
  totalClasses: number;
  attendedClasses: number;
  percentage: number;
}

export interface AttendanceHistory {
  date: string;
  status: 'present' | 'absent' | 'late';
  markedBy?: string;
  remarks?: string;
  sessions: AttendanceSession[];
}

export interface AttendanceSession {
  id: number;
  period: number;
  subject: string;
  subjectCode?: string;
  status: 'present' | 'absent' | 'late';
  teacher: string;
  startTime: string;
  endTime: string;
  remarks?: string;
}

export interface AttendanceRecord {
  id: number;
  studentId: number;
  classId: number;
  date: string;
  status: 'present' | 'absent' | 'late';
  period?: number;
  subject?: string;
  markedBy?: string;
  markedAt?: string;
  remarks?: string;
}

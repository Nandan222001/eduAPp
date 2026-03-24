import { demoDataApi, isDemoUser } from '../demoDataApi';
import { useAuthStore } from '@store/authStore';
import { dummyData, demoStudentUser, demoParentUser } from '../../data/dummyData';
import { studentApi } from '../student';
import { parentApi } from '../parent';

jest.mock('@store/authStore');
jest.mock('../student');
jest.mock('../parent');

describe('demoDataApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('isDemoUser helper', () => {
    it('should return true for demo student user', () => {
      (useAuthStore.getState as jest.Mock).mockReturnValue({
        user: { email: 'demo@example.com' },
      });

      const result = isDemoUser();

      expect(result).toBe(true);
    });

    it('should return true for demo parent user', () => {
      (useAuthStore.getState as jest.Mock).mockReturnValue({
        user: { email: 'parent@demo.com' },
      });

      const result = isDemoUser();

      expect(result).toBe(true);
    });

    it('should return false for non-demo user', () => {
      (useAuthStore.getState as jest.Mock).mockReturnValue({
        user: { email: 'user@example.com' },
      });

      const result = isDemoUser();

      expect(result).toBe(false);
    });

    it('should return false when user is null', () => {
      (useAuthStore.getState as jest.Mock).mockReturnValue({
        user: null,
      });

      const result = isDemoUser();

      expect(result).toBe(false);
    });

    it('should return false when user is undefined', () => {
      (useAuthStore.getState as jest.Mock).mockReturnValue({});

      const result = isDemoUser();

      expect(result).toBe(false);
    });

    it('should be case-sensitive for demo email check', () => {
      (useAuthStore.getState as jest.Mock).mockReturnValue({
        user: { email: 'Demo@Example.com' },
      });

      const result = isDemoUser();

      expect(result).toBe(false);
    });
  });

  describe('student wrapper functions', () => {
    describe('getDashboard', () => {
      it('should return properly typed Promise-wrapped demo data for demo user', async () => {
        (useAuthStore.getState as jest.Mock).mockReturnValue({
          user: { email: 'demo@example.com' },
        });

        const result = await demoDataApi.student.getDashboard();

        expect(result).toHaveProperty('attendance');
        expect(result).toHaveProperty('upcomingAssignments');
        expect(result).toHaveProperty('recentGrades');
        expect(result).toHaveProperty('aiPredictions');
        expect(result).toHaveProperty('weakAreas');
        expect(result).toHaveProperty('gamification');
        expect(result.attendance).toEqual(dummyData.students.demo.attendance.summary);
        expect(Array.isArray(result.upcomingAssignments)).toBe(true);
        expect(Array.isArray(result.recentGrades)).toBe(true);
        expect(Array.isArray(result.weakAreas)).toBe(true);
        expect(studentApi.getDashboard).not.toHaveBeenCalled();
      });

      it('should call backend API for non-demo user', async () => {
        (useAuthStore.getState as jest.Mock).mockReturnValue({
          user: { email: 'user@example.com' },
        });
        const mockData = { attendance: {}, upcomingAssignments: [] };
        (studentApi.getDashboard as jest.Mock).mockResolvedValue(mockData);

        const result = await demoDataApi.student.getDashboard();

        expect(studentApi.getDashboard).toHaveBeenCalled();
        expect(result).toEqual(mockData);
      });
    });

    describe('getProfile', () => {
      it('should return properly typed Promise-wrapped demo profile for demo user', async () => {
        (useAuthStore.getState as jest.Mock).mockReturnValue({
          user: { email: 'demo@example.com' },
        });

        const result = await demoDataApi.student.getProfile();

        expect(result).toEqual(dummyData.students.demo.profile);
        expect(result).toHaveProperty('id');
        expect(result).toHaveProperty('email', 'demo@example.com');
        expect(result).toHaveProperty('grade');
        expect(studentApi.getProfile).not.toHaveBeenCalled();
      });

      it('should call backend API for non-demo user', async () => {
        (useAuthStore.getState as jest.Mock).mockReturnValue({
          user: { email: 'user@example.com' },
        });
        const mockProfile = { id: 1, email: 'user@example.com' };
        (studentApi.getProfile as jest.Mock).mockResolvedValue(mockProfile);

        const result = await demoDataApi.student.getProfile();

        expect(studentApi.getProfile).toHaveBeenCalled();
        expect(result).toEqual(mockProfile);
      });
    });

    describe('getStats', () => {
      it('should return properly typed Promise-wrapped demo stats for demo user', async () => {
        (useAuthStore.getState as jest.Mock).mockReturnValue({
          user: { email: 'demo@example.com' },
        });

        const result = await demoDataApi.student.getStats();

        expect(result).toEqual(dummyData.students.demo.stats);
        expect(result).toHaveProperty('attendance_percentage');
        expect(result).toHaveProperty('total_courses');
        expect(result).toHaveProperty('pending_assignments');
        expect(result).toHaveProperty('average_grade');
        expect(typeof result.attendance_percentage).toBe('number');
        expect(studentApi.getGrades).not.toHaveBeenCalled();
      });

      it('should call backend API for non-demo user', async () => {
        (useAuthStore.getState as jest.Mock).mockReturnValue({
          user: { email: 'user@example.com' },
        });
        const mockStats = { attendance_percentage: 90 };
        (studentApi.getGrades as jest.Mock).mockResolvedValue(mockStats);

        const result = await demoDataApi.student.getStats();

        expect(studentApi.getGrades).toHaveBeenCalled();
        expect(result).toEqual(mockStats);
      });
    });

    describe('getAttendance', () => {
      it('should return properly typed Promise-wrapped demo attendance for demo user', async () => {
        (useAuthStore.getState as jest.Mock).mockReturnValue({
          user: { email: 'demo@example.com' },
        });

        const result = await demoDataApi.student.getAttendance();

        expect(result).toEqual(dummyData.students.demo.attendance.summary);
        expect(result).toHaveProperty('totalClasses');
        expect(result).toHaveProperty('attendedClasses');
        expect(result).toHaveProperty('percentage');
        expect(result).toHaveProperty('subjectWiseAttendance');
        expect(Array.isArray(result.subjectWiseAttendance)).toBe(true);
        expect(studentApi.getAttendanceSummary).not.toHaveBeenCalled();
      });

      it('should call backend API for non-demo user', async () => {
        (useAuthStore.getState as jest.Mock).mockReturnValue({
          user: { email: 'user@example.com' },
        });
        const mockAttendance = { totalClasses: 100 };
        (studentApi.getAttendanceSummary as jest.Mock).mockResolvedValue(mockAttendance);

        const result = await demoDataApi.student.getAttendance();

        expect(studentApi.getAttendanceSummary).toHaveBeenCalled();
        expect(result).toEqual(mockAttendance);
      });
    });

    describe('getAssignments', () => {
      it('should return properly typed Promise-wrapped demo assignments for demo user', async () => {
        (useAuthStore.getState as jest.Mock).mockReturnValue({
          user: { email: 'demo@example.com' },
        });

        const result = await demoDataApi.student.getAssignments();

        expect(result).toEqual(dummyData.students.demo.assignments);
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeGreaterThan(0);
        expect(result[0]).toHaveProperty('id');
        expect(result[0]).toHaveProperty('title');
        expect(result[0]).toHaveProperty('subject');
        expect(result[0]).toHaveProperty('status');
        expect(studentApi.getAssignments).not.toHaveBeenCalled();
      });

      it('should call backend API for non-demo user', async () => {
        (useAuthStore.getState as jest.Mock).mockReturnValue({
          user: { email: 'user@example.com' },
        });
        const mockAssignments = [{ id: 1, title: 'Test' }];
        (studentApi.getAssignments as jest.Mock).mockResolvedValue(mockAssignments);

        const result = await demoDataApi.student.getAssignments();

        expect(studentApi.getAssignments).toHaveBeenCalled();
        expect(result).toEqual(mockAssignments);
      });
    });

    describe('getGrades', () => {
      it('should return properly typed Promise-wrapped demo grades for demo user', async () => {
        (useAuthStore.getState as jest.Mock).mockReturnValue({
          user: { email: 'demo@example.com' },
        });

        const result = await demoDataApi.student.getGrades();

        expect(result).toEqual(dummyData.students.demo.exams.results);
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeGreaterThan(0);
        expect(result[0]).toHaveProperty('examName');
        expect(result[0]).toHaveProperty('subjectName');
        expect(result[0]).toHaveProperty('percentage');
        expect(studentApi.getGrades).not.toHaveBeenCalled();
      });

      it('should call backend API for non-demo user', async () => {
        (useAuthStore.getState as jest.Mock).mockReturnValue({
          user: { email: 'user@example.com' },
        });
        const mockGrades = [{ examName: 'Test', percentage: 90 }];
        (studentApi.getGrades as jest.Mock).mockResolvedValue(mockGrades);

        const result = await demoDataApi.student.getGrades();

        expect(studentApi.getGrades).toHaveBeenCalled();
        expect(result).toEqual(mockGrades);
      });
    });

    describe('getAIPredictions', () => {
      it('should return properly typed Promise-wrapped demo AI predictions for demo user', async () => {
        (useAuthStore.getState as jest.Mock).mockReturnValue({
          user: { email: 'demo@example.com' },
        });

        const result = await demoDataApi.student.getAIPredictions();

        expect(result).toEqual(dummyData.students.demo.ai.predictions);
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeGreaterThan(0);
        expect(result[0]).toHaveProperty('subject');
        expect(result[0]).toHaveProperty('predicted_grade');
        expect(result[0]).toHaveProperty('confidence');
        expect(result[0]).toHaveProperty('trend');
        expect(studentApi.getAIPredictionDashboard).not.toHaveBeenCalled();
      });

      it('should call backend API for non-demo user', async () => {
        (useAuthStore.getState as jest.Mock).mockReturnValue({
          user: { email: 'user@example.com' },
        });
        const mockPredictions = [{ subject: 'Math', predicted_grade: 85 }];
        (studentApi.getAIPredictionDashboard as jest.Mock).mockResolvedValue(mockPredictions);

        const result = await demoDataApi.student.getAIPredictions();

        expect(studentApi.getAIPredictionDashboard).toHaveBeenCalled();
        expect(result).toEqual(mockPredictions);
      });
    });

    describe('getWeakAreas', () => {
      it('should return properly typed Promise-wrapped demo weak areas for demo user', async () => {
        (useAuthStore.getState as jest.Mock).mockReturnValue({
          user: { email: 'demo@example.com' },
        });

        const result = await demoDataApi.student.getWeakAreas();

        expect(result).toEqual(dummyData.students.demo.ai.weakAreas);
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeGreaterThan(0);
        expect(result[0]).toHaveProperty('id');
        expect(result[0]).toHaveProperty('subject');
        expect(result[0]).toHaveProperty('topic');
        expect(result[0]).toHaveProperty('score_percentage');
        expect(result[0]).toHaveProperty('recommendation');
        expect(studentApi.getWeakAreas).not.toHaveBeenCalled();
      });

      it('should call backend API for non-demo user', async () => {
        (useAuthStore.getState as jest.Mock).mockReturnValue({
          user: { email: 'user@example.com' },
        });
        const mockWeakAreas = [{ id: 1, subject: 'Math', topic: 'Algebra' }];
        (studentApi.getWeakAreas as jest.Mock).mockResolvedValue(mockWeakAreas);

        const result = await demoDataApi.student.getWeakAreas();

        expect(studentApi.getWeakAreas).toHaveBeenCalled();
        expect(result).toEqual(mockWeakAreas);
      });
    });

    describe('getSubjects', () => {
      it('should return properly typed Promise-wrapped demo subjects for demo user', async () => {
        (useAuthStore.getState as jest.Mock).mockReturnValue({
          user: { email: 'demo@example.com' },
        });

        const result = await demoDataApi.student.getSubjects();

        expect(result).toEqual(dummyData.students.demo.subjects);
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeGreaterThan(0);
        expect(result[0]).toHaveProperty('id');
        expect(result[0]).toHaveProperty('name');
        expect(result[0]).toHaveProperty('code');
        expect(result[0]).toHaveProperty('teacher_name');
        expect(studentApi.getAssignments).not.toHaveBeenCalled();
      });
    });

    describe('getBadges', () => {
      it('should return properly typed Promise-wrapped demo badges for demo user', async () => {
        (useAuthStore.getState as jest.Mock).mockReturnValue({
          user: { email: 'demo@example.com' },
        });

        const result = await demoDataApi.student.getBadges();

        expect(result).toEqual(dummyData.students.demo.gamification.badges);
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeGreaterThan(0);
        expect(result[0]).toHaveProperty('id');
        expect(result[0]).toHaveProperty('name');
        expect(result[0]).toHaveProperty('description');
        expect(result[0]).toHaveProperty('category');
        expect(studentApi.getGamificationDetails).not.toHaveBeenCalled();
      });
    });

    describe('getAchievements', () => {
      it('should return properly typed Promise-wrapped demo achievements for demo user', async () => {
        (useAuthStore.getState as jest.Mock).mockReturnValue({
          user: { email: 'demo@example.com' },
        });

        const result = await demoDataApi.student.getAchievements();

        expect(result).toEqual(dummyData.students.demo.gamification.achievements);
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeGreaterThan(0);
        expect(result[0]).toHaveProperty('id');
        expect(result[0]).toHaveProperty('title');
        expect(result[0]).toHaveProperty('description');
        expect(result[0]).toHaveProperty('category');
        expect(studentApi.getGamificationDetails).not.toHaveBeenCalled();
      });
    });

    describe('getGamification', () => {
      it('should return properly typed Promise-wrapped demo gamification stats for demo user', async () => {
        (useAuthStore.getState as jest.Mock).mockReturnValue({
          user: { email: 'demo@example.com' },
        });

        const result = await demoDataApi.student.getGamification();

        expect(result).toEqual(dummyData.students.demo.gamification.stats);
        expect(result).toHaveProperty('totalPoints');
        expect(result).toHaveProperty('currentLevel');
        expect(result).toHaveProperty('rank');
        expect(typeof result.totalPoints).toBe('number');
        expect(studentApi.getGamification).not.toHaveBeenCalled();
      });
    });
  });

  describe('parent wrapper functions', () => {
    describe('getChildren', () => {
      it('should return properly typed Promise-wrapped demo children for demo user', async () => {
        (useAuthStore.getState as jest.Mock).mockReturnValue({
          user: { email: 'parent@demo.com' },
        });

        const result = await demoDataApi.parent.getChildren();

        expect(result).toEqual(dummyData.parents.demo.children);
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeGreaterThan(0);
        expect(result[0]).toHaveProperty('id');
        expect(result[0]).toHaveProperty('first_name');
        expect(result[0]).toHaveProperty('last_name');
        expect(result[0]).toHaveProperty('grade');
        expect(result[0]).toHaveProperty('class_name');
        expect(parentApi.getChildren).not.toHaveBeenCalled();
      });

      it('should call backend API for non-demo user', async () => {
        (useAuthStore.getState as jest.Mock).mockReturnValue({
          user: { email: 'user@example.com' },
        });
        const mockChildren = [{ id: 1, first_name: 'Child' }];
        (parentApi.getChildren as jest.Mock).mockResolvedValue(mockChildren);

        const result = await demoDataApi.parent.getChildren();

        expect(parentApi.getChildren).toHaveBeenCalled();
        expect(result).toEqual(mockChildren);
      });
    });

    describe('getChildStats', () => {
      it('should return properly typed Promise-wrapped demo child stats for demo user', async () => {
        (useAuthStore.getState as jest.Mock).mockReturnValue({
          user: { email: 'parent@demo.com' },
        });

        const result = await demoDataApi.parent.getChildStats(1001);

        expect(result).toEqual(dummyData.parents.demo.childrenStats[1001]);
        expect(result).toHaveProperty('attendance_percentage');
        expect(result).toHaveProperty('rank');
        expect(result).toHaveProperty('average_score');
        expect(result).toHaveProperty('total_subjects');
        expect(typeof result.attendance_percentage).toBe('number');
        expect(parentApi.getChildStats).not.toHaveBeenCalled();
      });

      it('should return default stats for unknown child ID', async () => {
        (useAuthStore.getState as jest.Mock).mockReturnValue({
          user: { email: 'parent@demo.com' },
        });

        const result = await demoDataApi.parent.getChildStats(9999);

        expect(result).toHaveProperty('attendance_percentage', 0);
        expect(result).toHaveProperty('rank', 0);
        expect(result).toHaveProperty('average_score', 0);
        expect(result).toHaveProperty('total_subjects', 0);
      });

      it('should call backend API for non-demo user', async () => {
        (useAuthStore.getState as jest.Mock).mockReturnValue({
          user: { email: 'user@example.com' },
        });
        const mockStats = { attendance_percentage: 95, rank: 1 };
        (parentApi.getChildStats as jest.Mock).mockResolvedValue(mockStats);

        const result = await demoDataApi.parent.getChildStats(1001);

        expect(parentApi.getChildStats).toHaveBeenCalledWith(1001);
        expect(result).toEqual(mockStats);
      });
    });

    describe('getTodayAttendance', () => {
      it('should return properly typed Promise-wrapped demo today attendance for demo user', async () => {
        (useAuthStore.getState as jest.Mock).mockReturnValue({
          user: { email: 'parent@demo.com' },
        });

        const result = await demoDataApi.parent.getTodayAttendance(1001);

        expect(result).toEqual(dummyData.parents.demo.todayAttendance[1001]);
        expect(result).toHaveProperty('child_id', 1001);
        expect(result).toHaveProperty('date');
        expect(result).toHaveProperty('status');
        expect(result).toHaveProperty('marked_at');
        expect(result).toHaveProperty('marked_by');
        expect(parentApi.getTodayAttendance).not.toHaveBeenCalled();
      });
    });

    describe('getRecentGrades', () => {
      it('should return properly typed Promise-wrapped demo recent grades for demo user', async () => {
        (useAuthStore.getState as jest.Mock).mockReturnValue({
          user: { email: 'parent@demo.com' },
        });

        const result = await demoDataApi.parent.getRecentGrades(1001, 5);

        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeLessThanOrEqual(5);
        if (result.length > 0) {
          expect(result[0]).toHaveProperty('id');
          expect(result[0]).toHaveProperty('subject_name');
          expect(result[0]).toHaveProperty('exam_name');
          expect(result[0]).toHaveProperty('percentage');
          expect(result[0]).toHaveProperty('grade');
        }
        expect(parentApi.getRecentGrades).not.toHaveBeenCalled();
      });

      it('should limit results to specified limit', async () => {
        (useAuthStore.getState as jest.Mock).mockReturnValue({
          user: { email: 'parent@demo.com' },
        });

        const result = await demoDataApi.parent.getRecentGrades(1001, 2);

        expect(result.length).toBeLessThanOrEqual(2);
      });
    });

    describe('getPendingAssignments', () => {
      it('should return properly typed Promise-wrapped demo pending assignments for demo user', async () => {
        (useAuthStore.getState as jest.Mock).mockReturnValue({
          user: { email: 'parent@demo.com' },
        });

        const result = await demoDataApi.parent.getPendingAssignments(1001);

        expect(Array.isArray(result)).toBe(true);
        result.forEach((assignment) => {
          expect(assignment.status).toBe('pending');
          expect(assignment).toHaveProperty('id');
          expect(assignment).toHaveProperty('title');
          expect(assignment).toHaveProperty('subject_name');
          expect(assignment).toHaveProperty('due_date');
        });
        expect(parentApi.getPendingAssignments).not.toHaveBeenCalled();
      });
    });

    describe('getFeePayments', () => {
      it('should return properly typed Promise-wrapped demo fee payments for demo user', async () => {
        (useAuthStore.getState as jest.Mock).mockReturnValue({
          user: { email: 'parent@demo.com' },
        });

        const result = await demoDataApi.parent.getFeePayments(1001);

        expect(Array.isArray(result)).toBe(true);
        if (result.length > 0) {
          expect(result[0]).toHaveProperty('id');
          expect(result[0]).toHaveProperty('child_id');
          expect(result[0]).toHaveProperty('fee_type');
          expect(result[0]).toHaveProperty('amount');
          expect(result[0]).toHaveProperty('due_date');
          expect(result[0]).toHaveProperty('status');
        }
        expect(parentApi.getFeePayments).not.toHaveBeenCalled();
      });
    });

    describe('getMessages', () => {
      it('should return properly typed Promise-wrapped demo messages for demo user', async () => {
        (useAuthStore.getState as jest.Mock).mockReturnValue({
          user: { email: 'parent@demo.com' },
        });

        const result = await demoDataApi.parent.getMessages();

        expect(result).toEqual(dummyData.parents.demo.messages);
        expect(Array.isArray(result)).toBe(true);
        if (result.length > 0) {
          expect(result[0]).toHaveProperty('id');
          expect(result[0]).toHaveProperty('sender_name');
          expect(result[0]).toHaveProperty('sender_role');
          expect(result[0]).toHaveProperty('subject');
          expect(result[0]).toHaveProperty('message');
          expect(result[0]).toHaveProperty('sent_at');
        }
        expect(parentApi.getMessages).not.toHaveBeenCalled();
      });
    });

    describe('getAnnouncements', () => {
      it('should return properly typed Promise-wrapped demo announcements for demo user', async () => {
        (useAuthStore.getState as jest.Mock).mockReturnValue({
          user: { email: 'parent@demo.com' },
        });

        const result = await demoDataApi.parent.getAnnouncements();

        expect(result).toEqual(dummyData.parents.demo.announcements);
        expect(Array.isArray(result)).toBe(true);
        if (result.length > 0) {
          expect(result[0]).toHaveProperty('id');
          expect(result[0]).toHaveProperty('title');
          expect(result[0]).toHaveProperty('content');
          expect(result[0]).toHaveProperty('posted_by');
          expect(result[0]).toHaveProperty('category');
        }
        expect(parentApi.getAnnouncements).not.toHaveBeenCalled();
      });
    });

    describe('getAttendanceCalendar', () => {
      it('should return properly typed Promise-wrapped demo attendance calendar for demo user', async () => {
        (useAuthStore.getState as jest.Mock).mockReturnValue({
          user: { email: 'parent@demo.com' },
        });

        const result = await demoDataApi.parent.getAttendanceCalendar(1001, 2024, 3);

        expect(result).toBeDefined();
        expect(typeof result).toBe('object');
        expect(parentApi.getAttendanceCalendar).not.toHaveBeenCalled();
      });
    });

    describe('getSubjectAttendance', () => {
      it('should return properly typed Promise-wrapped demo subject attendance for demo user', async () => {
        (useAuthStore.getState as jest.Mock).mockReturnValue({
          user: { email: 'parent@demo.com' },
        });

        const result = await demoDataApi.parent.getSubjectAttendance(1001);

        expect(Array.isArray(result)).toBe(true);
        if (result.length > 0) {
          expect(result[0]).toHaveProperty('subject_name');
          expect(result[0]).toHaveProperty('present_count');
          expect(result[0]).toHaveProperty('total_count');
          expect(result[0]).toHaveProperty('percentage');
        }
        expect(parentApi.getSubjectAttendance).not.toHaveBeenCalled();
      });
    });

    describe('getExamResults', () => {
      it('should return properly typed Promise-wrapped demo exam results for demo user', async () => {
        (useAuthStore.getState as jest.Mock).mockReturnValue({
          user: { email: 'parent@demo.com' },
        });

        const result = await demoDataApi.parent.getExamResults(1001);

        expect(Array.isArray(result)).toBe(true);
        if (result.length > 0) {
          expect(result[0]).toHaveProperty('id');
          expect(result[0]).toHaveProperty('exam_name');
          expect(result[0]).toHaveProperty('term');
          expect(result[0]).toHaveProperty('total_marks');
          expect(result[0]).toHaveProperty('marks_obtained');
          expect(result[0]).toHaveProperty('percentage');
          expect(result[0]).toHaveProperty('subjects');
          expect(Array.isArray(result[0].subjects)).toBe(true);
        }
        expect(parentApi.getExamResults).not.toHaveBeenCalled();
      });

      it('should filter by term when provided', async () => {
        (useAuthStore.getState as jest.Mock).mockReturnValue({
          user: { email: 'parent@demo.com' },
        });

        const result = await demoDataApi.parent.getExamResults(1001, 'First');

        expect(Array.isArray(result)).toBe(true);
        result.forEach((examResult) => {
          expect(examResult.term).toBe('First');
        });
      });
    });

    describe('getSubjectPerformance', () => {
      it('should return properly typed Promise-wrapped demo subject performance for demo user', async () => {
        (useAuthStore.getState as jest.Mock).mockReturnValue({
          user: { email: 'parent@demo.com' },
        });

        const result = await demoDataApi.parent.getSubjectPerformance(1001);

        expect(Array.isArray(result)).toBe(true);
        if (result.length > 0) {
          expect(result[0]).toHaveProperty('subject_name');
          expect(result[0]).toHaveProperty('average_score');
          expect(result[0]).toHaveProperty('highest_score');
          expect(result[0]).toHaveProperty('lowest_score');
          expect(result[0]).toHaveProperty('total_exams');
          expect(result[0]).toHaveProperty('trend');
        }
        expect(parentApi.getSubjectPerformance).not.toHaveBeenCalled();
      });
    });
  });

  describe('predictions wrapper functions', () => {
    describe('getAIPredictionDashboard', () => {
      it('should return properly typed Promise-wrapped demo AI prediction dashboard for demo user', async () => {
        (useAuthStore.getState as jest.Mock).mockReturnValue({
          user: { email: 'demo@example.com' },
        });

        const result = await demoDataApi.predictions.getAIPredictionDashboard();

        expect(result).toHaveProperty('data');
        expect(result.data).toHaveProperty('predictedScore');
        expect(result.data).toHaveProperty('confidence');
        expect(result.data).toHaveProperty('trend');
        expect(result.data).toHaveProperty('topicProbabilities');
        expect(result.data).toHaveProperty('focusAreas');
        expect(result.data).toHaveProperty('studyPlan');
        expect(typeof result.data.predictedScore).toBe('number');
        expect(['improving', 'stable', 'declining']).toContain(result.data.trend);
      });
    });

    describe('markTaskComplete', () => {
      it('should return properly typed Promise-wrapped response for demo user', async () => {
        (useAuthStore.getState as jest.Mock).mockReturnValue({
          user: { email: 'demo@example.com' },
        });

        const result = await demoDataApi.predictions.markTaskComplete(1);

        expect(result).toHaveProperty('data');
        expect(result.data).toHaveProperty('id', 1);
        expect(result.data).toHaveProperty('completed', true);
      });
    });

    describe('regenerateStudyPlan', () => {
      it('should return properly typed Promise-wrapped response for demo user', async () => {
        (useAuthStore.getState as jest.Mock).mockReturnValue({
          user: { email: 'demo@example.com' },
        });

        const result = await demoDataApi.predictions.regenerateStudyPlan();

        expect(result).toHaveProperty('data');
        expect(result.data).toBeDefined();
      });
    });
  });

  describe('goals wrapper functions', () => {
    it('should return properly typed Promise-wrapped demo goals for demo user', async () => {
      (useAuthStore.getState as jest.Mock).mockReturnValue({
        user: { email: 'demo@example.com' },
      });

      const result = await demoDataApi.student.getGoals();

      expect(result).toHaveProperty('data');
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('should return properly typed Promise-wrapped response for createGoal', async () => {
      (useAuthStore.getState as jest.Mock).mockReturnValue({
        user: { email: 'demo@example.com' },
      });

      const newGoal = {
        title: 'Test Goal',
        description: 'Test Description',
        targetValue: 100,
      };

      const result = await demoDataApi.student.createGoal(newGoal);

      expect(result).toHaveProperty('data');
      expect(result.data).toHaveProperty('id');
      expect(typeof result.data.id).toBe('number');
    });

    it('should return properly typed Promise-wrapped response for updateGoalProgress', async () => {
      (useAuthStore.getState as jest.Mock).mockReturnValue({
        user: { email: 'demo@example.com' },
      });

      const result = await demoDataApi.student.updateGoalProgress(1, 75);

      expect(result).toHaveProperty('data');
      expect(result.data).toHaveProperty('goalId', 1);
      expect(result.data).toHaveProperty('progress', 75);
      expect(result.data).toHaveProperty('status');
    });
  });

  describe('Promise behavior', () => {
    it('should return Promises that resolve asynchronously', async () => {
      (useAuthStore.getState as jest.Mock).mockReturnValue({
        user: { email: 'demo@example.com' },
      });

      const promise = demoDataApi.student.getProfile();
      expect(promise).toBeInstanceOf(Promise);

      const result = await promise;
      expect(result).toBeDefined();
    });

    it('should allow Promise chaining with .then()', (done) => {
      (useAuthStore.getState as jest.Mock).mockReturnValue({
        user: { email: 'demo@example.com' },
      });

      demoDataApi.student.getProfile().then((result) => {
        expect(result).toBeDefined();
        expect(result.email).toBe('demo@example.com');
        done();
      });
    });

    it('should allow Promise chaining with .catch() for error handling', async () => {
      (useAuthStore.getState as jest.Mock).mockReturnValue({
        user: { email: 'user@example.com' },
      });
      (studentApi.getProfile as jest.Mock).mockRejectedValue(new Error('API Error'));

      await expect(demoDataApi.student.getProfile()).rejects.toThrow('API Error');
    });
  });
});

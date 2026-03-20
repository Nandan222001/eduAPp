import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Modal,
  FlatList,
  Dimensions,
} from 'react-native';
import { Text, Card, Icon, Badge } from '@rneui/themed';
import { useParentDashboard } from '@hooks/useParentQueries';
import { LoadingState } from '@components/shared/LoadingState';
import { ErrorState } from '@components/shared/ErrorState';
import { EmptyState } from '@components/shared/EmptyState';
import { COLORS, SPACING } from '@constants';
import { isDemoUser, demoDataApi } from '@api/demoDataApi';

interface ChildInfo {
  id: number;
  firstName: string;
  lastName: string;
  studentId: string;
  grade: string;
  section: string;
}

interface AggregatedAttendance {
  childId: number;
  childName: string;
  percentage: number;
  todayStatus: string;
}

interface RecentGrade {
  childId: number;
  subject: string;
  examName: string;
  obtainedMarks: number;
  totalMarks: number;
  percentage: number;
  grade: string;
  examDate: string;
}

interface FeePaymentStatus {
  childId: number;
  status: {
    status: string;
    totalFees: number;
    paidAmount: number;
    pendingAmount: number;
    dueDate: string;
  };
}

interface TodayAlert {
  childName: string;
  status: string;
  subject?: string;
  remarks?: string;
}

interface DashboardData {
  children: ChildInfo[];
  aggregatedAttendance: AggregatedAttendance[];
  recentGrades: RecentGrade[];
  feePayments: FeePaymentStatus[];
  todayAlerts?: TodayAlert[];
}

export const DashboardScreen = () => {
  const [selectedChildId, setSelectedChildId] = useState<number | null>(null);
  const [selectorVisible, setSelectorVisible] = useState(false);
  const [demoData, setDemoData] = useState<DashboardData | null>(null);
  const [demoLoading, setDemoLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const isDemo = isDemoUser();
  const { data: apiData, isLoading: apiLoading, isError, error, refetch, isRefetching } = useParentDashboard();

  const loadDemoData = async () => {
    setDemoLoading(true);
    try {
      const children = await demoDataApi.parents.getChildren();
      const aggregatedAttendance: AggregatedAttendance[] = [];
      const recentGrades: RecentGrade[] = [];
      const feePayments: FeePaymentStatus[] = [];

      for (const child of children) {
        const childStats = await demoDataApi.parents.getChildStats(child.id);
        const todayAtt = await demoDataApi.parents.getTodayAttendance(child.id);
        const grades = await demoDataApi.parents.getRecentGrades(child.id, 5);
        const fees = await demoDataApi.parents.getFeePayments(child.id);

        aggregatedAttendance.push({
          childId: child.id,
          childName: `${child.first_name} ${child.last_name}`,
          percentage: childStats.attendance_percentage,
          todayStatus: todayAtt.status === 'not_marked' ? 'not_marked' : todayAtt.status,
        });

        grades.forEach((grade) => {
          recentGrades.push({
            childId: child.id,
            subject: grade.subject_name,
            examName: grade.exam_name,
            obtainedMarks: grade.marks_obtained,
            totalMarks: grade.total_marks,
            percentage: grade.percentage,
            grade: grade.grade,
            examDate: grade.date,
          });
        });

        if (fees.length > 0) {
          const pendingFees = fees.filter((f) => f.status === 'pending' || f.status === 'overdue');
          const paidFees = fees.filter((f) => f.status === 'paid');
          const totalFees = fees.reduce((sum, f) => sum + f.amount, 0);
          const paidAmount = paidFees.reduce((sum, f) => sum + f.amount, 0);
          const pendingAmount = pendingFees.reduce((sum, f) => sum + f.amount, 0);
          const nextDue = pendingFees.length > 0 ? pendingFees[0].due_date : fees[0].due_date;
          const feeStatus = pendingAmount > 0 ? 'pending' : 'paid';

          feePayments.push({
            childId: child.id,
            status: {
              status: feeStatus,
              totalFees,
              paidAmount,
              pendingAmount,
              dueDate: nextDue,
            },
          });
        }
      }

      const transformedChildren: ChildInfo[] = children.map((child) => ({
        id: child.id,
        firstName: child.first_name,
        lastName: child.last_name,
        studentId: child.student_id,
        grade: child.grade,
        section: child.class_name,
      }));

      const todayAlerts: TodayAlert[] = [];
      for (const child of children) {
        const todayAtt = await demoDataApi.parents.getTodayAttendance(child.id);
        if (todayAtt.status === 'absent' || todayAtt.status === 'late') {
          todayAlerts.push({
            childName: `${child.first_name} ${child.last_name}`,
            status: todayAtt.status,
          });
        }
      }

      setDemoData({
        children: transformedChildren,
        aggregatedAttendance,
        recentGrades,
        feePayments,
        todayAlerts: todayAlerts.length > 0 ? todayAlerts : undefined,
      });
    } catch (err) {
      console.error('Error loading demo data:', err);
    } finally {
      setDemoLoading(false);
    }
  };

  useEffect(() => {
    if (isDemo) {
      loadDemoData();
    }
  }, [isDemo]);

  const handleRefresh = async () => {
    if (isDemo) {
      setRefreshing(true);
      await loadDemoData();
      setRefreshing(false);
    } else {
      refetch();
    }
  };

  const data = isDemo ? demoData : apiData;
  const isLoading = isDemo ? demoLoading : apiLoading;

  useEffect(() => {
    if (data?.children && data.children.length > 0 && !selectedChildId) {
      setSelectedChildId(data.children[0].id);
    }
  }, [data?.children, selectedChildId]);

  if (isLoading) {
    return <LoadingState message="Loading dashboard..." />;
  }

  if (!isDemo && isError) {
    return (
      <ErrorState
        message={error?.message || 'Failed to load dashboard'}
        onRetry={() => refetch()}
      />
    );
  }

  if (!data || data.children.length === 0) {
    return <EmptyState title="No Children" message="No children found" />;
  }

  const selectedChild = data.children.find(c => c.id === selectedChildId);
  const selectedChildAttendance = data.aggregatedAttendance.find(
    a => a.childId === selectedChildId
  );
  const selectedChildGrades = data.recentGrades.filter(g => g.childId === selectedChildId);
  const selectedChildFees = data.feePayments.find(f => f.childId === selectedChildId);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return COLORS.success;
      case 'absent':
        return COLORS.error;
      case 'late':
        return COLORS.warning;
      default:
        return COLORS.textSecondary;
    }
  };

  const getFeeStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return COLORS.success;
      case 'pending':
        return COLORS.warning;
      case 'overdue':
        return COLORS.error;
      default:
        return COLORS.textSecondary;
    }
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={isDemo ? refreshing : isRefetching}
          onRefresh={handleRefresh}
        />
      }
    >
      <Card containerStyle={styles.card}>
        <Card.Title>Select Child</Card.Title>
        <Card.Divider />
        <TouchableOpacity style={styles.selector} onPress={() => setSelectorVisible(true)}>
          <View style={styles.selectorContent}>
            {selectedChild ? (
              <>
                <Text style={styles.selectedText}>
                  {selectedChild.firstName} {selectedChild.lastName}
                </Text>
                <Text style={styles.selectedSubtext}>
                  {selectedChild.grade} - {selectedChild.section}
                </Text>
              </>
            ) : (
              <Text style={styles.placeholderText}>Select a child</Text>
            )}
          </View>
          <Icon name="arrow-drop-down" type="material" color={COLORS.textSecondary} size={24} />
        </TouchableOpacity>
      </Card>

      <Modal
        visible={selectorVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectorVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSelectorVisible(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Child</Text>
              <TouchableOpacity onPress={() => setSelectorVisible(false)}>
                <Icon name="close" type="material" color={COLORS.text} size={24} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={data.children}
              keyExtractor={item => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.optionItem, item.id === selectedChildId && styles.selectedOption]}
                  onPress={() => {
                    setSelectedChildId(item.id);
                    setSelectorVisible(false);
                  }}
                >
                  <View style={styles.optionContent}>
                    <Text
                      style={[
                        styles.optionText,
                        item.id === selectedChildId && styles.selectedOptionText,
                      ]}
                    >
                      {item.firstName} {item.lastName}
                    </Text>
                    <Text
                      style={[
                        styles.optionSubtext,
                        item.id === selectedChildId && styles.selectedOptionSubtext,
                      ]}
                    >
                      {item.grade} - {item.section}
                    </Text>
                  </View>
                  {item.id === selectedChildId && (
                    <Icon name="check" type="material" color={COLORS.primary} size={24} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {selectedChild && (
        <Card containerStyle={styles.card}>
          <Card.Title>Student Information</Card.Title>
          <Card.Divider />
          <View style={styles.infoRow}>
            <Text style={styles.label}>Name:</Text>
            <Text style={styles.value}>
              {selectedChild.firstName} {selectedChild.lastName}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Student ID:</Text>
            <Text style={styles.value}>{selectedChild.studentId}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Grade:</Text>
            <Text style={styles.value}>
              {selectedChild.grade} - {selectedChild.section}
            </Text>
          </View>
        </Card>
      )}

      {selectedChildAttendance && (
        <Card containerStyle={styles.card}>
          <View style={styles.cardHeader}>
            <Card.Title style={styles.cardTitle}>Attendance Overview</Card.Title>
            <Badge
              value={selectedChildAttendance.todayStatus.toUpperCase()}
              badgeStyle={{
                backgroundColor: getStatusColor(selectedChildAttendance.todayStatus),
              }}
            />
          </View>
          <Card.Divider />
          <View style={styles.attendanceContainer}>
            <View style={styles.attendanceCircle}>
              <Text h2 style={styles.percentageText}>
                {selectedChildAttendance.percentage.toFixed(1)}%
              </Text>
              <Text style={styles.attendanceLabel}>Overall Attendance</Text>
            </View>
          </View>
        </Card>
      )}

      {data.todayAlerts && data.todayAlerts.length > 0 && (
        <Card containerStyle={[styles.card, styles.alertCard]}>
          <View style={styles.cardHeader}>
            <Card.Title style={styles.cardTitle}>Today&apos;s Alerts</Card.Title>
            <Badge value={data.todayAlerts.length} status="error" />
          </View>
          <Card.Divider />
          {data.todayAlerts.map((alert, index) => (
            <View key={index} style={styles.alertItem}>
              <Icon
                name="warning"
                type="material"
                color={alert.status === 'absent' ? COLORS.error : COLORS.warning}
                size={20}
              />
              <View style={styles.alertContent}>
                <Text style={styles.alertText}>
                  {alert.childName} - {alert.status.toUpperCase()}
                </Text>
                {alert.subject && <Text style={styles.alertSubject}>Subject: {alert.subject}</Text>}
                {alert.remarks && <Text style={styles.alertRemarks}>{alert.remarks}</Text>}
              </View>
            </View>
          ))}
        </Card>
      )}

      {selectedChildGrades && selectedChildGrades.length > 0 && (
        <Card containerStyle={styles.card}>
          <Card.Title>Recent Grades</Card.Title>
          <Card.Divider />
          {selectedChildGrades.slice(0, 5).map(grade => (
            <View key={grade.examDate + grade.subject} style={styles.gradeItem}>
              <View style={styles.gradeHeader}>
                <Text style={styles.gradeSubject}>{grade.subject}</Text>
                <Badge
                  value={grade.grade}
                  badgeStyle={{
                    backgroundColor:
                      grade.percentage >= 80
                        ? COLORS.success
                        : grade.percentage >= 60
                          ? COLORS.warning
                          : COLORS.error,
                  }}
                />
              </View>
              <Text style={styles.gradeExam}>{grade.examName}</Text>
              <View style={styles.gradeScores}>
                <Text style={styles.gradeScore}>
                  {grade.obtainedMarks}/{grade.totalMarks}
                </Text>
                <Text style={styles.gradePercentage}>{grade.percentage.toFixed(1)}%</Text>
              </View>
              <Text style={styles.gradeDate}>{new Date(grade.examDate).toLocaleDateString()}</Text>
            </View>
          ))}
        </Card>
      )}

      {selectedChildFees && (
        <Card containerStyle={styles.card}>
          <View style={styles.cardHeader}>
            <Card.Title style={styles.cardTitle}>Fee Payment Status</Card.Title>
            <Badge
              value={selectedChildFees.status.status.toUpperCase()}
              badgeStyle={{
                backgroundColor: getFeeStatusColor(selectedChildFees.status.status),
              }}
            />
          </View>
          <Card.Divider />
          <View style={styles.feeRow}>
            <Text style={styles.feeLabel}>Total Fees:</Text>
            <Text style={styles.feeValue}>₹{selectedChildFees.status.totalFees}</Text>
          </View>
          <View style={styles.feeRow}>
            <Text style={styles.feeLabel}>Paid Amount:</Text>
            <Text style={[styles.feeValue, { color: COLORS.success }]}>
              ₹{selectedChildFees.status.paidAmount}
            </Text>
          </View>
          <View style={styles.feeRow}>
            <Text style={styles.feeLabel}>Pending Amount:</Text>
            <Text
              style={[
                styles.feeValue,
                {
                  color: selectedChildFees.status.pendingAmount > 0 ? COLORS.error : COLORS.success,
                },
              ]}
            >
              ₹{selectedChildFees.status.pendingAmount}
            </Text>
          </View>
          <View style={styles.feeRow}>
            <Text style={styles.feeLabel}>Due Date:</Text>
            <Text style={styles.feeValue}>
              {new Date(selectedChildFees.status.dueDate).toLocaleDateString()}
            </Text>
          </View>
        </Card>
      )}

      <Card containerStyle={styles.card}>
        <Card.Title>All Children Overview</Card.Title>
        <Card.Divider />
        {data.aggregatedAttendance.map(attendance => (
          <TouchableOpacity
            key={attendance.childId}
            style={styles.childOverviewItem}
            onPress={() => setSelectedChildId(attendance.childId)}
          >
            <View style={styles.childOverviewInfo}>
              <Text style={styles.childOverviewName}>{attendance.childName}</Text>
              <Text style={styles.childOverviewAttendance}>
                Attendance: {attendance.percentage.toFixed(1)}%
              </Text>
            </View>
            <Badge
              value={attendance.todayStatus}
              badgeStyle={{
                backgroundColor: getStatusColor(attendance.todayStatus),
              }}
            />
          </TouchableOpacity>
        ))}
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  card: {
    borderRadius: 8,
    marginHorizontal: SPACING.md,
    marginVertical: SPACING.sm,
  },
  alertCard: {
    borderColor: COLORS.error,
    borderWidth: 1,
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    backgroundColor: COLORS.background,
  },
  selectorContent: {
    flex: 1,
  },
  selectedText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  selectedSubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  placeholderText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    width: Dimensions.get('window').width * 0.85,
    maxHeight: Dimensions.get('window').height * 0.6,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  selectedOption: {
    backgroundColor: COLORS.surface,
  },
  optionContent: {
    flex: 1,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
  },
  optionSubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  selectedOptionText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  selectedOptionSubtext: {
    color: COLORS.primary,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  cardTitle: {
    marginBottom: 0,
    flex: 1,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  label: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  value: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '600',
  },
  attendanceContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },
  attendanceCircle: {
    alignItems: 'center',
  },
  percentageText: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  attendanceLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
  },
  alertItem: {
    flexDirection: 'row',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  alertContent: {
    flex: 1,
    marginLeft: SPACING.sm,
  },
  alertText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  alertSubject: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  alertRemarks: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
    fontStyle: 'italic',
  },
  gradeItem: {
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  gradeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gradeSubject: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  gradeExam: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  gradeScores: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  gradeScore: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
  },
  gradePercentage: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  gradeDate: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
  },
  feeLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  feeValue: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '600',
  },
  childOverviewItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  childOverviewInfo: {
    flex: 1,
  },
  childOverviewName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  childOverviewAttendance: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
});

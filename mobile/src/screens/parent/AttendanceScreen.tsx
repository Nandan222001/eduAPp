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
import { Calendar } from 'react-native-calendars';
import { useChildren, useChildAttendance } from '@hooks/useParentQueries';
import { LoadingState } from '@components/shared/LoadingState';
import { ErrorState } from '@components/shared/ErrorState';
import { EmptyState } from '@components/shared/EmptyState';
import { COLORS, SPACING } from '@constants';
import { isDemoUser, demoDataApi } from '@api/demoDataApi';
import type { ChildAttendanceRecord } from '../../types/parent';

interface ChildInfo {
  id: number;
  firstName: string;
  lastName: string;
  grade: string;
  section: string;
}

interface AttendanceData {
  todayStatus: string;
  percentage: number;
  attendedClasses: number;
  totalClasses: number;
  monthlyRecords: ChildAttendanceRecord[];
}

export const AttendanceScreen = () => {
  const [selectedChildId, setSelectedChildId] = useState<number | null>(null);
  const [selectorVisible, setSelectorVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const currentDate = new Date();
  const [month, setMonth] = useState(currentDate.getMonth() + 1);
  const [year, setYear] = useState(currentDate.getFullYear());
  const [demoChildren, setDemoChildren] = useState<ChildInfo[] | null>(null);
  const [demoAttendance, setDemoAttendance] = useState<AttendanceData | null>(null);
  const [demoLoading, setDemoLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isDemo, setIsDemo] = useState(false);

  const { data: apiChildren, isLoading: isLoadingChildren, isError: isErrorChildren } = useChildren();

  const {
    data: apiAttendanceData,
    isLoading: isLoadingAttendance,
    isError: isErrorAttendance,
    error,
    refetch,
    isRefetching,
  } = useChildAttendance(selectedChildId, {
    month: month.toString().padStart(2, '0'),
    year,
  });

  const loadDemoChildren = async () => {
    try {
      const childrenData = await demoDataApi.parent.getChildren();
      const transformedChildren: ChildInfo[] = childrenData.map((child) => ({
        id: child.id,
        firstName: child.first_name,
        lastName: child.last_name,
        grade: child.grade,
        section: child.class_name,
      }));
      setDemoChildren(transformedChildren);
      return transformedChildren;
    } catch (err) {
      console.error('Error loading demo children:', err);
      return [];
    }
  };

  const loadDemoAttendance = async (childId: number) => {
    setDemoLoading(true);
    try {
      const calendar = await demoDataApi.parent.getAttendanceCalendar(childId, year, month);
      const todayAtt = await demoDataApi.parent.getTodayAttendance(childId);
      const stats = await demoDataApi.parent.getChildStats(childId);

      const monthlyRecords: ChildAttendanceRecord[] = Object.entries(calendar).map(([date, record]) => ({
        date,
        status: record.status,
        subject: record.subject,
        remarks: record.notes,
      }));

      const totalRecords = monthlyRecords.length;
      const presentRecords = monthlyRecords.filter(r => r.status === 'present').length;
      const percentage = totalRecords > 0 ? (presentRecords / totalRecords) * 100 : stats.attendance_percentage;

      setDemoAttendance({
        todayStatus: todayAtt.status === 'not_marked' ? 'not_marked' : todayAtt.status,
        percentage: percentage,
        attendedClasses: presentRecords,
        totalClasses: totalRecords,
        monthlyRecords,
      });
    } catch (err) {
      console.error('Error loading demo attendance:', err);
    } finally {
      setDemoLoading(false);
    }
  };

  useEffect(() => {
    const checkDemoUser = async () => {
      const demo = await isDemoUser();
      setIsDemo(demo);
    };
    checkDemoUser();
  }, []);

  useEffect(() => {
    if (isDemo) {
      loadDemoChildren();
    }
  }, [isDemo]);

  useEffect(() => {
    if (isDemo && selectedChildId) {
      loadDemoAttendance(selectedChildId);
    }
  }, [isDemo, selectedChildId, month, year]);

  const handleRefresh = async () => {
    if (isDemo) {
      setRefreshing(true);
      if (selectedChildId) {
        await loadDemoAttendance(selectedChildId);
      }
      setRefreshing(false);
    } else {
      refetch();
    }
  };

  const children = isDemo ? demoChildren : apiChildren;
  const attendanceData = isDemo ? demoAttendance : apiAttendanceData;
  const isLoading = isDemo ? demoLoading : (isLoadingChildren || isLoadingAttendance);

  React.useEffect(() => {
    if (children && children.length > 0 && !selectedChildId) {
      setSelectedChildId(children[0].id);
    }
  }, [children, selectedChildId]);

  if (isLoading) {
    return <LoadingState message="Loading attendance..." />;
  }

  if (!isDemo && (isErrorChildren || isErrorAttendance)) {
    return (
      <ErrorState
        message={error?.message || 'Failed to load attendance'}
        onRetry={() => refetch()}
      />
    );
  }

  if (!children || children.length === 0) {
    return <EmptyState title="No Children" message="No children found" />;
  }

  const getMarkedDates = () => {
    if (!attendanceData?.monthlyRecords) return {};

    const marked: any = {};
    attendanceData.monthlyRecords.forEach((record: ChildAttendanceRecord) => {
      const color =
        record.status === 'present'
          ? COLORS.success
          : record.status === 'absent'
            ? COLORS.error
            : COLORS.warning;

      marked[record.date] = {
        selected: true,
        selectedColor: color,
        marked: true,
        dotColor: color,
      };
    });

    if (selectedDate && marked[selectedDate]) {
      marked[selectedDate] = {
        ...marked[selectedDate],
        selected: true,
        selectedColor: marked[selectedDate].selectedColor,
      };
    }

    return marked;
  };

  const getSelectedDayAttendance = () => {
    if (!selectedDate || !attendanceData?.monthlyRecords) return null;
    return attendanceData.monthlyRecords.find(
      (record: ChildAttendanceRecord) => record.date === selectedDate
    );
  };

  const selectedDayData = getSelectedDayAttendance();

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

  const handleMonthChange = (monthData: any) => {
    setMonth(monthData.month);
    setYear(monthData.year);
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
            {selectedChildId && children.find(c => c.id === selectedChildId) ? (
              <>
                <Text style={styles.selectedText}>
                  {children.find(c => c.id === selectedChildId)!.firstName}{' '}
                  {children.find(c => c.id === selectedChildId)!.lastName}
                </Text>
                <Text style={styles.selectedSubtext}>
                  {children.find(c => c.id === selectedChildId)!.grade} -{' '}
                  {children.find(c => c.id === selectedChildId)!.section}
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
              data={children}
              keyExtractor={item => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.optionItem, item.id === selectedChildId && styles.selectedOption]}
                  onPress={() => {
                    setSelectedChildId(item.id);
                    setSelectedDate(null);
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

      {attendanceData && (
        <>
          <Card containerStyle={styles.card}>
            <View style={styles.cardHeader}>
              <Card.Title style={styles.cardTitle}>Attendance Summary</Card.Title>
              <Badge
                value={attendanceData.todayStatus.toUpperCase()}
                badgeStyle={{
                  backgroundColor: getStatusColor(attendanceData.todayStatus),
                }}
              />
            </View>
            <Card.Divider />
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{attendanceData.percentage.toFixed(1)}%</Text>
                <Text style={styles.statLabel}>Overall</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{attendanceData.attendedClasses}</Text>
                <Text style={styles.statLabel}>Present</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {attendanceData.totalClasses - attendanceData.attendedClasses}
                </Text>
                <Text style={styles.statLabel}>Absent</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{attendanceData.totalClasses}</Text>
                <Text style={styles.statLabel}>Total</Text>
              </View>
            </View>
          </Card>

          <Card containerStyle={styles.card}>
            <Card.Title>Attendance Calendar</Card.Title>
            <Card.Divider />
            <View style={styles.legendContainer}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: COLORS.success }]} />
                <Text style={styles.legendText}>Present</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: COLORS.error }]} />
                <Text style={styles.legendText}>Absent</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: COLORS.warning }]} />
                <Text style={styles.legendText}>Late</Text>
              </View>
            </View>
            <Calendar
              current={`${year}-${month.toString().padStart(2, '0')}-01`}
              markedDates={getMarkedDates()}
              onDayPress={(day: any) => setSelectedDate(day.dateString)}
              onMonthChange={handleMonthChange}
              theme={{
                selectedDayBackgroundColor: COLORS.primary,
                todayTextColor: COLORS.primary,
                arrowColor: COLORS.primary,
                monthTextColor: COLORS.text,
                textMonthFontWeight: 'bold',
                textDayFontSize: 14,
                textMonthFontSize: 16,
              }}
            />
          </Card>

          {selectedDayData && (
            <Card containerStyle={styles.card}>
              <View style={styles.cardHeader}>
                <Card.Title style={styles.cardTitle}>
                  {new Date(selectedDate!).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Card.Title>
                <Badge
                  value={selectedDayData.status.toUpperCase()}
                  badgeStyle={{
                    backgroundColor: getStatusColor(selectedDayData.status),
                  }}
                />
              </View>
              <Card.Divider />
              {selectedDayData.subject && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Subject:</Text>
                  <Text style={styles.detailValue}>{selectedDayData.subject}</Text>
                </View>
              )}
              {selectedDayData.remarks && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Remarks:</Text>
                  <Text style={styles.detailValue}>{selectedDayData.remarks}</Text>
                </View>
              )}
            </Card>
          )}

          <Card containerStyle={styles.card}>
            <Card.Title>Recent Attendance</Card.Title>
            <Card.Divider />
            {attendanceData.monthlyRecords.slice(0, 10).map((record, index) => (
              <TouchableOpacity
                key={index}
                style={styles.attendanceItem}
                onPress={() => setSelectedDate(record.date)}
              >
                <View style={styles.attendanceItemLeft}>
                  <Icon
                    name={
                      record.status === 'present'
                        ? 'check-circle'
                        : record.status === 'absent'
                          ? 'cancel'
                          : 'warning'
                    }
                    type="material"
                    color={getStatusColor(record.status)}
                    size={24}
                  />
                  <View style={styles.attendanceItemInfo}>
                    <Text style={styles.attendanceDate}>
                      {new Date(record.date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </Text>
                    {record.subject && (
                      <Text style={styles.attendanceSubject}>{record.subject}</Text>
                    )}
                  </View>
                </View>
                <Badge
                  value={record.status}
                  badgeStyle={{
                    backgroundColor: getStatusColor(record.status),
                  }}
                />
              </TouchableOpacity>
            ))}
          </Card>
        </>
      )}
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
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: SPACING.md,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderRadius: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: COLORS.text,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  detailLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  attendanceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  attendanceItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  attendanceItemInfo: {
    marginLeft: SPACING.sm,
    flex: 1,
  },
  attendanceDate: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  attendanceSubject: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
});

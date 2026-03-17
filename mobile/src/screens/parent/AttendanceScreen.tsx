import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Text, Icon } from '@rneui/themed';
import { Calendar, DateData } from 'react-native-calendars';
import { format, startOfMonth, endOfMonth, subMonths, addMonths } from 'date-fns';
import { MainStackScreenProps } from '@types';
import { Card } from '@components';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '@constants';
import { parentsApi, AttendanceData } from '@api/parents';

type Props = MainStackScreenProps<'Attendance'>;

export const AttendanceScreen: React.FC<Props> = ({ route }) => {
  const childId = route.params?.childId;
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [attendanceData, setAttendanceData] = useState<AttendanceData | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  const fetchAttendanceData = useCallback(
    async (startDate: Date, endDate: Date) => {
      if (!childId) return;

      try {
        setLoading(true);
        const response = await parentsApi.getAttendance(
          parseInt(childId),
          format(startDate, 'yyyy-MM-dd'),
          format(endDate, 'yyyy-MM-dd')
        );
        setAttendanceData(response.data);
      } catch (error) {
        console.error('Error fetching attendance data:', error);
        Alert.alert('Error', 'Failed to load attendance data');
      } finally {
        setLoading(false);
      }
    },
    [childId]
  );

  useEffect(() => {
    if (childId) {
      const start = startOfMonth(currentMonth);
      const end = endOfMonth(currentMonth);
      fetchAttendanceData(start, end);
    }
  }, [childId, currentMonth, fetchAttendanceData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    await fetchAttendanceData(start, end);
    setRefreshing(false);
  }, [currentMonth, fetchAttendanceData]);

  const handleMonthChange = (direction: 'prev' | 'next') => {
    const newMonth = direction === 'prev' ? subMonths(currentMonth, 1) : addMonths(currentMonth, 1);
    setCurrentMonth(newMonth);
  };

  const getMarkedDates = () => {
    const marked: {
      [key: string]: {
        selected: boolean;
        selectedColor: string;
        marked: boolean;
        dotColor: string;
        selectedTextColor?: string;
      };
    } = {};

    attendanceData?.records.forEach(record => {
      let color = COLORS.textSecondary;
      if (record.status === 'present') color = COLORS.success;
      else if (record.status === 'absent') color = COLORS.error;
      else if (record.status === 'late') color = COLORS.warning;

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
        selectedTextColor: COLORS.background,
      };
    }

    return marked;
  };

  const getAttendanceForDate = (date: string) => {
    return attendanceData?.records.find(record => record.date === date);
  };

  const renderAttendanceGauge = () => {
    if (!attendanceData) return null;

    const percentage = attendanceData.summary.percentage;

    return (
      <View style={styles.gaugeContainer}>
        <View style={styles.gauge}>
          <View style={styles.gaugeCircle}>
            <Text style={styles.gaugePercentage}>{percentage.toFixed(1)}%</Text>
            <Text style={styles.gaugeLabel}>Attendance</Text>
          </View>
        </View>
        <View style={styles.gaugeLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: COLORS.success }]} />
            <Text style={styles.legendText}>Present: {attendanceData.summary.present} days</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: COLORS.error }]} />
            <Text style={styles.legendText}>Absent: {attendanceData.summary.absent} days</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: COLORS.warning }]} />
            <Text style={styles.legendText}>Late: {attendanceData.summary.late} days</Text>
          </View>
        </View>
      </View>
    );
  };

  const selectedAttendance = getAttendanceForDate(selectedDate);

  if (!childId) {
    return (
      <View style={styles.centerContainer}>
        <Text>No child selected</Text>
      </View>
    );
  }

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <Text>Loading attendance...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
      >
        <View style={styles.header}>
          <View style={styles.monthSelector}>
            <TouchableOpacity onPress={() => handleMonthChange('prev')} style={styles.monthButton}>
              <Icon name="chevron-back" type="ionicon" color={COLORS.primary} size={24} />
            </TouchableOpacity>
            <Text style={styles.monthText}>{format(currentMonth, 'MMMM yyyy')}</Text>
            <TouchableOpacity onPress={() => handleMonthChange('next')} style={styles.monthButton}>
              <Icon name="chevron-forward" type="ionicon" color={COLORS.primary} size={24} />
            </TouchableOpacity>
          </View>
        </View>

        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Monthly Calendar</Text>
          <Calendar
            current={format(currentMonth, 'yyyy-MM-dd')}
            markedDates={getMarkedDates()}
            onDayPress={(day: DateData) => setSelectedDate(day.dateString)}
            theme={{
              backgroundColor: COLORS.background,
              calendarBackground: COLORS.background,
              textSectionTitleColor: COLORS.textSecondary,
              selectedDayBackgroundColor: COLORS.primary,
              selectedDayTextColor: COLORS.background,
              todayTextColor: COLORS.primary,
              dayTextColor: COLORS.text,
              textDisabledColor: COLORS.disabled,
              dotColor: COLORS.primary,
              selectedDotColor: COLORS.background,
              arrowColor: COLORS.primary,
              monthTextColor: COLORS.text,
              textMonthFontWeight: '600',
              textDayFontSize: FONT_SIZES.sm,
              textMonthFontSize: FONT_SIZES.lg,
            }}
          />
          <View style={styles.calendarLegend}>
            <View style={styles.calendarLegendItem}>
              <View style={[styles.legendSquare, { backgroundColor: COLORS.success }]} />
              <Text style={styles.calendarLegendText}>Present</Text>
            </View>
            <View style={styles.calendarLegendItem}>
              <View style={[styles.legendSquare, { backgroundColor: COLORS.error }]} />
              <Text style={styles.calendarLegendText}>Absent</Text>
            </View>
            <View style={styles.calendarLegendItem}>
              <View style={[styles.legendSquare, { backgroundColor: COLORS.warning }]} />
              <Text style={styles.calendarLegendText}>Late</Text>
            </View>
          </View>
        </Card>

        {selectedAttendance && (
          <Card style={styles.card}>
            <Text style={styles.cardTitle}>
              Selected Date: {format(new Date(selectedDate), 'MMMM dd, yyyy')}
            </Text>
            <View style={styles.attendanceDetail}>
              <View style={styles.attendanceDetailRow}>
                <Text style={styles.attendanceDetailLabel}>Status:</Text>
                <Text
                  style={[
                    styles.attendanceDetailValue,
                    styles.statusText,
                    {
                      color:
                        selectedAttendance.status === 'present'
                          ? COLORS.success
                          : selectedAttendance.status === 'absent'
                            ? COLORS.error
                            : COLORS.warning,
                    },
                  ]}
                >
                  {selectedAttendance.status.charAt(0).toUpperCase() +
                    selectedAttendance.status.slice(1)}
                </Text>
              </View>
              {selectedAttendance.markedAt && (
                <View style={styles.attendanceDetailRow}>
                  <Text style={styles.attendanceDetailLabel}>Marked At:</Text>
                  <Text style={styles.attendanceDetailValue}>
                    {format(new Date(selectedAttendance.markedAt), 'hh:mm a')}
                  </Text>
                </View>
              )}
              {selectedAttendance.remarks && (
                <View style={styles.attendanceDetailRow}>
                  <Text style={styles.attendanceDetailLabel}>Remarks:</Text>
                  <Text style={styles.attendanceDetailValue}>{selectedAttendance.remarks}</Text>
                </View>
              )}
            </View>
          </Card>
        )}

        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Attendance Summary</Text>
          {renderAttendanceGauge()}
        </Card>

        {attendanceData && attendanceData.subjectWise.length > 0 && (
          <Card style={styles.card}>
            <Text style={styles.cardTitle}>Subject-wise Attendance</Text>
            <View style={styles.subjectTable}>
              <View style={styles.subjectTableHeader}>
                <Text style={[styles.subjectTableHeaderText, styles.subjectNameColumn]}>
                  Subject
                </Text>
                <Text style={[styles.subjectTableHeaderText, styles.subjectStatsColumn]}>
                  Present/Total
                </Text>
                <Text style={[styles.subjectTableHeaderText, styles.subjectStatsColumn]}>%</Text>
              </View>
              {attendanceData.subjectWise.map((subject, index) => (
                <View key={index} style={styles.subjectTableRow}>
                  <View style={styles.subjectNameColumn}>
                    <Text style={styles.subjectName}>{subject.subject}</Text>
                    <Text style={styles.subjectCode}>{subject.subjectCode}</Text>
                  </View>
                  <Text style={[styles.subjectTableText, styles.subjectStatsColumn]}>
                    {subject.attended}/{subject.totalClasses}
                  </Text>
                  <View style={[styles.subjectStatsColumn, styles.percentageContainer]}>
                    <Text
                      style={[
                        styles.subjectTableText,
                        styles.percentageText,
                        {
                          color:
                            subject.percentage >= 75
                              ? COLORS.success
                              : subject.percentage >= 60
                                ? COLORS.warning
                                : COLORS.error,
                        },
                      ]}
                    >
                      {subject.percentage.toFixed(1)}%
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </Card>
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  scrollView: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: SPACING.lg,
    backgroundColor: COLORS.background,
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  monthButton: {
    padding: SPACING.sm,
  },
  monthText: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '600',
    color: COLORS.text,
  },
  card: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  cardTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  calendarLegend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: SPACING.lg,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  calendarLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  legendSquare: {
    width: 16,
    height: 16,
    borderRadius: BORDER_RADIUS.sm,
  },
  calendarLegendText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  attendanceDetail: {
    gap: SPACING.md,
  },
  attendanceDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  attendanceDetailLabel: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  attendanceDetailValue: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    flex: 1,
    textAlign: 'right',
  },
  statusText: {
    fontWeight: '600',
  },
  gaugeContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },
  gauge: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  gaugeCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 12,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  gaugePercentage: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: '700',
    color: COLORS.primary,
  },
  gaugeLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  gaugeLegend: {
    gap: SPACING.sm,
    width: '100%',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
  },
  subjectTable: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  subjectTableHeader: {
    flexDirection: 'row',
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.surface,
  },
  subjectTableHeaderText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  subjectTableRow: {
    flexDirection: 'row',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    alignItems: 'center',
  },
  subjectNameColumn: {
    flex: 2,
  },
  subjectStatsColumn: {
    flex: 1,
    textAlign: 'center',
    alignItems: 'center',
  },
  subjectName: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    fontWeight: '500',
  },
  subjectCode: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  subjectTableText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
  },
  percentageContainer: {
    alignItems: 'center',
  },
  percentageText: {
    fontWeight: '600',
  },
  bottomSpacing: {
    height: SPACING.xl,
  },
});

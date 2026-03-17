import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
  TouchableOpacity,
  Modal,
  FlatList,
} from 'react-native';
import { Text, Card, Badge, Icon } from '@rneui/themed';
import { LineChart, BarChart, ProgressChart } from 'react-native-chart-kit';
import { useChildren, useChildGrades } from '@hooks/useParentQueries';
import { LoadingState } from '@components/shared/LoadingState';
import { ErrorState } from '@components/shared/ErrorState';
import { EmptyState } from '@components/shared/EmptyState';
import { COLORS, SPACING } from '@constants';

const screenWidth = Dimensions.get('window').width;

export const GradesScreen = () => {
  const [selectedChildId, setSelectedChildId] = useState<number | null>(null);
  const [selectorVisible, setSelectorVisible] = useState(false);

  const { data: children, isLoading: isLoadingChildren, isError: isErrorChildren } = useChildren();

  const {
    data: gradesData,
    isLoading: isLoadingGrades,
    isError: isErrorGrades,
    error,
    refetch,
    isRefetching,
  } = useChildGrades(selectedChildId);

  React.useEffect(() => {
    if (children && children.length > 0 && !selectedChildId) {
      setSelectedChildId(children[0].id);
    }
  }, [children, selectedChildId]);

  if (isLoadingChildren || (isLoadingGrades && selectedChildId)) {
    return <LoadingState message="Loading grades..." />;
  }

  if (isErrorChildren || isErrorGrades) {
    return (
      <ErrorState message={error?.message || 'Failed to load grades'} onRetry={() => refetch()} />
    );
  }

  if (!children || children.length === 0) {
    return <EmptyState title="No Children" message="No children found" />;
  }

  if (!gradesData) {
    return <EmptyState title="No Grades" message="No grades available" />;
  }

  const getGradeColor = (percentage: number) => {
    if (percentage >= 80) return COLORS.success;
    if (percentage >= 60) return COLORS.warning;
    return COLORS.error;
  };

  const chartConfig = {
    backgroundGradientFrom: '#fff',
    backgroundGradientTo: '#fff',
    color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.7,
    useShadowColorFromDataset: false,
    decimalPlaces: 0,
    propsForLabels: {
      fontSize: 10,
    },
  };

  const subjectPerformanceData = {
    labels: gradesData.subjectGrades.slice(0, 6).map(sg => sg.subject.substring(0, 8)),
    datasets: [
      {
        data: gradesData.subjectGrades.slice(0, 6).map(sg => sg.percentage),
        colors: gradesData.subjectGrades.slice(0, 6).map(sg => () => getGradeColor(sg.percentage)),
      },
    ],
  };

  const termComparisonData = {
    labels: gradesData.termComparison.map(tc => tc.term),
    datasets: [
      {
        data: gradesData.termComparison.map(tc => tc.percentage),
      },
    ],
  };

  const progressData = {
    labels: gradesData.subjectGrades.slice(0, 4).map(sg => sg.subject.substring(0, 6)),
    data: gradesData.subjectGrades.slice(0, 4).map(sg => sg.percentage / 100),
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
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

      <Card containerStyle={styles.card}>
        <View style={styles.cardHeader}>
          <Card.Title style={styles.cardTitle}>Overall Performance</Card.Title>
          <Badge
            value={gradesData.overallGrade}
            badgeStyle={{
              backgroundColor: getGradeColor(gradesData.overallPercentage),
            }}
          />
        </View>
        <Card.Divider />
        <View style={styles.overallContainer}>
          <View style={styles.overallCircle}>
            <Text h1 style={styles.percentageText}>
              {gradesData.overallPercentage.toFixed(1)}%
            </Text>
            <Text style={styles.overallLabel}>Overall Score</Text>
          </View>
        </View>
      </Card>

      <Card containerStyle={styles.card}>
        <Card.Title>Subject-wise Performance</Card.Title>
        <Card.Divider />
        {gradesData.subjectGrades.length > 0 && (
          <BarChart
            data={subjectPerformanceData}
            width={screenWidth - 60}
            height={220}
            chartConfig={chartConfig}
            yAxisLabel=""
            yAxisSuffix="%"
            fromZero
            showValuesOnTopOfBars
            withCustomBarColorFromData
            flatColor
            style={styles.chart}
          />
        )}
        <View style={styles.subjectList}>
          {gradesData.subjectGrades.map((subject, index) => (
            <View key={index} style={styles.subjectItem}>
              <View style={styles.subjectInfo}>
                <Text style={styles.subjectName}>{subject.subject}</Text>
                <View style={styles.trendContainer}>
                  <Text
                    style={[
                      styles.trendText,
                      {
                        color:
                          subject.trend === 'improving'
                            ? COLORS.success
                            : subject.trend === 'declining'
                              ? COLORS.error
                              : COLORS.textSecondary,
                      },
                    ]}
                  >
                    {subject.trend === 'improving'
                      ? '↑'
                      : subject.trend === 'declining'
                        ? '↓'
                        : '→'}{' '}
                    {subject.trend}
                  </Text>
                </View>
              </View>
              <View style={styles.subjectScores}>
                <Text style={styles.subjectPercentage}>{subject.percentage.toFixed(1)}%</Text>
                <Badge
                  value={subject.grade}
                  badgeStyle={{
                    backgroundColor: getGradeColor(subject.percentage),
                  }}
                />
              </View>
            </View>
          ))}
        </View>
      </Card>

      {gradesData.termComparison.length > 0 && (
        <Card containerStyle={styles.card}>
          <Card.Title>Term-wise Comparison</Card.Title>
          <Card.Divider />
          <LineChart
            data={termComparisonData}
            width={screenWidth - 60}
            height={220}
            chartConfig={chartConfig}
            bezier
            yAxisSuffix="%"
            style={styles.chart}
          />
        </Card>
      )}

      {gradesData.subjectGrades.length > 0 && (
        <Card containerStyle={styles.card}>
          <Card.Title>Subject Progress</Card.Title>
          <Card.Divider />
          <ProgressChart
            data={progressData}
            width={screenWidth - 60}
            height={220}
            strokeWidth={16}
            radius={32}
            chartConfig={chartConfig}
            hideLegend={false}
            style={styles.chart}
          />
        </Card>
      )}

      <Card containerStyle={styles.card}>
        <Card.Title>Recent Grades</Card.Title>
        <Card.Divider />
        {gradesData.recentGrades.length > 0 ? (
          gradesData.recentGrades.map(grade => (
            <View key={grade.id} style={styles.gradeItem}>
              <View style={styles.gradeHeader}>
                <Text style={styles.gradeSubject}>{grade.subject}</Text>
                <Badge
                  value={grade.grade}
                  badgeStyle={{
                    backgroundColor: getGradeColor(grade.percentage),
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
              <View style={styles.gradeFooter}>
                <Text style={styles.gradeDate}>
                  {new Date(grade.examDate).toLocaleDateString()}
                </Text>
                <Text style={styles.gradeTerm}>Term: {grade.term}</Text>
              </View>
            </View>
          ))
        ) : (
          <EmptyState title="No Grades" message="No recent grades" />
        )}
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
  overallContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },
  overallCircle: {
    alignItems: 'center',
  },
  percentageText: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  overallLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
  },
  chart: {
    marginVertical: SPACING.sm,
    borderRadius: 8,
  },
  subjectList: {
    marginTop: SPACING.md,
  },
  subjectItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  subjectInfo: {
    flex: 1,
  },
  subjectName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  trendContainer: {
    marginTop: 4,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '500',
  },
  subjectScores: {
    alignItems: 'flex-end',
  },
  subjectPercentage: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 4,
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
    marginTop: 8,
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
  gradeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  gradeDate: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  gradeTerm: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
});

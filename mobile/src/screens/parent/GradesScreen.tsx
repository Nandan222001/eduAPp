import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { Text, Icon } from '@rneui/themed';
import { Picker } from '@react-native-picker/picker';
import { LineChart, BarChart } from 'react-native-chart-kit';
import * as Print from 'expo-print';
import { format } from 'date-fns';
import { MainStackScreenProps } from '@types';
import { Card } from '@components';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '@constants';
import { parentsApi, GradesData } from '@api/parents';

type Props = MainStackScreenProps<'Grades'>;

const { width } = Dimensions.get('window');
const chartWidth = width - SPACING.lg * 4;

export const GradesScreen: React.FC<Props> = ({ route }) => {
  const childId = route.params?.childId;
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [gradesData, setGradesData] = useState<GradesData | null>(null);
  const [selectedTerm, setSelectedTerm] = useState<string>('all');
  const [expandedTerm, setExpandedTerm] = useState<string | null>(null);

  const fetchGradesData = useCallback(
    async (term?: string) => {
      if (!childId) return;

      try {
        setLoading(true);
        const response = await parentsApi.getGrades(parseInt(childId), term);
        setGradesData(response.data);
      } catch (error) {
        console.error('Error fetching grades data:', error);
        Alert.alert('Error', 'Failed to load grades data');
      } finally {
        setLoading(false);
      }
    },
    [childId]
  );

  useEffect(() => {
    if (childId) {
      fetchGradesData(selectedTerm === 'all' ? undefined : selectedTerm);
    }
  }, [childId, selectedTerm, fetchGradesData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchGradesData(selectedTerm === 'all' ? undefined : selectedTerm);
    setRefreshing(false);
  }, [selectedTerm, fetchGradesData]);

  const handleTermChange = (term: string) => {
    setSelectedTerm(term);
  };

  const toggleTermExpansion = (term: string) => {
    setExpandedTerm(expandedTerm === term ? null : term);
  };

  const getGradeColor = (percentage: number) => {
    if (percentage >= 90) return COLORS.success;
    if (percentage >= 75) return COLORS.primary;
    if (percentage >= 60) return COLORS.warning;
    return COLORS.error;
  };

  const generateReportCard = async () => {
    if (!gradesData) return;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
              color: #111827;
            }
            h1 {
              color: #3B82F6;
              text-align: center;
              margin-bottom: 10px;
            }
            h2 {
              color: #374151;
              border-bottom: 2px solid #3B82F6;
              padding-bottom: 5px;
              margin-top: 20px;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .summary {
              background-color: #F3F4F6;
              padding: 15px;
              border-radius: 8px;
              margin-bottom: 20px;
            }
            .summary-item {
              display: inline-block;
              margin: 10px 20px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
            }
            th, td {
              padding: 12px;
              text-align: left;
              border-bottom: 1px solid #E5E7EB;
            }
            th {
              background-color: #F3F4F6;
              font-weight: 600;
              color: #374151;
            }
            .grade-a { color: #10B981; font-weight: bold; }
            .grade-b { color: #3B82F6; font-weight: bold; }
            .grade-c { color: #F59E0B; font-weight: bold; }
            .grade-d { color: #EF4444; font-weight: bold; }
            .footer {
              margin-top: 40px;
              text-align: center;
              color: #6B7280;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Student Report Card</h1>
            <p>Generated on ${format(new Date(), 'MMMM dd, yyyy')}</p>
          </div>

          <div class="summary">
            <div class="summary-item">
              <strong>Overall Average:</strong> ${gradesData.overallAverage.toFixed(1)}%
            </div>
            ${
              gradesData.currentRank
                ? `
            <div class="summary-item">
              <strong>Current Rank:</strong> ${gradesData.currentRank}/${gradesData.totalStudents}
            </div>
            `
                : ''
            }
          </div>

          ${gradesData.termGrades
            .map(
              term => `
            <h2>${term.termName}</h2>
            <table>
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Exam</th>
                  <th>Marks</th>
                  <th>Percentage</th>
                  <th>Grade</th>
                </tr>
              </thead>
              <tbody>
                ${term.grades
                  .map(
                    grade => `
                  <tr>
                    <td>${grade.subject}</td>
                    <td>${grade.examName}</td>
                    <td>${grade.obtainedMarks}/${grade.totalMarks}</td>
                    <td>${grade.percentage.toFixed(1)}%</td>
                    <td class="grade-${grade.grade.toLowerCase().charAt(0)}">${grade.grade}</td>
                  </tr>
                `
                  )
                  .join('')}
              </tbody>
            </table>
            <p><strong>Term Average:</strong> ${term.averagePercentage.toFixed(1)}%</p>
            ${
              term.rank
                ? `<p><strong>Term Rank:</strong> ${term.rank}/${term.totalStudents}</p>`
                : ''
            }
          `
            )
            .join('')}

          <div class="footer">
            <p>This is an automatically generated report card.</p>
          </div>
        </body>
      </html>
    `;

    try {
      await Print.printAsync({ html });
    } catch (error) {
      console.error('Error generating report card:', error);
      Alert.alert('Error', 'Failed to generate report card');
    }
  };

  const renderSubjectPerformanceChart = () => {
    if (!gradesData || gradesData.subjectPerformance.length === 0) return null;

    const data = {
      labels: gradesData.subjectPerformance.map(s => s.subjectCode),
      datasets: [
        {
          data: gradesData.subjectPerformance.map(s => s.averagePercentage),
        },
      ],
    };

    return (
      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Subject-wise Performance</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <BarChart
            data={data}
            width={Math.max(chartWidth, gradesData.subjectPerformance.length * 60)}
            height={220}
            yAxisLabel=""
            yAxisSuffix="%"
            chartConfig={{
              backgroundColor: COLORS.background,
              backgroundGradientFrom: COLORS.background,
              backgroundGradientTo: COLORS.background,
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
              style: {
                borderRadius: BORDER_RADIUS.md,
              },
              propsForLabels: {
                fontSize: FONT_SIZES.xs,
              },
            }}
            style={styles.chart}
            showValuesOnTopOfBars
            fromZero
          />
        </ScrollView>
      </Card>
    );
  };

  const renderRankProgressionChart = () => {
    if (!gradesData || gradesData.rankProgression.length === 0) return null;

    const data = {
      labels: gradesData.rankProgression.map(r => r.term),
      datasets: [
        {
          data: gradesData.rankProgression.map(r => r.rank),
          color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
          strokeWidth: 3,
        },
      ],
    };

    return (
      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Rank Progression</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <LineChart
            data={data}
            width={Math.max(chartWidth, gradesData.rankProgression.length * 80)}
            height={220}
            chartConfig={{
              backgroundColor: COLORS.background,
              backgroundGradientFrom: COLORS.background,
              backgroundGradientTo: COLORS.background,
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
              style: {
                borderRadius: BORDER_RADIUS.md,
              },
              propsForLabels: {
                fontSize: FONT_SIZES.xs,
              },
            }}
            bezier
            style={styles.chart}
            yAxisLabel=""
            yAxisSuffix=""
          />
        </ScrollView>
        <View style={styles.rankProgressionDetails}>
          {gradesData.rankProgression.map((rank, index) => (
            <View key={index} style={styles.rankItem}>
              <Text style={styles.rankTerm}>{rank.term}</Text>
              <Text style={styles.rankValue}>
                Rank {rank.rank}/{rank.totalStudents}
              </Text>
              <Text style={styles.rankPercentage}>{rank.percentage.toFixed(1)}%</Text>
            </View>
          ))}
        </View>
      </Card>
    );
  };

  const renderClassAverageComparison = () => {
    if (!gradesData || gradesData.classAverages.length === 0) return null;

    return (
      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Class Average Comparison</Text>
        <View style={styles.comparisonTable}>
          <View style={styles.comparisonHeader}>
            <Text style={[styles.comparisonHeaderText, styles.comparisonSubjectColumn]}>
              Subject
            </Text>
            <Text style={[styles.comparisonHeaderText, styles.comparisonValueColumn]}>Student</Text>
            <Text style={[styles.comparisonHeaderText, styles.comparisonValueColumn]}>Class</Text>
            <Text style={[styles.comparisonHeaderText, styles.comparisonValueColumn]}>Diff</Text>
          </View>
          {gradesData.classAverages.map((avg, index) => {
            const diff = avg.studentAverage - avg.classAverage;
            return (
              <View key={index} style={styles.comparisonRow}>
                <Text style={[styles.comparisonText, styles.comparisonSubjectColumn]}>
                  {avg.subject}
                </Text>
                <Text style={[styles.comparisonText, styles.comparisonValueColumn]}>
                  {avg.studentAverage.toFixed(1)}%
                </Text>
                <Text style={[styles.comparisonText, styles.comparisonValueColumn]}>
                  {avg.classAverage.toFixed(1)}%
                </Text>
                <Text
                  style={[
                    styles.comparisonText,
                    styles.comparisonValueColumn,
                    styles.comparisonDiff,
                    { color: diff >= 0 ? COLORS.success : COLORS.error },
                  ]}
                >
                  {diff >= 0 ? '+' : ''}
                  {diff.toFixed(1)}%
                </Text>
              </View>
            );
          })}
        </View>
      </Card>
    );
  };

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
        <Text>Loading grades...</Text>
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
          <View style={styles.headerTop}>
            <Text style={styles.headerTitle}>Academic Performance</Text>
            <TouchableOpacity onPress={generateReportCard} style={styles.downloadButton}>
              <Icon name="download" type="ionicon" color={COLORS.primary} size={24} />
            </TouchableOpacity>
          </View>

          <View style={styles.termSelector}>
            <Text style={styles.termSelectorLabel}>Select Term</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={selectedTerm}
                onValueChange={itemValue => handleTermChange(itemValue as string)}
                style={styles.picker}
              >
                <Picker.Item label="All Terms" value="all" />
                {gradesData?.termGrades.map(term => (
                  <Picker.Item key={term.term} label={term.termName} value={term.term} />
                ))}
              </Picker>
            </View>
          </View>
        </View>

        {gradesData && (
          <>
            <Card style={styles.card}>
              <View style={styles.summaryContainer}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryValue}>{gradesData.overallAverage.toFixed(1)}%</Text>
                  <Text style={styles.summaryLabel}>Overall Average</Text>
                </View>
                {gradesData.currentRank && <View style={styles.summaryDivider} />}
                {gradesData.currentRank && (
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryValue}>
                      {gradesData.currentRank}/{gradesData.totalStudents}
                    </Text>
                    <Text style={styles.summaryLabel}>Current Rank</Text>
                  </View>
                )}
              </View>
            </Card>

            {gradesData.termGrades.map(term => (
              <Card key={term.term} style={styles.card}>
                <TouchableOpacity
                  onPress={() => toggleTermExpansion(term.term)}
                  style={styles.termHeader}
                >
                  <View style={styles.termHeaderLeft}>
                    <Text style={styles.termName}>{term.termName}</Text>
                    <Text style={styles.termAverage}>
                      Average: {term.averagePercentage.toFixed(1)}%
                    </Text>
                  </View>
                  <Icon
                    name={expandedTerm === term.term ? 'chevron-up' : 'chevron-down'}
                    type="ionicon"
                    color={COLORS.textSecondary}
                    size={24}
                  />
                </TouchableOpacity>

                {expandedTerm === term.term && (
                  <View style={styles.termContent}>
                    {term.rank && (
                      <View style={styles.termRank}>
                        <Text style={styles.termRankText}>
                          Rank: {term.rank}/{term.totalStudents}
                        </Text>
                      </View>
                    )}
                    <View style={styles.gradesTable}>
                      {term.grades.map(grade => (
                        <View key={grade.id} style={styles.gradeItem}>
                          <View style={styles.gradeItemHeader}>
                            <View style={styles.gradeItemLeft}>
                              <Text style={styles.gradeSubject}>{grade.subject}</Text>
                              <Text style={styles.gradeExam}>{grade.examName}</Text>
                            </View>
                            <View style={styles.gradeItemRight}>
                              <Text
                                style={[
                                  styles.gradeValue,
                                  { color: getGradeColor(grade.percentage) },
                                ]}
                              >
                                {grade.grade}
                              </Text>
                            </View>
                          </View>
                          <View style={styles.gradeItemDetails}>
                            <Text style={styles.gradeMarks}>
                              Marks: {grade.obtainedMarks}/{grade.totalMarks}
                            </Text>
                            <Text style={styles.gradePercentage}>
                              {grade.percentage.toFixed(1)}%
                            </Text>
                          </View>
                          {grade.remarks && (
                            <Text style={styles.gradeRemarks}>{grade.remarks}</Text>
                          )}
                          {grade.teacherName && (
                            <Text style={styles.gradeTeacher}>Teacher: {grade.teacherName}</Text>
                          )}
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </Card>
            ))}

            {renderSubjectPerformanceChart()}
            {renderRankProgressionChart()}
            {renderClassAverageComparison()}
          </>
        )}

        {gradesData && gradesData.termGrades.length === 0 && (
          <Card style={styles.card}>
            <Text style={styles.emptyText}>No grades available</Text>
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
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  headerTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '600',
    color: COLORS.text,
  },
  downloadButton: {
    padding: SPACING.sm,
  },
  termSelector: {
    marginTop: SPACING.sm,
  },
  termSelectorLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
    fontWeight: '500',
  },
  pickerContainer: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
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
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: SPACING.md,
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryDivider: {
    width: 1,
    backgroundColor: COLORS.border,
  },
  summaryValue: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  summaryLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  termHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  termHeaderLeft: {
    flex: 1,
  },
  termName: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  termAverage: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  termContent: {
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  termRank: {
    backgroundColor: COLORS.surface,
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.md,
    alignItems: 'center',
  },
  termRankText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.primary,
    fontWeight: '600',
  },
  gradesTable: {
    gap: SPACING.md,
  },
  gradeItem: {
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
  },
  gradeItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  gradeItemLeft: {
    flex: 1,
  },
  gradeItemRight: {
    alignItems: 'flex-end',
  },
  gradeSubject: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  gradeExam: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  gradeValue: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
  },
  gradeItemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  gradeMarks: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
  },
  gradePercentage: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    fontWeight: '600',
  },
  gradeRemarks: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    marginTop: SPACING.xs,
  },
  gradeTeacher: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  chart: {
    marginVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  rankProgressionDetails: {
    marginTop: SPACING.md,
    gap: SPACING.sm,
  },
  rankItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.sm,
  },
  rankTerm: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    fontWeight: '600',
    flex: 1,
  },
  rankValue: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    flex: 1,
    textAlign: 'center',
  },
  rankPercentage: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  comparisonTable: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  comparisonHeader: {
    flexDirection: 'row',
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.surface,
  },
  comparisonHeaderText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  comparisonRow: {
    flexDirection: 'row',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    alignItems: 'center',
  },
  comparisonSubjectColumn: {
    flex: 2,
  },
  comparisonValueColumn: {
    flex: 1,
    textAlign: 'center',
  },
  comparisonText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
  },
  comparisonDiff: {
    fontWeight: '600',
  },
  emptyText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingVertical: SPACING.lg,
  },
  bottomSpacing: {
    height: SPACING.xl,
  },
});

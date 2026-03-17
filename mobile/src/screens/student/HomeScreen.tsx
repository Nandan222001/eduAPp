import React from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text } from '@rneui/themed';
import { COLORS, SPACING } from '@constants';
import { StudentTabScreenProps } from '@types';
import {
  useProfile,
  useAttendanceSummary,
  useAssignments,
  useGrades,
  useAIPrediction,
  useWeakAreas,
  useGamification,
} from '../../hooks/useStudentQueries';
import { WelcomeCard } from '../../components/student/WelcomeCard';
import { AttendanceStatusCard } from '../../components/student/AttendanceStatusCard';
import { UpcomingAssignmentsCard } from '../../components/student/UpcomingAssignmentsCard';
import { RecentGradesCard } from '../../components/student/RecentGradesCard';
import { AIPredictionWidget } from '../../components/student/AIPredictionWidget';
import { WeakAreasPanel } from '../../components/student/WeakAreasPanel';
import { StreakTracker } from '../../components/student/StreakTracker';
import { GamificationWidget } from '../../components/student/GamificationWidget';

type Props = StudentTabScreenProps<'Home'>;

export const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const profileQuery = useProfile();
  const attendanceQuery = useAttendanceSummary();
  const assignmentsQuery = useAssignments();
  const gradesQuery = useGrades();
  const predictionQuery = useAIPrediction();
  const weakAreasQuery = useWeakAreas();
  const gamificationQuery = useGamification();

  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        profileQuery.refetch(),
        attendanceQuery.refetch(),
        assignmentsQuery.refetch(),
        gradesQuery.refetch(),
        predictionQuery.refetch(),
        weakAreasQuery.refetch(),
        gamificationQuery.refetch(),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [
    profileQuery,
    attendanceQuery,
    assignmentsQuery,
    gradesQuery,
    predictionQuery,
    weakAreasQuery,
    gamificationQuery,
  ]);

  const handleViewAllAssignments = () => {
    navigation.navigate('Assignments' as any);
  };

  const handleViewAllGrades = () => {
    navigation.navigate('Grades' as any);
  };

  const isLoading =
    profileQuery.isLoading ||
    attendanceQuery.isLoading ||
    assignmentsQuery.isLoading ||
    gradesQuery.isLoading ||
    predictionQuery.isLoading ||
    weakAreasQuery.isLoading ||
    gamificationQuery.isLoading;

  const hasError =
    profileQuery.isError ||
    attendanceQuery.isError ||
    assignmentsQuery.isError ||
    gradesQuery.isError ||
    predictionQuery.isError ||
    weakAreasQuery.isError ||
    gamificationQuery.isError;

  if (hasError && !isLoading) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Unable to load dashboard data</Text>
        <Text style={styles.errorSubtext}>Pull down to refresh</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={COLORS.primary}
          colors={[COLORS.primary]}
        />
      }
    >
      <WelcomeCard profile={profileQuery.data} isLoading={profileQuery.isLoading} />

      <View style={styles.row}>
        <View style={styles.halfWidth}>
          <AttendanceStatusCard
            attendance={attendanceQuery.data}
            isLoading={attendanceQuery.isLoading}
          />
        </View>
        <View style={styles.halfWidth}>
          <StreakTracker
            streak={gamificationQuery.data?.streak}
            isLoading={gamificationQuery.isLoading}
          />
        </View>
      </View>

      <AIPredictionWidget prediction={predictionQuery.data} isLoading={predictionQuery.isLoading} />

      <UpcomingAssignmentsCard
        assignments={assignmentsQuery.data}
        isLoading={assignmentsQuery.isLoading}
        onViewAll={handleViewAllAssignments}
      />

      <RecentGradesCard
        grades={gradesQuery.data}
        isLoading={gradesQuery.isLoading}
        onViewAll={handleViewAllGrades}
      />

      <WeakAreasPanel weakAreas={weakAreasQuery.data} isLoading={weakAreasQuery.isLoading} />

      <GamificationWidget
        gamification={gamificationQuery.data}
        isLoading={gamificationQuery.isLoading}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  contentContainer: {
    padding: SPACING.md,
    gap: SPACING.md,
  },
  row: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  halfWidth: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SPACING.xl,
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.error,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});

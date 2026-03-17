import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AppState, AppStateStatus } from 'react-native';
import { websocketService } from '../services/websocketService';

export const useGamificationRealtime = (enabled: boolean = true) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) return;

    const unsubscribeGamification = websocketService.subscribe('gamification_update', data => {
      queryClient.setQueryData(['gamification-details'], (old: any) => ({
        ...old,
        ...data,
      }));
    });

    const unsubscribeBadge = websocketService.subscribe('badge_earned', data => {
      queryClient.invalidateQueries({ queryKey: ['gamification-details'] });
    });

    const unsubscribeAchievement = websocketService.subscribe('achievement_unlocked', data => {
      queryClient.invalidateQueries({ queryKey: ['gamification-details'] });
    });

    let intervalId: NodeJS.Timeout;

    const startPolling = () => {
      intervalId = setInterval(() => {
        queryClient.invalidateQueries({ queryKey: ['gamification-details'] });
        queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
        queryClient.invalidateQueries({ queryKey: ['goals'] });
      }, 30000);
    };

    const stopPolling = () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        startPolling();
        queryClient.invalidateQueries({ queryKey: ['gamification-details'] });
        queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
        queryClient.invalidateQueries({ queryKey: ['goals'] });
      } else {
        stopPolling();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    if (AppState.currentState === 'active') {
      startPolling();
    }

    return () => {
      stopPolling();
      subscription.remove();
      unsubscribeGamification();
      unsubscribeBadge();
      unsubscribeAchievement();
    };
  }, [enabled, queryClient]);
};

export const useLeaderboardRealtime = (period: string, enabled: boolean = true) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) return;

    const unsubscribe = websocketService.subscribe('leaderboard_update', data => {
      queryClient.invalidateQueries({ queryKey: ['leaderboard', period] });
    });

    const intervalId = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ['leaderboard', period] });
    }, 15000);

    return () => {
      clearInterval(intervalId);
      unsubscribe();
    };
  }, [period, enabled, queryClient]);
};

export const useGoalsRealtime = (enabled: boolean = true) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) return;

    const unsubscribe = websocketService.subscribe('goal_update', data => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    });

    const intervalId = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    }, 20000);

    return () => {
      clearInterval(intervalId);
      unsubscribe();
    };
  }, [enabled, queryClient]);
};

// Native implementation for background sync
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';

const BACKGROUND_SYNC_TASK = 'background-sync-task';

export const backgroundSyncService = {
  async register(taskFunction: () => Promise<void>): Promise<void> {
    TaskManager.defineTask(BACKGROUND_SYNC_TASK, async () => {
      try {
        await taskFunction();
        return BackgroundFetch.BackgroundFetchResult.NewData;
      } catch (error) {
        console.error('Background sync failed:', error);
        return BackgroundFetch.BackgroundFetchResult.Failed;
      }
    });

    await BackgroundFetch.registerTaskAsync(BACKGROUND_SYNC_TASK, {
      minimumInterval: 15 * 60, // 15 minutes
      stopOnTerminate: false,
      startOnBoot: true,
    });
  },

  async unregister(): Promise<void> {
    await BackgroundFetch.unregisterTaskAsync(BACKGROUND_SYNC_TASK);
  },

  async getStatus(): Promise<any> {
    return await BackgroundFetch.getStatusAsync();
  },
};

export default backgroundSyncService;

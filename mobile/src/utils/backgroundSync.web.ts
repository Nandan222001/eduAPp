// Web stub implementation for background sync
export const backgroundSyncService = {
  async register(_taskFunction: () => Promise<void>): Promise<void> {
    console.warn('Background sync not available on web');
  },

  async unregister(): Promise<void> {
    console.warn('Background sync not available on web');
  },

  async getStatus(): Promise<any> {
    return null;
  },
};

export default backgroundSyncService;

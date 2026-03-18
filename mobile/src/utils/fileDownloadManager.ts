import * as FileSystem from 'expo-file-system';
import { Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface DownloadTask {
  id: string;
  url: string;
  fileName: string;
  fileSize?: number;
  localUri?: string;
  progress: number;
  status: 'pending' | 'downloading' | 'paused' | 'completed' | 'failed' | 'cancelled';
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
  bytesDownloaded: number;
  totalBytes: number;
}

export interface DownloadOptions {
  fileName?: string;
  headers?: Record<string, string>;
  resumable?: boolean;
  onProgress?: (progress: number, bytesDownloaded: number, totalBytes: number) => void;
  onComplete?: (localUri: string) => void;
  onError?: (error: string) => void;
}

const DOWNLOADS_KEY = 'file_downloads';
const DOWNLOADS_DIR = `${FileSystem.documentDirectory}downloads/`;

class FileDownloadManager {
  private activeDownloads: Map<string, FileSystem.DownloadResumable> = new Map();
  private downloadTasks: Map<string, DownloadTask> = new Map();
  private listeners: Set<(tasks: DownloadTask[]) => void> = new Set();

  async initialize(): Promise<void> {
    try {
      await FileSystem.makeDirectoryAsync(DOWNLOADS_DIR, { intermediates: true });
      await this.loadDownloadTasks();
    } catch (error) {
      console.error('Error initializing download manager:', error);
    }
  }

  async loadDownloadTasks(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(DOWNLOADS_KEY);
      if (data) {
        const tasks: DownloadTask[] = JSON.parse(data);
        tasks.forEach(task => this.downloadTasks.set(task.id, task));
      }
    } catch (error) {
      console.error('Error loading download tasks:', error);
    }
  }

  async saveDownloadTasks(): Promise<void> {
    try {
      const tasks = Array.from(this.downloadTasks.values());
      await AsyncStorage.setItem(DOWNLOADS_KEY, JSON.stringify(tasks));
      this.notifyListeners();
    } catch (error) {
      console.error('Error saving download tasks:', error);
    }
  }

  subscribe(listener: (tasks: DownloadTask[]) => void): () => void {
    this.listeners.add(listener);
    listener(this.getAllDownloads());
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    const tasks = this.getAllDownloads();
    this.listeners.forEach(listener => listener(tasks));
  }

  async startDownload(url: string, options: DownloadOptions = {}): Promise<string> {
    const taskId = this.generateTaskId(url);
    const fileName = options.fileName || this.extractFileName(url);
    const localUri = `${DOWNLOADS_DIR}${fileName}`;

    const task: DownloadTask = {
      id: taskId,
      url,
      fileName,
      localUri,
      progress: 0,
      status: 'downloading',
      startedAt: new Date(),
      bytesDownloaded: 0,
      totalBytes: 0,
    };

    this.downloadTasks.set(taskId, task);
    await this.saveDownloadTasks();

    try {
      const callback = (downloadProgress: FileSystem.DownloadProgressData) => {
        const progress =
          downloadProgress.totalBytesExpectedToWrite > 0
            ? downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite
            : 0;

        task.progress = progress * 100;
        task.bytesDownloaded = downloadProgress.totalBytesWritten;
        task.totalBytes = downloadProgress.totalBytesExpectedToWrite;

        this.downloadTasks.set(taskId, { ...task });
        this.notifyListeners();

        if (options.onProgress) {
          options.onProgress(
            progress * 100,
            downloadProgress.totalBytesWritten,
            downloadProgress.totalBytesExpectedToWrite
          );
        }
      };

      const downloadResumable = FileSystem.createDownloadResumable(
        url,
        localUri,
        { headers: options.headers },
        callback
      );

      this.activeDownloads.set(taskId, downloadResumable);

      const result = await downloadResumable.downloadAsync();

      if (result) {
        task.status = 'completed';
        task.progress = 100;
        task.completedAt = new Date();
        task.localUri = result.uri;
        this.downloadTasks.set(taskId, { ...task });
        await this.saveDownloadTasks();

        if (options.onComplete) {
          options.onComplete(result.uri);
        }

        this.activeDownloads.delete(taskId);
        return result.uri;
      }

      throw new Error('Download failed');
    } catch (error: any) {
      task.status = 'failed';
      task.error = error.message || 'Download failed';
      this.downloadTasks.set(taskId, { ...task });
      await this.saveDownloadTasks();

      if (options.onError) {
        options.onError(task.error || 'Download failed');
      }

      this.activeDownloads.delete(taskId);
      throw error;
    }
  }

  async pauseDownload(taskId: string): Promise<void> {
    const download = this.activeDownloads.get(taskId);
    if (download) {
      try {
        await download.pauseAsync();
        const task = this.downloadTasks.get(taskId);
        if (task) {
          task.status = 'paused';
          this.downloadTasks.set(taskId, { ...task });
          await this.saveDownloadTasks();
        }
      } catch (error) {
        console.error('Error pausing download:', error);
      }
    }
  }

  async resumeDownload(taskId: string): Promise<void> {
    const download = this.activeDownloads.get(taskId);
    if (download) {
      try {
        await download.resumeAsync();
        const task = this.downloadTasks.get(taskId);
        if (task) {
          task.status = 'downloading';
          this.downloadTasks.set(taskId, { ...task });
          await this.saveDownloadTasks();
        }
      } catch (error) {
        console.error('Error resuming download:', error);
      }
    }
  }

  async cancelDownload(taskId: string): Promise<void> {
    const download = this.activeDownloads.get(taskId);
    if (download) {
      try {
        await download.pauseAsync();
        const task = this.downloadTasks.get(taskId);
        if (task && task.localUri) {
          const info = await FileSystem.getInfoAsync(task.localUri);
          if (info.exists) {
            await FileSystem.deleteAsync(task.localUri);
          }
        }

        if (task) {
          task.status = 'cancelled';
          this.downloadTasks.set(taskId, { ...task });
          await this.saveDownloadTasks();
        }

        this.activeDownloads.delete(taskId);
      } catch (error) {
        console.error('Error cancelling download:', error);
      }
    }
  }

  async deleteDownload(taskId: string): Promise<void> {
    const task = this.downloadTasks.get(taskId);
    if (task) {
      if (task.localUri) {
        try {
          const info = await FileSystem.getInfoAsync(task.localUri);
          if (info.exists) {
            await FileSystem.deleteAsync(task.localUri);
          }
        } catch (error) {
          console.error('Error deleting file:', error);
        }
      }

      this.downloadTasks.delete(taskId);
      this.activeDownloads.delete(taskId);
      await this.saveDownloadTasks();
    }
  }

  getDownload(taskId: string): DownloadTask | undefined {
    return this.downloadTasks.get(taskId);
  }

  getAllDownloads(): DownloadTask[] {
    return Array.from(this.downloadTasks.values());
  }

  getActiveDownloads(): DownloadTask[] {
    return this.getAllDownloads().filter(
      task => task.status === 'downloading' || task.status === 'pending'
    );
  }

  getCompletedDownloads(): DownloadTask[] {
    return this.getAllDownloads().filter(task => task.status === 'completed');
  }

  async isFileAvailableOffline(url: string): Promise<boolean> {
    const taskId = this.generateTaskId(url);
    const task = this.downloadTasks.get(taskId);

    if (!task || task.status !== 'completed' || !task.localUri) {
      return false;
    }

    try {
      const info = await FileSystem.getInfoAsync(task.localUri);
      return info.exists;
    } catch (error) {
      return false;
    }
  }

  async getOfflineFileUri(url: string): Promise<string | null> {
    const taskId = this.generateTaskId(url);
    const task = this.downloadTasks.get(taskId);

    if (!task || task.status !== 'completed' || !task.localUri) {
      return null;
    }

    try {
      const info = await FileSystem.getInfoAsync(task.localUri);
      return info.exists ? task.localUri : null;
    } catch (error) {
      return null;
    }
  }

  async clearAllDownloads(): Promise<void> {
    for (const task of this.downloadTasks.values()) {
      await this.deleteDownload(task.id);
    }
  }

  private generateTaskId(url: string): string {
    return `download_${Buffer.from(url).toString('base64').slice(0, 20)}_${Date.now()}`;
  }

  private extractFileName(url: string): string {
    const urlParts = url.split('/');
    const fileName = urlParts[urlParts.length - 1].split('?')[0];
    return fileName || `download_${Date.now()}`;
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }
}

export const fileDownloadManager = new FileDownloadManager();

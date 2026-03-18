export interface StudyMaterial {
  id: number;
  title: string;
  description?: string;
  type: 'pdf' | 'video' | 'audio' | 'document' | 'presentation' | 'link' | 'ebook';
  category: 'notes' | 'reference' | 'assignment' | 'practice' | 'lecture' | 'supplementary';
  subjectId: number;
  subjectName: string;
  classId: number;
  className?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  thumbnailUrl?: string;
  duration?: number;
  pageCount?: number;
  uploadedBy: number;
  uploadedByName?: string;
  uploadedAt: string;
  tags?: string[];
  isBookmarked: boolean;
  downloadCount: number;
  viewCount: number;
  rating?: number;
  chapterName?: string;
  topicName?: string;
}

export interface MaterialCategory {
  id: number;
  name: string;
  description?: string;
  materialCount: number;
  icon?: string;
}

export interface MaterialFilter {
  subjectId?: number;
  classId?: number;
  type?: string;
  category?: string;
  search?: string;
  bookmarkedOnly?: boolean;
  sortBy?: 'recent' | 'popular' | 'rating' | 'title';
  page?: number;
  limit?: number;
}

export interface Bookmark {
  id: number;
  materialId: number;
  studentId: number;
  bookmarkedAt: string;
  note?: string;
  lastAccessedAt?: string;
}

export interface DownloadProgress {
  materialId: number;
  progress: number;
  status: 'pending' | 'downloading' | 'completed' | 'failed' | 'paused';
  downloadedBytes: number;
  totalBytes: number;
  filePath?: string;
  error?: string;
}

export interface MaterialStats {
  totalMaterials: number;
  totalBookmarks: number;
  totalDownloads: number;
  recentlyViewed: StudyMaterial[];
  recommended: StudyMaterial[];
}

export interface Subject {
  id: number;
  name: string;
  code: string;
  description?: string;
  materialCount?: number;
  icon?: string;
  color?: string;
}

export interface Chapter {
  id: number;
  subjectId: number;
  name: string;
  description?: string;
  order: number;
  materialCount?: number;
}

export interface Topic {
  id: number;
  chapterId: number;
  name: string;
  description?: string;
  order: number;
  materialCount?: number;
}

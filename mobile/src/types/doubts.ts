export interface Doubt {
  id: number;
  studentId: number;
  studentName: string;
  studentProfilePhoto?: string;
  title: string;
  description: string;
  subjectId: number;
  subjectName: string;
  chapterId?: number;
  chapterName?: string;
  topicId?: number;
  topicName?: string;
  status: 'open' | 'answered' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high';
  attachments?: Attachment[];
  tags?: string[];
  viewCount: number;
  answerCount: number;
  upvoteCount: number;
  isUpvoted: boolean;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  acceptedAnswerId?: number;
}

export interface Attachment {
  id: number;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
}

export interface Answer {
  id: number;
  doubtId: number;
  answeredBy: number;
  answeredByName: string;
  answeredByRole: 'teacher' | 'student' | 'admin';
  answeredByProfilePhoto?: string;
  content: string;
  attachments?: Attachment[];
  upvoteCount: number;
  isUpvoted: boolean;
  isAccepted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DoubtFilter {
  subjectId?: number;
  status?: 'open' | 'answered' | 'resolved' | 'closed';
  priority?: 'low' | 'medium' | 'high';
  search?: string;
  myDoubts?: boolean;
  sortBy?: 'recent' | 'popular' | 'unanswered';
  page?: number;
  limit?: number;
}

export interface DoubtStats {
  totalDoubts: number;
  openDoubts: number;
  answeredDoubts: number;
  resolvedDoubts: number;
  myDoubts: number;
  myAnswers: number;
}

export interface CreateDoubtRequest {
  title: string;
  description: string;
  subjectId: number;
  chapterId?: number;
  topicId?: number;
  priority?: 'low' | 'medium' | 'high';
  tags?: string[];
  attachments?: File[];
}

export interface CreateAnswerRequest {
  doubtId: number;
  content: string;
  attachments?: File[];
}

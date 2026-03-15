import axios from '@/lib/axios';

export interface ContentItem {
  id: string;
  title: string;
  description: string;
  thumbnail_url?: string;
  subject: string;
  topic: string;
  grade: string;
  content_type: 'pdf' | 'video' | 'slides' | 'notes' | 'quiz' | 'worksheet' | 'other';
  file_url: string;
  file_size: number;
  preview_url?: string;
  creator_id: string;
  creator_name: string;
  creator_photo_url?: string;
  creator_rating: number;
  price: number;
  is_free: boolean;
  rating: number;
  total_ratings: number;
  total_purchases: number;
  total_views: number;
  tags: string[];
  status: 'draft' | 'pending_review' | 'approved' | 'rejected' | 'published';
  created_at: string;
  updated_at: string;
  published_at?: string;
}

export interface ContentReview {
  id: string;
  content_id: string;
  user_id: string;
  user_name: string;
  user_photo_url?: string;
  rating: number;
  comment: string;
  is_verified_purchase: boolean;
  helpful_count: number;
  created_at: string;
}

export interface ContentDetails extends ContentItem {
  full_description: string;
  reviews: ContentReview[];
  related_content: ContentItem[];
  learning_objectives: string[];
  prerequisites: string[];
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
}

export interface PurchasedContent {
  id: string;
  content: ContentItem;
  purchased_at: string;
  download_count: number;
  last_accessed_at?: string;
}

export interface CreatorContent extends ContentItem {
  earnings: number;
  pending_earnings: number;
  total_reviews: number;
  average_rating: number;
  views_last_30_days: number;
  purchases_last_30_days: number;
  rejection_reason?: string;
  reviewer_notes?: string;
}

export interface CreatorStats {
  total_content: number;
  total_earnings: number;
  pending_earnings: number;
  total_sales: number;
  total_views: number;
  average_rating: number;
  total_reviews: number;
  credits_earned: number;
  leaderboard_rank?: number;
  top_selling_content: ContentItem[];
  earnings_chart: { date: string; amount: number }[];
  sales_chart: { date: string; count: number }[];
}

export interface CreditTransaction {
  id: string;
  type: 'earned' | 'spent' | 'bonus';
  amount: number;
  description: string;
  content_id?: string;
  content_title?: string;
  created_at: string;
}

export interface CreditBalance {
  total_credits: number;
  earned_credits: number;
  spent_credits: number;
  bonus_credits: number;
  recent_transactions: CreditTransaction[];
}

export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  user_name: string;
  user_photo_url?: string;
  grade: string;
  total_content: number;
  total_sales: number;
  total_earnings: number;
  credits_earned: number;
  average_rating: number;
  badges: string[];
}

export interface ModerationQueue {
  id: string;
  content: ContentItem;
  submitted_at: string;
  submission_notes?: string;
}

export interface ModerationDecision {
  content_id: string;
  decision: 'approve' | 'request_revision' | 'reject';
  feedback?: string;
  suggested_improvements?: string[];
}

export interface ContentUpload {
  title: string;
  description: string;
  full_description: string;
  subject: string;
  topic: string;
  grade: string;
  content_type: 'pdf' | 'video' | 'slides' | 'notes' | 'quiz' | 'worksheet' | 'other';
  file: File;
  thumbnail?: File;
  price: number;
  is_free: boolean;
  tags: string[];
  learning_objectives: string[];
  prerequisites: string[];
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
}

export interface SearchFilters {
  subject?: string;
  topic?: string;
  grade?: string;
  content_type?: string;
  price_type?: 'free' | 'paid' | 'all';
  min_rating?: number;
  sort_by?: 'popular' | 'recent' | 'rating' | 'price_low' | 'price_high';
}

const contentMarketplaceApi = {
  // Browse Content
  searchContent: async (query?: string, filters?: SearchFilters): Promise<ContentItem[]> => {
    const response = await axios.get('/api/content-marketplace/content', {
      params: { query, ...filters },
    });
    return response.data;
  },

  getContentDetails: async (contentId: string): Promise<ContentDetails> => {
    const response = await axios.get(`/api/content-marketplace/content/${contentId}`);
    return response.data;
  },

  purchaseContent: async (
    contentId: string,
    useCredits: boolean = false
  ): Promise<PurchasedContent> => {
    const response = await axios.post(`/api/content-marketplace/content/${contentId}/purchase`, {
      use_credits: useCredits,
    });
    return response.data;
  },

  downloadContent: async (contentId: string): Promise<Blob> => {
    const response = await axios.get(`/api/content-marketplace/content/${contentId}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Reviews
  submitReview: async (
    contentId: string,
    rating: number,
    comment: string
  ): Promise<ContentReview> => {
    const response = await axios.post(`/api/content-marketplace/content/${contentId}/reviews`, {
      rating,
      comment,
    });
    return response.data;
  },

  markReviewHelpful: async (reviewId: string): Promise<void> => {
    await axios.post(`/api/content-marketplace/reviews/${reviewId}/helpful`);
  },

  // My Purchases
  getMyPurchases: async (): Promise<PurchasedContent[]> => {
    const response = await axios.get('/api/content-marketplace/purchases');
    return response.data;
  },

  // Creator Studio
  createContent: async (data: FormData): Promise<ContentItem> => {
    const response = await axios.post('/api/content-marketplace/creator/content', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  updateContent: async (contentId: string, data: FormData): Promise<ContentItem> => {
    const response = await axios.put(
      `/api/content-marketplace/creator/content/${contentId}`,
      data,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data;
  },

  deleteContent: async (contentId: string): Promise<void> => {
    await axios.delete(`/api/content-marketplace/creator/content/${contentId}`);
  },

  getMyContent: async (): Promise<CreatorContent[]> => {
    const response = await axios.get('/api/content-marketplace/creator/content');
    return response.data;
  },

  getCreatorStats: async (): Promise<CreatorStats> => {
    const response = await axios.get('/api/content-marketplace/creator/stats');
    return response.data;
  },

  submitForReview: async (contentId: string, notes?: string): Promise<ContentItem> => {
    const response = await axios.post(
      `/api/content-marketplace/creator/content/${contentId}/submit`,
      { notes }
    );
    return response.data;
  },

  publishContent: async (contentId: string): Promise<ContentItem> => {
    const response = await axios.post(
      `/api/content-marketplace/creator/content/${contentId}/publish`
    );
    return response.data;
  },

  generatePreview: async (contentId: string): Promise<string> => {
    const response = await axios.post(
      `/api/content-marketplace/creator/content/${contentId}/preview`
    );
    return response.data.preview_url;
  },

  // Credits
  getCreditBalance: async (): Promise<CreditBalance> => {
    const response = await axios.get('/api/content-marketplace/credits/balance');
    return response.data;
  },

  getCreditTransactions: async (limit?: number, offset?: number): Promise<CreditTransaction[]> => {
    const response = await axios.get('/api/content-marketplace/credits/transactions', {
      params: { limit, offset },
    });
    return response.data;
  },

  redeemCredits: async (contentId: string): Promise<PurchasedContent> => {
    const response = await axios.post(`/api/content-marketplace/credits/redeem`, {
      content_id: contentId,
    });
    return response.data;
  },

  // Leaderboard
  getLeaderboard: async (limit?: number): Promise<LeaderboardEntry[]> => {
    const response = await axios.get('/api/content-marketplace/leaderboard', {
      params: { limit },
    });
    return response.data;
  },

  // Teacher Moderation
  getModerationQueue: async (): Promise<ModerationQueue[]> => {
    const response = await axios.get('/api/content-marketplace/moderation/queue');
    return response.data;
  },

  moderateContent: async (decision: ModerationDecision): Promise<void> => {
    await axios.post('/api/content-marketplace/moderation/review', decision);
  },

  getModerationHistory: async (limit?: number): Promise<ModerationQueue[]> => {
    const response = await axios.get('/api/content-marketplace/moderation/history', {
      params: { limit },
    });
    return response.data;
  },
};

export { contentMarketplaceApi };

export interface YearbookPage {
  id: number;
  pageNumber: number;
  section: string;
  layout: 'single' | 'double' | 'grid' | 'mosaic' | 'custom';
  elements: PageElement[];
  backgroundImage?: string;
  backgroundColor?: string;
  thumbnailUrl?: string;
}

export interface PageElement {
  id: string;
  type: 'photo' | 'text' | 'quote' | 'decorative';
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  content?: string;
  imageUrl?: string;
  rotation?: number;
  zIndex?: number;
  style?: {
    fontFamily?: string;
    fontSize?: number;
    color?: string;
    fontWeight?: string;
    fontStyle?: string;
    textAlign?: string;
    backgroundColor?: string;
    border?: string;
    borderRadius?: number;
  };
}

export interface Yearbook {
  id: number;
  year: string;
  title: string;
  theme: string;
  coverImage: string;
  totalPages: number;
  status: 'draft' | 'published' | 'archived';
  sections: YearbookSection[];
  publishedDate?: string;
  schoolName: string;
  isPublic: boolean;
}

export interface YearbookSection {
  id: string;
  name: string;
  startPage: number;
  endPage: number;
  icon?: string;
  color?: string;
}

export interface PhotoSubmission {
  id: number;
  studentId: number;
  studentName: string;
  photoUrl: string;
  caption?: string;
  category: 'class' | 'clubs' | 'sports' | 'events' | 'candid' | 'senior';
  uploadDate: string;
  status: 'pending' | 'approved' | 'rejected';
  tags: string[];
  event?: string;
}

export interface MemorySubmission {
  id: number;
  studentId: number;
  studentName: string;
  avatar?: string;
  title: string;
  content: string;
  category: 'favorite-moment' | 'inside-joke' | 'senior-will' | 'quote' | 'advice';
  submittedDate: string;
  status: 'pending' | 'approved' | 'rejected';
  likes: number;
}

export interface YearbookSignature {
  id: number;
  fromStudentId: number;
  fromStudentName: string;
  fromStudentAvatar?: string;
  toStudentId: number;
  message: string;
  signatureType: 'handwritten' | 'typed' | 'sticker' | 'gif';
  signatureData?: string;
  stickers?: string[];
  gifUrl?: string;
  timestamp: string;
  isPublic: boolean;
}

export interface SignatureBook {
  signatures: YearbookSignature[];
  totalCount: number;
  favoriteCount: number;
}

export interface YearbookTemplate {
  id: string;
  name: string;
  description: string;
  category: 'cover' | 'class-photo' | 'clubs' | 'sports' | 'candid' | 'quotes' | 'divider';
  thumbnailUrl: string;
  layout: PageElement[];
  previewUrl?: string;
}

export interface PrintOrder {
  id: number;
  studentId: number;
  studentName: string;
  yearbookId: number;
  yearbookYear: string;
  quantity: number;
  coverOption: 'hardcover' | 'softcover';
  paperQuality: 'standard' | 'premium' | 'glossy';
  totalPrice: number;
  status: 'pending' | 'processing' | 'printing' | 'shipped' | 'delivered';
  orderDate: string;
  estimatedDelivery?: string;
  trackingNumber?: string;
  shippingAddress: {
    name: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    phone: string;
  };
}

export interface ArchivedYearbook {
  id: number;
  year: string;
  title: string;
  coverImage: string;
  totalPages: number;
  schoolName: string;
  accessLevel: 'alumni' | 'public' | 'restricted';
  viewCount: number;
  downloadCount: number;
}

export interface QuoteSubmission {
  id: number;
  studentId: number;
  studentName: string;
  quote: string;
  author?: string;
  category: 'inspirational' | 'funny' | 'personal' | 'memorable';
  submittedDate: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface YearbookAnalytics {
  totalViews: number;
  uniqueVisitors: number;
  averageTimeSpent: number;
  mostViewedPages: {
    pageNumber: number;
    section: string;
    views: number;
  }[];
  popularSections: {
    section: string;
    views: number;
    percentage: number;
  }[];
}

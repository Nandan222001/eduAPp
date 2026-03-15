import axios from 'axios';
import {
  Yearbook,
  YearbookPage,
  PhotoSubmission,
  MemorySubmission,
  YearbookSignature,
  SignatureBook,
  YearbookTemplate,
  PrintOrder,
  ArchivedYearbook,
  QuoteSubmission,
  YearbookAnalytics,
} from '@/types/yearbook';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const yearbookApi = {
  getYearbooks: async (): Promise<Yearbook[]> => {
    const response = await axios.get(`${API_URL}/yearbooks`);
    return response.data;
  },

  getYearbook: async (id: number): Promise<Yearbook> => {
    const response = await axios.get(`${API_URL}/yearbooks/${id}`);
    return response.data;
  },

  getYearbookPages: async (yearbookId: number): Promise<YearbookPage[]> => {
    const response = await axios.get(`${API_URL}/yearbooks/${yearbookId}/pages`);
    return response.data;
  },

  updatePage: async (
    yearbookId: number,
    pageId: number,
    page: Partial<YearbookPage>
  ): Promise<YearbookPage> => {
    const response = await axios.put(`${API_URL}/yearbooks/${yearbookId}/pages/${pageId}`, page);
    return response.data;
  },

  getTemplates: async (): Promise<YearbookTemplate[]> => {
    const response = await axios.get(`${API_URL}/yearbooks/templates`);
    return response.data;
  },

  submitPhoto: async (data: Partial<PhotoSubmission>): Promise<PhotoSubmission> => {
    const response = await axios.post(`${API_URL}/yearbooks/photos`, data);
    return response.data;
  },

  getPhotoSubmissions: async (yearbookId: number): Promise<PhotoSubmission[]> => {
    const response = await axios.get(`${API_URL}/yearbooks/${yearbookId}/photos`);
    return response.data;
  },

  approvePhoto: async (photoId: number): Promise<PhotoSubmission> => {
    const response = await axios.put(`${API_URL}/yearbooks/photos/${photoId}/approve`);
    return response.data;
  },

  submitMemory: async (data: Partial<MemorySubmission>): Promise<MemorySubmission> => {
    const response = await axios.post(`${API_URL}/yearbooks/memories`, data);
    return response.data;
  },

  getMemories: async (yearbookId: number): Promise<MemorySubmission[]> => {
    const response = await axios.get(`${API_URL}/yearbooks/${yearbookId}/memories`);
    return response.data;
  },

  submitQuote: async (data: Partial<QuoteSubmission>): Promise<QuoteSubmission> => {
    const response = await axios.post(`${API_URL}/yearbooks/quotes`, data);
    return response.data;
  },

  getQuotes: async (yearbookId: number): Promise<QuoteSubmission[]> => {
    const response = await axios.get(`${API_URL}/yearbooks/${yearbookId}/quotes`);
    return response.data;
  },

  createSignature: async (data: Partial<YearbookSignature>): Promise<YearbookSignature> => {
    const response = await axios.post(`${API_URL}/yearbooks/signatures`, data);
    return response.data;
  },

  getSignatureBook: async (studentId: number): Promise<SignatureBook> => {
    const response = await axios.get(`${API_URL}/yearbooks/signatures/${studentId}`);
    return response.data;
  },

  searchSignatures: async (studentId: number, query: string): Promise<YearbookSignature[]> => {
    const response = await axios.get(`${API_URL}/yearbooks/signatures/${studentId}/search`, {
      params: { q: query },
    });
    return response.data;
  },

  createPrintOrder: async (data: Partial<PrintOrder>): Promise<PrintOrder> => {
    const response = await axios.post(`${API_URL}/yearbooks/orders`, data);
    return response.data;
  },

  getOrders: async (studentId: number): Promise<PrintOrder[]> => {
    const response = await axios.get(`${API_URL}/yearbooks/orders/${studentId}`);
    return response.data;
  },

  getArchivedYearbooks: async (): Promise<ArchivedYearbook[]> => {
    const response = await axios.get(`${API_URL}/yearbooks/archive`);
    return response.data;
  },

  getAnalytics: async (yearbookId: number): Promise<YearbookAnalytics> => {
    const response = await axios.get(`${API_URL}/yearbooks/${yearbookId}/analytics`);
    return response.data;
  },

  createYearbook: async (data: Partial<Yearbook>): Promise<Yearbook> => {
    const response = await axios.post(`${API_URL}/yearbooks`, data);
    return response.data;
  },

  publishYearbook: async (yearbookId: number): Promise<Yearbook> => {
    const response = await axios.post(`${API_URL}/yearbooks/${yearbookId}/publish`);
    return response.data;
  },
};

export default yearbookApi;

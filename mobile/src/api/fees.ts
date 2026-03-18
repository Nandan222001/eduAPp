import { apiClient } from './client';
import {
  FeeStructure,
  OutstandingFees,
  PaymentHistory,
  FeeReceipt,
  PaymentRequest,
  FeeStats,
} from '@types';

export interface FeeFilter {
  academicYearId?: number;
  feeType?: string;
  status?: 'paid' | 'partial' | 'pending' | 'overdue';
  startDate?: string;
  endDate?: string;
}

export const feesApi = {
  getFeeStructure: async (studentId?: number, academicYearId?: number): Promise<FeeStructure[]> => {
    const params: any = {};
    if (academicYearId) params.academicYearId = academicYearId;
    if (studentId) params.studentId = studentId;

    const response = await apiClient.get<FeeStructure[]>('/api/v1/fees/structure', {
      params,
    });
    return response.data;
  },

  getOutstanding: async (studentId?: number): Promise<OutstandingFees> => {
    const endpoint = studentId
      ? `/api/v1/fees/outstanding?studentId=${studentId}`
      : '/api/v1/fees/outstanding';
    const response = await apiClient.get<OutstandingFees>(endpoint);
    return response.data;
  },

  getPaymentHistory: async (filter?: FeeFilter, studentId?: number): Promise<PaymentHistory[]> => {
    const endpoint = studentId
      ? `/api/v1/fees/payments?studentId=${studentId}`
      : '/api/v1/fees/payments';

    const response = await apiClient.get<PaymentHistory[]>(endpoint, {
      params: filter,
    });
    return response.data;
  },

  getPaymentById: async (paymentId: number): Promise<PaymentHistory> => {
    const response = await apiClient.get<PaymentHistory>(`/api/v1/fees/payments/${paymentId}`);
    return response.data;
  },

  getReceipt: async (paymentId: number): Promise<FeeReceipt> => {
    const response = await apiClient.get<FeeReceipt>(`/api/v1/fees/payments/${paymentId}/receipt`);
    return response.data;
  },

  downloadReceipt: async (paymentId: number): Promise<{ downloadUrl: string }> => {
    const response = await apiClient.get<{ downloadUrl: string }>(
      `/api/v1/fees/payments/${paymentId}/receipt/download`
    );
    return response.data;
  },

  initiatePayment: async (
    paymentRequest: PaymentRequest
  ): Promise<{ paymentUrl: string; transactionId: string }> => {
    const response = await apiClient.post<{ paymentUrl: string; transactionId: string }>(
      '/api/v1/fees/payments/initiate',
      paymentRequest
    );
    return response.data;
  },

  verifyPayment: async (transactionId: string): Promise<PaymentHistory> => {
    const response = await apiClient.post<PaymentHistory>(
      `/api/v1/fees/payments/${transactionId}/verify`,
      {}
    );
    return response.data;
  },

  getStats: async (studentId?: number): Promise<FeeStats> => {
    const endpoint = studentId ? `/api/v1/fees/stats?studentId=${studentId}` : '/api/v1/fees/stats';
    const response = await apiClient.get<FeeStats>(endpoint);
    return response.data;
  },

  getFeesByAcademicYear: async (
    academicYearId: number,
    studentId?: number
  ): Promise<FeeStructure[]> => {
    const params: any = { academicYearId };
    if (studentId) params.studentId = studentId;

    const response = await apiClient.get<FeeStructure[]>('/api/v1/fees/academic-year', {
      params,
    });
    return response.data;
  },

  getUpcomingDues: async (studentId?: number): Promise<OutstandingFees> => {
    const endpoint = studentId
      ? `/api/v1/fees/upcoming?studentId=${studentId}`
      : '/api/v1/fees/upcoming';
    const response = await apiClient.get<OutstandingFees>(endpoint);
    return response.data;
  },

  getOverdueFees: async (studentId?: number): Promise<OutstandingFees> => {
    const endpoint = studentId
      ? `/api/v1/fees/overdue?studentId=${studentId}`
      : '/api/v1/fees/overdue';
    const response = await apiClient.get<OutstandingFees>(endpoint);
    return response.data;
  },
};

export interface FeeStructure {
  id: number;
  academicYearId: number;
  academicYear: string;
  classId: number;
  className: string;
  feeType:
    | 'tuition'
    | 'transport'
    | 'hostel'
    | 'library'
    | 'lab'
    | 'sports'
    | 'examination'
    | 'miscellaneous';
  amount: number;
  frequency: 'one_time' | 'monthly' | 'quarterly' | 'half_yearly' | 'annual';
  dueDate?: string;
  description?: string;
  isOptional: boolean;
  components?: FeeComponent[];
}

export interface FeeComponent {
  id: number;
  name: string;
  amount: number;
  description?: string;
  isOptional: boolean;
}

export interface OutstandingFees {
  totalOutstanding: number;
  totalPaid: number;
  totalFees: number;
  overdueAmount: number;
  upcomingAmount: number;
  items: OutstandingFeeItem[];
  nextDueDate?: string;
  lastPaymentDate?: string;
}

export interface OutstandingFeeItem {
  id: number;
  feeType: string;
  description: string;
  amount: number;
  paidAmount: number;
  balanceAmount: number;
  dueDate: string;
  status: 'paid' | 'partial' | 'pending' | 'overdue';
  isOverdue: boolean;
  lateFee?: number;
  discount?: number;
}

export interface PaymentHistory {
  id: number;
  transactionId: string;
  receiptNumber: string;
  amount: number;
  paymentDate: string;
  paymentMethod: 'cash' | 'card' | 'upi' | 'netbanking' | 'cheque' | 'online';
  status: 'success' | 'pending' | 'failed' | 'refunded';
  feeType: string;
  description?: string;
  academicYear: string;
  receiptUrl?: string;
  remarks?: string;
  paidBy?: string;
  processedBy?: string;
}

export interface FeeReceipt {
  receiptNumber: string;
  transactionId: string;
  studentId: number;
  studentName: string;
  className: string;
  rollNumber: string;
  paymentDate: string;
  academicYear: string;
  items: FeeReceiptItem[];
  totalAmount: number;
  amountPaid: number;
  discount?: number;
  lateFee?: number;
  paymentMethod: string;
  remarks?: string;
  issuedBy?: string;
  institutionName: string;
  institutionAddress?: string;
  institutionPhone?: string;
  institutionEmail?: string;
}

export interface FeeReceiptItem {
  description: string;
  feeType: string;
  amount: number;
}

export interface PaymentRequest {
  feeItemIds: number[];
  amount: number;
  paymentMethod: 'cash' | 'card' | 'upi' | 'netbanking' | 'cheque' | 'online';
  remarks?: string;
}

export interface FeeStats {
  totalPaid: number;
  totalOutstanding: number;
  totalOverdue: number;
  paymentCount: number;
  lastPaymentDate?: string;
  nextDueDate?: string;
}

export type MistakeSeverity = 'critical' | 'moderate' | 'minor';

export interface MistakeOccurrence {
  id: number;
  exam_name: string;
  subject: string;
  question_number: number;
  date: string;
  marks_lost: number;
  student_answer?: string;
  correct_answer?: string;
  explanation?: string;
}

export interface MistakePattern {
  id: number;
  mistake_type: string;
  severity: MistakeSeverity;
  frequency: number;
  total_marks_lost: number;
  category: string;
  description: string;
  occurrences: MistakeOccurrence[];
  memory_tricks: string[];
  practice_links: Array<{
    title: string;
    url: string;
  }>;
  mastery_level: number;
}

export interface MistakeReplayData {
  student_id: number;
  student_name: string;
  period: string;
  month: string;
  year: number;
  total_mistakes: number;
  total_marks_lost: number;
  patterns_by_severity: {
    critical: MistakePattern[];
    moderate: MistakePattern[];
    minor: MistakePattern[];
  };
  improvement_rate: number;
  most_improved_area?: string;
}

export interface SillyMistake {
  id: number;
  exam_id: number;
  exam_name: string;
  subject: string;
  question_number: number;
  question_text: string;
  student_answer: string;
  correct_answer: string;
  marks_lost: number;
  mistake_type: string;
  ai_confidence: number;
  ai_explanation: string;
  date: string;
  is_reviewed: boolean;
  is_confirmed: boolean;
  student_notes?: string;
}

export interface TokenEarningCriteria {
  id: string;
  name: string;
  description: string;
  tokens_reward: number;
  current_progress: number;
  target_progress: number;
  is_completed: boolean;
  deadline?: string;
}

export interface TokenTransaction {
  id: number;
  type: 'earn' | 'spend';
  amount: number;
  reason: string;
  date: string;
  balance_after: number;
}

export interface MistakeInsuranceData {
  student_id: number;
  student_name: string;
  token_balance: number;
  earning_criteria: TokenEarningCriteria[];
  pending_silly_mistakes: SillyMistake[];
  potential_score_improvement: number;
  transaction_history: TokenTransaction[];
  insurance_claims_available: number;
  insurance_claims_used: number;
}

export interface MistakeCorrection {
  silly_mistake_id: number;
  is_confirmed_silly: boolean;
  student_explanation: string;
  corrected_answer?: string;
}

export interface BeforeAfterComparison {
  before: {
    score: number;
    rank?: number;
    mistakes_count: number;
  };
  after: {
    projected_score: number;
    projected_rank?: number;
    corrected_mistakes: number;
  };
  improvement_percentage: number;
}

export enum VentureStatus {
  IDEA = 'idea',
  DEVELOPMENT = 'development',
  LAUNCHED = 'launched',
  FUNDED = 'funded',
  CLOSED = 'closed',
}

export enum CompetitionStatus {
  UPCOMING = 'upcoming',
  OPEN = 'open',
  JUDGING = 'judging',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum MentorshipStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum FundingStatus {
  REQUESTED = 'requested',
  UNDER_REVIEW = 'under_review',
  APPROVED = 'approved',
  DISBURSED = 'disbursed',
  REJECTED = 'rejected',
}

export interface StudentVenture {
  id: number;
  institution_id: number;
  venture_name: string;
  tagline?: string;
  founder_students: number[];
  primary_founder_id: number;
  business_idea: string;
  problem_statement: string;
  solution: string;
  target_market: string;
  revenue_model?: string;
  pitch_deck_url?: string;
  business_plan_url?: string;
  logo_url?: string;
  website_url?: string;
  mentor_id?: number;
  funding_requested?: number;
  funding_received: number;
  currency: string;
  venture_status: VentureStatus;
  metrics?: VentureMetrics;
  customers: number;
  revenue: number;
  social_impact?: string;
  milestones?: Milestone[];
  team_roles?: TeamRole[];
  achievements?: Achievement[];
  pitch_competition_participations?: number[];
  awards?: Award[];
  is_active: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  primary_founder?: StudentInfo;
  mentor?: EntrepreneurshipMentor;
  team_members?: StudentInfo[];
}

export interface VentureMetrics {
  customer_acquisition_rate?: number;
  monthly_revenue_growth?: number;
  social_impact_score?: number;
  user_retention_rate?: number;
  market_validation_score?: number;
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  target_date: string;
  completed: boolean;
  completed_date?: string;
}

export interface TeamRole {
  student_id: number;
  role: string;
  responsibilities: string[];
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  date: string;
  type: string;
}

export interface Award {
  id: string;
  name: string;
  organization: string;
  date: string;
  amount?: number;
}

export interface StudentInfo {
  id: number;
  first_name: string;
  last_name: string;
  grade: string;
  photo_url?: string;
}

export interface PitchCompetition {
  id: number;
  institution_id: number;
  competition_name: string;
  description: string;
  theme?: string;
  judges?: number[];
  judge_details?: JudgeInfo[];
  prize_pool?: number;
  currency: string;
  prizes?: Prize[];
  submission_deadline: string;
  competition_date?: string;
  eligibility_criteria?: EligibilityCriteria;
  evaluation_criteria?: EvaluationCriteria[];
  max_participants?: number;
  current_participants: number;
  status: CompetitionStatus;
  winner_venture_id?: number;
  runners_up?: number[];
  leaderboard?: LeaderboardEntry[];
  final_results?: FinalResult[];
  recording_url?: string;
  highlights_url?: string;
  is_public: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface JudgeInfo {
  id: number;
  name: string;
  title: string;
  organization: string;
  photo_url?: string;
}

export interface Prize {
  rank: number;
  title: string;
  amount?: number;
  description?: string;
}

export interface EligibilityCriteria {
  min_grade?: string;
  max_grade?: string;
  venture_status?: VentureStatus[];
  max_team_size?: number;
}

export interface EvaluationCriteria {
  id: string;
  name: string;
  description: string;
  max_score: number;
  weight: number;
}

export interface LeaderboardEntry {
  venture_id: number;
  venture_name: string;
  total_score: number;
  rank: number;
}

export interface FinalResult {
  venture_id: number;
  venture_name: string;
  rank: number;
  total_score: number;
  prize?: string;
}

export interface PitchSubmission {
  id: number;
  institution_id: number;
  competition_id: number;
  venture_id: number;
  pitch_video_url?: string;
  presentation_url?: string;
  supporting_documents?: SupportingDocument[];
  submission_date: string;
  judge_scores?: JudgeScore[];
  total_score?: number;
  rank?: number;
  feedback?: Feedback[];
  audience_votes: number;
  is_finalist: boolean;
  is_winner: boolean;
  created_at: string;
  updated_at: string;
  venture?: StudentVenture;
}

export interface SupportingDocument {
  name: string;
  url: string;
  type: string;
}

export interface JudgeScore {
  judge_id: number;
  judge_name: string;
  criteria_scores: CriteriaScore[];
  total_score: number;
  comments?: string;
}

export interface CriteriaScore {
  criteria_id: string;
  score: number;
}

export interface Feedback {
  judge_id: number;
  judge_name: string;
  comment: string;
  created_at: string;
}

export interface EntrepreneurshipMentor {
  id: number;
  institution_id?: number;
  user_id?: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  expertise_areas: string[];
  industry_experience?: IndustryExperience[];
  current_position?: string;
  company?: string;
  bio?: string;
  linkedin_url?: string;
  photo_url?: string;
  years_of_experience?: number;
  successful_ventures?: SuccessfulVenture[];
  mentoring_capacity: number;
  current_mentees: number;
  available_for_mentoring: boolean;
  preferred_communication?: string[];
  availability_schedule?: AvailabilitySlot[];
  total_mentorships: number;
  average_rating?: number;
  is_active: boolean;
  is_verified: boolean;
  verified_at?: string;
  created_at: string;
  updated_at: string;
}

export interface IndustryExperience {
  industry: string;
  years: number;
  role?: string;
}

export interface SuccessfulVenture {
  name: string;
  description: string;
  outcome: string;
  year?: number;
}

export interface AvailabilitySlot {
  day: string;
  start_time: string;
  end_time: string;
}

export interface MentorshipRelationship {
  id: number;
  institution_id: number;
  mentor_id: number;
  venture_id: number;
  match_score?: number;
  matching_criteria?: MatchingCriteria;
  status: MentorshipStatus;
  start_date?: string;
  end_date?: string;
  duration_weeks?: number;
  goals?: string[];
  meeting_frequency?: string;
  total_meetings: number;
  progress_notes?: ProgressNote[];
  student_feedback?: string;
  mentor_feedback?: string;
  student_rating?: number;
  mentor_rating?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  mentor?: EntrepreneurshipMentor;
  venture?: StudentVenture;
}

export interface MatchingCriteria {
  expertise_match: number;
  industry_match: number;
  availability_match: number;
}

export interface ProgressNote {
  date: string;
  note: string;
  author: string;
}

export interface VentureFundingRequest {
  id: number;
  institution_id: number;
  venture_id: number;
  amount_requested: number;
  currency: string;
  funding_purpose: string;
  use_of_funds_breakdown?: FundsBreakdown[];
  justification: string;
  expected_outcomes?: string;
  supporting_documents?: SupportingDocument[];
  financial_projections?: FinancialProjection[];
  status: FundingStatus;
  reviewed_by?: number;
  review_date?: string;
  review_notes?: string;
  approved_amount?: number;
  disbursed_amount?: number;
  disbursement_date?: string;
  terms_and_conditions?: TermsCondition[];
  reporting_requirements?: ReportingRequirement[];
  created_at: string;
  updated_at: string;
  venture?: StudentVenture;
  reviewer?: UserInfo;
}

export interface FundsBreakdown {
  category: string;
  amount: number;
  description: string;
}

export interface FinancialProjection {
  period: string;
  revenue: number;
  expenses: number;
  profit: number;
}

export interface TermsCondition {
  title: string;
  description: string;
}

export interface ReportingRequirement {
  title: string;
  description: string;
  due_date: string;
}

export interface UserInfo {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
}

export interface VentureBuilderTemplate {
  id: string;
  section: string;
  title: string;
  description: string;
  prompts: string[];
  examples?: string[];
}

export interface BusinessPlanData {
  executive_summary?: string;
  business_description?: string;
  market_analysis?: string;
  organization_management?: string;
  marketing_sales?: string;
  financial_projections?: FinancialProjection[];
  funding_request?: string;
  appendix?: string;
}

export interface PitchDeckSlide {
  id: string;
  type: string;
  title: string;
  content: string;
  layout: string;
  design?: SlideDesign;
}

export interface SlideDesign {
  background_color?: string;
  text_color?: string;
  font_family?: string;
  template?: string;
}

export interface LogoDesign {
  business_name: string;
  tagline?: string;
  color_scheme: string[];
  style: string;
  icon?: string;
  font_family?: string;
}

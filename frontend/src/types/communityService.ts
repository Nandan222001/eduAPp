export interface ServiceLog {
  id: number;
  student_id: number;
  student_name: string;
  activity_name: string;
  organization_name: string;
  organization_contact_name?: string;
  organization_contact_email?: string;
  organization_contact_phone?: string;
  category: ServiceCategory;
  start_date: string;
  end_date: string;
  hours: number;
  location: string;
  description: string;
  reflection_essay?: string;
  beneficiaries_served?: number;
  skills_developed: string[];
  verification_status: VerificationStatus;
  verification_code?: string;
  verified_by?: string;
  verified_at?: string;
  rejection_reason?: string;
  attachments?: ServiceAttachment[];
  created_at: string;
  updated_at: string;
}

export interface ServiceAttachment {
  id: number;
  file_name: string;
  file_url: string;
  file_type: string;
  uploaded_at: string;
}

export enum ServiceCategory {
  ENVIRONMENT = 'environment',
  EDUCATION = 'education',
  HEALTHCARE = 'healthcare',
  COMMUNITY_DEVELOPMENT = 'community_development',
  ANIMAL_WELFARE = 'animal_welfare',
  ELDERLY_CARE = 'elderly_care',
  HUNGER_RELIEF = 'hunger_relief',
  DISASTER_RELIEF = 'disaster_relief',
  ARTS_CULTURE = 'arts_culture',
  SPORTS_RECREATION = 'sports_recreation',
  OTHER = 'other',
}

export enum VerificationStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  VERIFIED = 'verified',
}

export interface ServiceLogForm {
  activity_name: string;
  organization_name: string;
  organization_contact_name?: string;
  organization_contact_email?: string;
  organization_contact_phone?: string;
  category: ServiceCategory;
  start_date: string;
  end_date: string;
  hours: number;
  location: string;
  description: string;
  reflection_essay?: string;
  beneficiaries_served?: number;
  skills_developed: string[];
}

export interface ServicePortfolio {
  student_id: number;
  student_name: string;
  total_hours: number;
  approved_hours: number;
  pending_hours: number;
  hours_by_category: {
    category: ServiceCategory;
    hours: number;
    percentage: number;
  }[];
  timeline: ServiceLog[];
  impact_summary: {
    total_beneficiaries: number;
    organizations_served: number;
    activities_completed: number;
    skills_gained: string[];
  };
  verification_stats: {
    pending: number;
    approved: number;
    rejected: number;
  };
  progress_toward_requirement: {
    required_hours: number;
    completed_hours: number;
    percentage: number;
    is_completed: boolean;
  };
}

export interface ServiceHourCertificate {
  certificate_id: string;
  student_name: string;
  student_id: string;
  grade: string;
  total_hours: number;
  approved_hours: number;
  activity_breakdown: {
    category: string;
    hours: number;
    activities: string[];
  }[];
  issue_date: string;
  academic_year: string;
  school_name: string;
  school_seal?: string;
  principal_name: string;
  principal_signature?: string;
  counselor_name?: string;
  counselor_signature?: string;
}

export interface ServiceOpportunity {
  id: number;
  organization_name: string;
  organization_logo?: string;
  title: string;
  description: string;
  category: ServiceCategory;
  interest_areas: string[];
  location: string;
  time_commitment: string;
  age_requirements: {
    min_age: number;
    max_age?: number;
  };
  spots_available?: number;
  spots_filled: number;
  start_date?: string;
  end_date?: string;
  contact_name: string;
  contact_email: string;
  contact_phone?: string;
  requirements: string[];
  benefits: string[];
  is_recurring: boolean;
  schedule?: string;
  remote_option: boolean;
  status: 'active' | 'full' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface ServiceOpportunityApplication {
  id: number;
  opportunity_id: number;
  student_id: number;
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
  cover_letter?: string;
  applied_at: string;
  updated_at: string;
}

export interface ServiceReflectionEntry {
  id: number;
  student_id: number;
  service_log_id?: number;
  date: string;
  title: string;
  reflection_text: string;
  learnings: string[];
  challenges_faced: string[];
  personal_growth_areas: string[];
  skills_applied: string[];
  emotions: string[];
  future_goals: string[];
  created_at: string;
  updated_at: string;
}

export interface GraduationRequirementProgress {
  student_id: number;
  student_name: string;
  grade: string;
  required_hours: number;
  completed_hours: number;
  pending_hours: number;
  percentage_complete: number;
  is_on_track: boolean;
  is_at_risk: boolean;
  projected_completion_date?: string;
  activities_count: number;
  last_activity_date?: string;
  notes?: string;
}

export interface ServiceVerificationRequest {
  verification_code: string;
  student_name: string;
  organization_name: string;
  activity_name: string;
  hours: number;
  date_range: string;
  description: string;
}

export interface ServiceVerificationResponse {
  status: 'approved' | 'rejected';
  notes?: string;
  verifier_name?: string;
  verifier_email?: string;
}

export interface OrganizationContact {
  id: number;
  organization_name: string;
  contact_name: string;
  contact_email: string;
  contact_phone?: string;
  address?: string;
  website?: string;
  category: ServiceCategory;
  notes?: string;
  activities_count: number;
  total_hours: number;
  last_activity_date?: string;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface ServiceStats {
  total_students: number;
  active_students: number;
  total_hours: number;
  average_hours_per_student: number;
  completion_rate: number;
  at_risk_students: number;
  categories_breakdown: {
    category: ServiceCategory;
    student_count: number;
    hours: number;
  }[];
  monthly_trends: {
    month: string;
    hours: number;
    students: number;
  }[];
}

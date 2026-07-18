// Types mirror the backend Pydantic schemas. Keep in sync (or generate from OpenAPI in v2).

export type UserRole = 'worker' | 'company';

export type Profession =
  | 'elettricista'
  | 'idraulico'
  | 'muratore'
  | 'carpentiere'
  | 'piastrellista'
  | 'falegname'
  | 'imbianchino'
  | 'saldatore'
  | 'gruista'
  | 'termoidraulico'
  | 'cartongessista'
  | 'operatore_escavatore';

export const PROFESSIONS: { value: Profession; label: string; icon: string }[] = [
  { value: 'elettricista', label: 'Elettricista', icon: '⚡' },
  { value: 'idraulico', label: 'Idraulico', icon: '🔧' },
  { value: 'termoidraulico', label: 'Termoidraulico', icon: '🔥' },
  { value: 'muratore', label: 'Muratore', icon: '🧱' },
  { value: 'carpentiere', label: 'Carpentiere', icon: '🪚' },
  { value: 'piastrellista', label: 'Piastrellista', icon: '⬛' },
  { value: 'falegname', label: 'Falegname', icon: '🪵' },
  { value: 'imbianchino', label: 'Imbianchino', icon: '🎨' },
  { value: 'saldatore', label: 'Saldatore', icon: '⚙️' },
  { value: 'gruista', label: 'Gruista', icon: '🏗️' },
  { value: 'cartongessista', label: 'Cartongessista', icon: '📐' },
  { value: 'operatore_escavatore', label: 'Operatore escavatore', icon: '🚜' },
];

export const PROFESSION_LABELS: Record<Profession, string> = Object.fromEntries(
  PROFESSIONS.map((p) => [p.value, p.label])
) as Record<Profession, string>;

export type AvailabilityStatus = 'immediate' | 'within_week' | 'within_month' | 'not_looking';
export type JobType = 'permanent' | 'temporary' | 'freelance' | 'subcontract';
export type JobStatus = 'open' | 'closed' | 'filled';
export type ApplicationStatus =
  | 'applied'
  | 'shortlisted'
  | 'interview'
  | 'hired'
  | 'rejected'
  | 'completed';

export const APP_STATUS_LABEL: Record<ApplicationStatus, string> = {
  applied: 'Candidatura',
  shortlisted: 'In shortlist',
  interview: 'Colloquio',
  hired: 'Ingaggiato',
  rejected: 'Rifiutato',
  completed: 'Completato',
};

export const JOB_TYPE_LABEL: Record<JobType, string> = {
  permanent: 'Assunzione',
  temporary: 'Temporaneo',
  freelance: 'Freelance',
  subcontract: 'Subappalto',
};

export interface AuthToken {
  access_token: string;
  token_type: string;
  user_id: number;
  role: UserRole;
}

export interface CurrentUser {
  id: number;
  email: string;
  role: UserRole;
  is_verified: boolean;
}

export interface WorkerProfile {
  id: number;
  user_id: number;
  first_name: string;
  last_name: string;
  bio: string | null;
  profession: Profession;
  years_experience: number;
  city: string;
  latitude: number;
  longitude: number;
  travel_radius_km: number;
  willing_to_relocate: boolean;
  hourly_rate_min: number;
  hourly_rate_max: number;
  availability: AvailabilityStatus;
  ai_score: number;
}

export interface WorkerSearchResult extends WorkerProfile {
  distance_km: number;
  match_score: number;
}

export interface ScoreBreakdown {
  total: number;
  components: { name: string; value: number; weight: number }[];
}

export interface Company {
  id: number;
  user_id: number;
  legal_name: string;
  vat_number: string;
  description: string | null;
  city: string;
  employee_count: number;
}

export interface CompanyBrief {
  id: number;
  legal_name: string;
  city: string;
}

export interface JobPost {
  id: number;
  title: string;
  description: string;
  profession: Profession;
  job_type: JobType;
  city: string;
  latitude: number;
  longitude: number;
  salary_min: number;
  salary_max: number;
  is_urgent: boolean;
  min_years_experience: number;
  status: JobStatus;
  created_at: string;
  company: CompanyBrief;
}

export interface Application {
  id: number;
  status: ApplicationStatus;
  cover_message: string | null;
  match_score: number;
  applied_at: string;
  job: JobPost;
  worker: WorkerProfile;
}

// ---- Fase 2: certificazioni, portfolio, messaggi, badge ----
export type CertificationKind = 'certificazione' | 'patentino' | 'patente';

export interface Certification {
  id: number;
  kind: CertificationKind;
  name: string;
  issuer: string | null;
  issued_year: number | null;
  expires_year: number | null;
  verification_status: 'pending' | 'verified' | 'rejected';
}

export interface PortfolioItem {
  id: number;
  worker_id: number;
  title: string;
  description: string | null;
  role: string | null;
  client_name: string | null;
  city: string | null;
  year: number | null;
  duration_weeks: number | null;
  materials: string | null;
  company_id: number | null;
  confirmed: boolean;
  confirmed_at: string | null;
}

export interface Conversation {
  id: number;
  other_user_id: number;
  other_name: string;
  other_role: string;
  last_message_preview: string | null;
  last_message_at: string | null;
}

export interface ChatMessage {
  id: number;
  conversation_id: number;
  sender_user_id: number;
  body: string;
  created_at: string;
}

export interface Badge {
  code: string;
  label: string;
  icon: string;
  description: string;
}

export interface ReviewWithAuthor {
  id: number;
  author_role: string;
  author_name: string;
  rating: number;
  punctuality: number | null;
  quality: number | null;
  communication: number | null;
  comment: string | null;
  created_at: string;
}

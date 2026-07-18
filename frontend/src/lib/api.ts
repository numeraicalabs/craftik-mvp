// Thin API client with typed helpers. In v2, generate from OpenAPI.
import type {
  Application,
  Badge,
  Certification,
  ChatMessage,
  Conversation,
  PortfolioItem,
  ReviewWithAuthor,
  AuthToken,
  Company,
  CurrentUser,
  JobPost,
  Profession,
  ScoreBreakdown,
  WorkerProfile,
  WorkerSearchResult,
} from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, opts: RequestInit = {}, token?: string | null): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(opts.headers as Record<string, string> | undefined),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...opts, headers });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body?.detail ?? detail;
    } catch {
      /* body might not be JSON */
    }
    throw new ApiError(res.status, typeof detail === 'string' ? detail : JSON.stringify(detail));
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

// ---- Auth ----
export const api = {
  auth: {
    loginJson: (email: string, password: string) =>
      request<AuthToken>('/auth/login/json', { method: 'POST', body: JSON.stringify({ email, password }) }),

    registerWorker: (payload: {
      email: string; password: string; first_name: string; last_name: string;
      profession: Profession; city: string; latitude: number; longitude: number;
      years_experience: number; travel_radius_km: number;
    }) => request<AuthToken>('/auth/register/worker', { method: 'POST', body: JSON.stringify(payload) }),

    registerCompany: (payload: {
      email: string; password: string; legal_name: string; vat_number: string;
      city: string; employee_count: number;
    }) => request<AuthToken>('/auth/register/company', { method: 'POST', body: JSON.stringify(payload) }),

    me: (token: string) => request<CurrentUser>('/auth/me', {}, token),
  },

  // ---- Workers ----
  workers: {
    getMe: (token: string) => request<WorkerProfile>('/workers/me', {}, token),

    updateMe: (payload: Partial<WorkerProfile>, token: string) =>
      request<WorkerProfile>('/workers/me', { method: 'PATCH', body: JSON.stringify(payload) }, token),

    getScoreBreakdown: (token: string) =>
      request<ScoreBreakdown>('/workers/me/score', {}, token),

    getById: (id: number, token: string) => request<WorkerProfile>(`/workers/${id}`, {}, token),

    search: (
      params: {
        profession?: Profession | ''; latitude: number; longitude: number;
        radius_km: number; min_score?: number;
      },
      token: string,
    ) => {
      const q = new URLSearchParams();
      if (params.profession) q.set('profession', params.profession);
      q.set('latitude', String(params.latitude));
      q.set('longitude', String(params.longitude));
      q.set('radius_km', String(params.radius_km));
      if (params.min_score) q.set('min_score', String(params.min_score));
      return request<WorkerSearchResult[]>(`/workers?${q}`, {}, token);
    },
  },

  // ---- Companies ----
  companies: {
    getMe: (token: string) => request<Company>('/companies/me', {}, token),
    getById: (id: number, token: string) => request<Company>(`/companies/${id}`, {}, token),
  },

  // ---- Jobs ----
  jobs: {
    list: (
      params: {
        profession?: Profession | ''; latitude?: number; longitude?: number;
        radius_km?: number; is_urgent?: boolean;
      },
      token: string,
    ) => {
      const q = new URLSearchParams();
      if (params.profession) q.set('profession', params.profession);
      if (params.latitude != null) q.set('latitude', String(params.latitude));
      if (params.longitude != null) q.set('longitude', String(params.longitude));
      if (params.radius_km != null) q.set('radius_km', String(params.radius_km));
      if (params.is_urgent != null) q.set('is_urgent', String(params.is_urgent));
      return request<JobPost[]>(`/jobs?${q}`, {}, token);
    },
    listMine: (token: string) => request<JobPost[]>('/jobs/mine', {}, token),
    getById: (id: number, token: string) => request<JobPost>(`/jobs/${id}`, {}, token),
    create: (payload: Omit<JobPost, 'id' | 'created_at' | 'company' | 'status'>, token: string) =>
      request<JobPost>('/jobs', { method: 'POST', body: JSON.stringify(payload) }, token),
  },

  // ---- Applications ----
  applications: {
    listMine: (token: string) => request<Application[]>('/applications/mine', {}, token),
    listForJob: (jobId: number, token: string) =>
      request<Application[]>(`/applications/jobs/${jobId}`, {}, token),
    apply: (jobId: number, cover_message: string, token: string) =>
      request<Application>(
        `/applications/jobs/${jobId}`,
        { method: 'POST', body: JSON.stringify({ cover_message }) },
        token,
      ),
    updateStatus: (id: number, status: string, token: string) =>
      request<Application>(
        `/applications/${id}`,
        { method: 'PATCH', body: JSON.stringify({ status }) },
        token,
      ),
  },

  // ---- Certifications ----
  certifications: {
    listForWorker: (workerId: number, token: string) =>
      request<Certification[]>(`/certifications/workers/${workerId}`, {}, token),
    add: (payload: Omit<Certification, 'id' | 'verification_status'>, token: string) =>
      request<Certification>('/certifications/me', { method: 'POST', body: JSON.stringify(payload) }, token),
    remove: (id: number, token: string) =>
      request<void>(`/certifications/me/${id}`, { method: 'DELETE' }, token),
  },

  // ---- Portfolio ----
  portfolio: {
    listForWorker: (workerId: number, token: string) =>
      request<PortfolioItem[]>(`/portfolio/workers/${workerId}`, {}, token),
    add: (
      payload: Omit<PortfolioItem, 'id' | 'worker_id' | 'confirmed' | 'confirmed_at'>,
      token: string,
    ) => request<PortfolioItem>('/portfolio/me', { method: 'POST', body: JSON.stringify(payload) }, token),
    remove: (id: number, token: string) =>
      request<void>(`/portfolio/me/${id}`, { method: 'DELETE' }, token),
    pendingConfirmations: (token: string) =>
      request<PortfolioItem[]>('/portfolio/pending-confirmations', {}, token),
    confirm: (id: number, token: string) =>
      request<PortfolioItem>(`/portfolio/${id}/confirm`, { method: 'POST' }, token),
  },

  // ---- Messages ----
  messages: {
    conversations: (token: string) => request<Conversation[]>('/messages/conversations', {}, token),
    openConversation: (otherUserId: number, token: string) =>
      request<Conversation>(
        '/messages/conversations',
        { method: 'POST', body: JSON.stringify({ other_user_id: otherUserId }) },
        token,
      ),
    list: (convId: number, afterId: number, token: string) =>
      request<ChatMessage[]>(`/messages/conversations/${convId}/messages?after_id=${afterId}`, {}, token),
    send: (convId: number, body: string, token: string) =>
      request<ChatMessage>(
        `/messages/conversations/${convId}/messages`,
        { method: 'POST', body: JSON.stringify({ body }) },
        token,
      ),
  },

  // ---- Badges & reviews ----
  badges: {
    forWorker: (workerId: number, token: string) =>
      request<Badge[]>(`/workers/${workerId}/badges`, {}, token),
  },
  reviews: {
    forWorker: (workerId: number, token: string) =>
      request<ReviewWithAuthor[]>(`/reviews/workers/${workerId}`, {}, token),
    create: (
      applicationId: number,
      payload: { rating: number; punctuality?: number; quality?: number; communication?: number; comment?: string },
      token: string,
    ) =>
      request<unknown>(
        `/reviews/applications/${applicationId}`,
        { method: 'POST', body: JSON.stringify(payload) },
        token,
      ),
  },
};


export { ApiError };

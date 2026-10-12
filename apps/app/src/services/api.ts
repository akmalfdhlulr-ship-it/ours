import {
  ArchivedSpaceMetadata,
  ArchiveSpaceRequest,
  ArchiveSpaceResponse,
  CreateInvitationResponse,
  CreateSpaceRequest,
  CreateSpaceResponse,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  InvitationMetadata,
  InvitationPreviewResponse,
  JoinByCodeRequest,
  JoinByTokenRequest,
  JoinResponse,
  LoginRequest,
  LoginResponse,
  LogoutResponse,
  RegisterRequest,
  RegisterResponse,
  ResendVerificationResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
  RevokeInvitationResponse,
  SpaceDetails,
  UpdateProfileRequest,
  UpdateSpaceRequest,
  UserMeResponse,
  VerifyEmailRequest,
  VerifyEmailResponse,
  HomeDashboardResponse,
  PlaceItem,
  SearchPlacesQuery,
  SavePlaceRequest,
  SavedPlaceItem,
  CreateManualPlaceRequest,
  WishlistItemResponse,
  CreateWishlistItemRequest,
  UpdateWishlistItemRequest,
  WishlistStatus,
  DatePlanDetailResponse,
  CreateDatePlanRequest,
  UpdateDatePlanRequest,
  CreateDateStopRequest,
  DatePlanStatus,
  CalendarEventItem,
  CreateCalendarEventRequest,
  UpdateCalendarEventRequest,
  VisitItem,
  CreateVisitRequest,
  UpdateVisitRequest,
  SubmitReviewRequest,
  VisitReviewsResponse,
  ExpenseItem,
  CreateExpenseRequest,
  VoidExpenseRequest,
  ExpenseSummaryResponse,
  ExpenseStatus,
  ScanReceiptRequest,
  OcrReceiptResultDto,
  MediaAssetItem,
  UploadSignatureRequest,
  UploadSignatureResponse,
  CompleteUploadRequest,
  StorageUsageResponse,
  MemoryItem,
  CreateMemoryRequest,
  UpdateMemoryRequest,
  AlbumItem,
  CreateAlbumRequest,
  UpdateAlbumRequest,
  MemoryMapResponseDto,
  LoveLetterDto,
  CreateLoveLetterDto,
  UpdateLoveLetterDto,
  TimeCapsuleDto,
  CreateTimeCapsuleDto,
  CoupleGoalDto,
  CreateCoupleGoalDto,
  ToggleMilestoneDto,
  DecisionPollDto,
  CreateDecisionPollDto,
  CastVoteDto,
  DailySparkQuestionDto,
  SubmitDailySparkAnswerDto,
  QuizSessionDto,
  CreateQuizSessionDto,
  SubmitQuizAnswersDto,
  ScheduledSurpriseDto,
  CreateScheduledSurpriseDto,
  OursWrappedDto,
  AiDatePlanProposalDto,
  AiDateRecommendationDto,
  AiRelationshipInsightDto,
  AiPlanRequestDto,
} from '@ours/contracts';
import { storage } from '../utils/storage';

const SESSION_TOKEN_KEY = 'ours_session_token';
const DEFAULT_API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://ours-production.up.railway.app/api/v1';

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public errorCode: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

class ApiClient {
  private baseUrl = DEFAULT_API_URL;

  setBaseUrl(url: string) {
    this.baseUrl = url;
  }

  async getStoredToken(): Promise<string | null> {
    return storage.getItem(SESSION_TOKEN_KEY);
  }

  async setStoredToken(token: string): Promise<void> {
    await storage.setItem(SESSION_TOKEN_KEY, token);
  }

  async clearStoredToken(): Promise<void> {
    await storage.removeItem(SESSION_TOKEN_KEY);
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const token = await this.getStoredToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
      credentials: 'same-origin',
    });

    const json = await response.json().catch(() => null);

    if (!response.ok) {
      let errorMsg = json?.error?.message || json?.message;
      if (Array.isArray(json?.error?.details) && json.error.details.length > 0) {
        errorMsg = json.error.details.join('. ');
      }
      if (!errorMsg) {
        errorMsg = `Request failed with status ${response.status}`;
      }
      const errorCode = json?.error?.code || 'API_ERROR';
      throw new ApiError(response.status, errorCode, errorMsg, json?.error?.details);
    }

    return (json?.data !== undefined ? json.data : json) as T;
  }

  // Auth endpoints
  readonly auth = {
    register: async (dto: RegisterRequest): Promise<RegisterResponse> => {
      return this.request<RegisterResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(dto),
      });
    },

    login: async (dto: LoginRequest): Promise<LoginResponse> => {
      const data = await this.request<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(dto),
      });
      if (data.session?.token) {
        await this.setStoredToken(data.session.token);
      }
      return data;
    },

    verifyEmail: async (dto: VerifyEmailRequest): Promise<VerifyEmailResponse> => {
      return this.request<VerifyEmailResponse>('/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify(dto),
      });
    },

    resendVerification: async (): Promise<ResendVerificationResponse> => {
      return this.request<ResendVerificationResponse>('/auth/resend-verification', {
        method: 'POST',
      });
    },

    forgotPassword: async (dto: ForgotPasswordRequest): Promise<ForgotPasswordResponse> => {
      return this.request<ForgotPasswordResponse>('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify(dto),
      });
    },

    resetPassword: async (dto: ResetPasswordRequest): Promise<ResetPasswordResponse> => {
      return this.request<ResetPasswordResponse>('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify(dto),
      });
    },

    logout: async (): Promise<LogoutResponse> => {
      try {
        return await this.request<LogoutResponse>('/auth/logout', {
          method: 'POST',
        });
      } finally {
        await this.clearStoredToken();
      }
    },
  };

  // User endpoints
  readonly users = {
    getMe: async (): Promise<UserMeResponse> => {
      return this.request<UserMeResponse>('/users/me');
    },

    updateProfile: async (
      dto: UpdateProfileRequest,
    ): Promise<UserMeResponse['profile']> => {
      return this.request<UserMeResponse['profile']>('/users/me/profile', {
        method: 'PATCH',
        body: JSON.stringify(dto),
      });
    },
  };

  // Spaces endpoints
  readonly spaces = {
    getCurrent: async (): Promise<SpaceDetails | null> => {
      return this.request<SpaceDetails | null>('/spaces/current');
    },

    create: async (dto: CreateSpaceRequest): Promise<CreateSpaceResponse> => {
      return this.request<CreateSpaceResponse>('/spaces', {
        method: 'POST',
        body: JSON.stringify(dto),
      });
    },

    get: async (spaceId: string): Promise<SpaceDetails> => {
      return this.request<SpaceDetails>(`/spaces/${spaceId}`);
    },

    update: async (spaceId: string, dto: UpdateSpaceRequest): Promise<SpaceDetails> => {
      return this.request<SpaceDetails>(`/spaces/${spaceId}`, {
        method: 'PATCH',
        body: JSON.stringify(dto),
      });
    },

    archive: async (
      spaceId: string,
      dto: ArchiveSpaceRequest,
    ): Promise<ArchiveSpaceResponse> => {
      return this.request<ArchiveSpaceResponse>(`/spaces/${spaceId}/archive`, {
        method: 'POST',
        body: JSON.stringify(dto),
      });
    },

    getArchived: async (): Promise<ArchivedSpaceMetadata[]> => {
      return this.request<ArchivedSpaceMetadata[]>('/spaces/archived');
    },

    joinByToken: async (dto: JoinByTokenRequest): Promise<JoinResponse> => {
      return this.request<JoinResponse>('/spaces/join', {
        method: 'POST',
        body: JSON.stringify(dto),
      });
    },

    joinByCode: async (dto: JoinByCodeRequest): Promise<JoinResponse> => {
      return this.request<JoinResponse>('/spaces/join/code', {
        method: 'POST',
        body: JSON.stringify(dto),
      });
    },
  };

  // Invitations endpoints
  readonly invitations = {
    create: async (spaceId: string): Promise<CreateInvitationResponse> => {
      return this.request<CreateInvitationResponse>(
        `/spaces/${spaceId}/invitations`,
        {
          method: 'POST',
        },
      );
    },

    list: async (spaceId: string): Promise<InvitationMetadata[]> => {
      return this.request<InvitationMetadata[]>(`/spaces/${spaceId}/invitations`);
    },

    revoke: async (
      spaceId: string,
      invitationId: string,
    ): Promise<RevokeInvitationResponse> => {
      return this.request<RevokeInvitationResponse>(
        `/spaces/${spaceId}/invitations/${invitationId}/revoke`,
        {
          method: 'POST',
        },
      );
    },

    preview: async (token: string): Promise<InvitationPreviewResponse> => {
      return this.request<InvitationPreviewResponse>(
        `/invitations/${token}/preview`,
      );
    },
  };

  // Home Dashboard
  readonly home = {
    getDashboard: async (): Promise<HomeDashboardResponse> => {
      return this.request<HomeDashboardResponse>('/home');
    },
  };

  // Places & Explore
  readonly places = {
    search: async (params?: SearchPlacesQuery): Promise<PlaceItem[]> => {
      const qs = new URLSearchParams();
      if (params?.query) qs.append('query', params.query);
      if (params?.category) qs.append('category', params.category);
      if (params?.latitude) qs.append('latitude', params.latitude.toString());
      if (params?.longitude) qs.append('longitude', params.longitude.toString());
      const queryStr = qs.toString() ? `?${qs.toString()}` : '';
      return this.request<PlaceItem[]>(`/places/search${queryStr}`);
    },

    getSaved: async (): Promise<SavedPlaceItem[]> => {
      return this.request<SavedPlaceItem[]>('/places/saved');
    },

    save: async (dto: SavePlaceRequest): Promise<SavedPlaceItem> => {
      return this.request<SavedPlaceItem>('/places/saved', {
        method: 'POST',
        body: JSON.stringify(dto),
      });
    },

    unsave: async (placeId: string): Promise<{ success: boolean }> => {
      return this.request<{ success: boolean }>(`/places/saved/${placeId}`, {
        method: 'DELETE',
      });
    },

    createManual: async (dto: CreateManualPlaceRequest): Promise<PlaceItem> => {
      return this.request<PlaceItem>('/places/manual', {
        method: 'POST',
        body: JSON.stringify(dto),
      });
    },

    getById: async (id: string): Promise<PlaceItem> => {
      return this.request<PlaceItem>(`/places/${id}`);
    },
  };

  // Wishlist
  readonly wishlist = {
    list: async (status?: WishlistStatus): Promise<WishlistItemResponse[]> => {
      const q = status ? `?status=${status}` : '';
      return this.request<WishlistItemResponse[]>(`/wishlist${q}`);
    },

    create: async (dto: CreateWishlistItemRequest): Promise<WishlistItemResponse> => {
      return this.request<WishlistItemResponse>('/wishlist', {
        method: 'POST',
        body: JSON.stringify(dto),
      });
    },

    getById: async (id: string): Promise<WishlistItemResponse> => {
      return this.request<WishlistItemResponse>(`/wishlist/${id}`);
    },

    update: async (
      id: string,
      dto: UpdateWishlistItemRequest,
    ): Promise<WishlistItemResponse> => {
      return this.request<WishlistItemResponse>(`/wishlist/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(dto),
      });
    },

    archive: async (id: string): Promise<WishlistItemResponse> => {
      return this.request<WishlistItemResponse>(`/wishlist/${id}`, {
        method: 'DELETE',
      });
    },
  };

  // Date Planner
  readonly dates = {
    list: async (status?: DatePlanStatus): Promise<DatePlanDetailResponse[]> => {
      const q = status ? `?status=${status}` : '';
      return this.request<DatePlanDetailResponse[]>(`/dates${q}`);
    },

    create: async (dto: CreateDatePlanRequest): Promise<DatePlanDetailResponse> => {
      return this.request<DatePlanDetailResponse>('/dates', {
        method: 'POST',
        body: JSON.stringify(dto),
      });
    },

    getById: async (id: string): Promise<DatePlanDetailResponse> => {
      return this.request<DatePlanDetailResponse>(`/dates/${id}`);
    },

    update: async (
      id: string,
      dto: UpdateDatePlanRequest,
    ): Promise<DatePlanDetailResponse> => {
      return this.request<DatePlanDetailResponse>(`/dates/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(dto),
      });
    },

    addStop: async (
      id: string,
      dto: CreateDateStopRequest,
    ): Promise<DatePlanDetailResponse> => {
      return this.request<DatePlanDetailResponse>(`/dates/${id}/stops`, {
        method: 'POST',
        body: JSON.stringify(dto),
      });
    },

    deleteStop: async (
      id: string,
      stopId: string,
    ): Promise<DatePlanDetailResponse> => {
      return this.request<DatePlanDetailResponse>(`/dates/${id}/stops/${stopId}`, {
        method: 'DELETE',
      });
    },

    delete: async (id: string): Promise<{ success: boolean }> => {
      return this.request<{ success: boolean }>(`/dates/${id}`, {
        method: 'DELETE',
      });
    },
  };

  // Calendar
  readonly calendar = {
    list: async (start?: string, end?: string): Promise<CalendarEventItem[]> => {
      const qs = new URLSearchParams();
      if (start) qs.append('start', start);
      if (end) qs.append('end', end);
      const q = qs.toString() ? `?${qs.toString()}` : '';
      return this.request<CalendarEventItem[]>(`/calendar${q}`);
    },

    create: async (dto: CreateCalendarEventRequest): Promise<CalendarEventItem> => {
      return this.request<CalendarEventItem>('/calendar', {
        method: 'POST',
        body: JSON.stringify(dto),
      });
    },

    update: async (
      id: string,
      dto: UpdateCalendarEventRequest,
    ): Promise<CalendarEventItem> => {
      return this.request<CalendarEventItem>(`/calendar/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(dto),
      });
    },

    delete: async (id: string): Promise<{ success: boolean }> => {
      return this.request<{ success: boolean }>(`/calendar/${id}`, {
        method: 'DELETE',
      });
    },
  };

  // Visits
  readonly visits = {
    list: async (): Promise<VisitItem[]> => {
      return this.request<VisitItem[]>('/visits');
    },

    create: async (dto: CreateVisitRequest): Promise<VisitItem> => {
      return this.request<VisitItem>('/visits', {
        method: 'POST',
        body: JSON.stringify(dto),
      });
    },

    getById: async (id: string): Promise<VisitItem> => {
      return this.request<VisitItem>(`/visits/${id}`);
    },

    update: async (id: string, dto: UpdateVisitRequest): Promise<VisitItem> => {
      return this.request<VisitItem>(`/visits/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(dto),
      });
    },
  };

  // Blind Reviews
  readonly reviews = {
    get: async (visitId: string): Promise<VisitReviewsResponse> => {
      return this.request<VisitReviewsResponse>(`/visits/${visitId}/reviews`);
    },

    submit: async (
      visitId: string,
      dto: SubmitReviewRequest,
    ): Promise<VisitReviewsResponse> => {
      return this.request<VisitReviewsResponse>(`/visits/${visitId}/reviews`, {
        method: 'POST',
        body: JSON.stringify(dto),
      });
    },
  };

  // Expenses
  readonly expenses = {
    list: async (
      datePlanId?: string,
      status?: ExpenseStatus,
    ): Promise<ExpenseItem[]> => {
      const qs = new URLSearchParams();
      if (datePlanId) qs.append('datePlanId', datePlanId);
      if (status) qs.append('status', status);
      const q = qs.toString() ? `?${qs.toString()}` : '';
      return this.request<ExpenseItem[]>(`/expenses${q}`);
    },

    summary: async (): Promise<ExpenseSummaryResponse> => {
      return this.request<ExpenseSummaryResponse>('/expenses/summary');
    },

    create: async (dto: CreateExpenseRequest): Promise<ExpenseItem> => {
      return this.request<ExpenseItem>('/expenses', {
        method: 'POST',
        body: JSON.stringify(dto),
      });
    },

    void: async (id: string, dto: VoidExpenseRequest): Promise<ExpenseItem> => {
      return this.request<ExpenseItem>(`/expenses/${id}/void`, {
        method: 'POST',
        body: JSON.stringify(dto),
      });
    },

    scanReceipt: async (dto: ScanReceiptRequest): Promise<OcrReceiptResultDto> => {
      const res = await this.request<{ data: OcrReceiptResultDto } | OcrReceiptResultDto>('/expenses/ocr', {
        method: 'POST',
        body: JSON.stringify(dto),
      });
      return (res as any)?.data || res;
    },
  };

  // Media
  readonly media = {
    list: async (): Promise<MediaAssetItem[]> => {
      return this.request<MediaAssetItem[]>('/media');
    },

    getSignature: async (
      dto: UploadSignatureRequest,
    ): Promise<UploadSignatureResponse> => {
      return this.request<UploadSignatureResponse>('/media/upload-signature', {
        method: 'POST',
        body: JSON.stringify(dto),
      });
    },

    complete: async (dto: CompleteUploadRequest): Promise<MediaAssetItem> => {
      return this.request<MediaAssetItem>('/media/complete', {
        method: 'POST',
        body: JSON.stringify(dto),
      });
    },

    directUpload: async (dto: {
      imageBase64: string;
      filename?: string;
      mimeType?: string;
    }): Promise<MediaAssetItem> => {
      return this.request<MediaAssetItem>('/media/direct-upload', {
        method: 'POST',
        body: JSON.stringify(dto),
      });
    },

    usage: async (): Promise<StorageUsageResponse> => {
      return this.request<StorageUsageResponse>('/media/usage');
    },

    softDelete: async (id: string): Promise<{ success: boolean }> => {
      return this.request<{ success: boolean }>(`/media/${id}`, {
        method: 'DELETE',
      });
    },

    restore: async (id: string): Promise<MediaAssetItem> => {
      return this.request<MediaAssetItem>(`/media/${id}/restore`, {
        method: 'POST',
      });
    },
  };

  // Memories & Albums
  readonly memories = {
    list: async (isFavorite?: boolean): Promise<MemoryItem[]> => {
      const q = isFavorite !== undefined ? `?isFavorite=${isFavorite}` : '';
      return this.request<MemoryItem[]>(`/memories${q}`);
    },

    onThisDay: async (): Promise<MemoryItem[]> => {
      return this.request<MemoryItem[]>('/memories/on-this-day');
    },

    getById: async (id: string): Promise<MemoryItem> => {
      return this.request<MemoryItem>(`/memories/${id}`);
    },

    create: async (dto: CreateMemoryRequest): Promise<MemoryItem> => {
      return this.request<MemoryItem>('/memories', {
        method: 'POST',
        body: JSON.stringify(dto),
      });
    },

    update: async (id: string, dto: UpdateMemoryRequest): Promise<MemoryItem> => {
      return this.request<MemoryItem>(`/memories/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(dto),
      });
    },

    delete: async (id: string): Promise<{ success: boolean }> => {
      return this.request<{ success: boolean }>(`/memories/${id}`, {
        method: 'DELETE',
      });
    },
  };

  readonly albums = {
    list: async (): Promise<AlbumItem[]> => {
      return this.request<AlbumItem[]>('/albums');
    },

    getById: async (id: string): Promise<AlbumItem & { memories: MemoryItem[] }> => {
      return this.request<AlbumItem & { memories: MemoryItem[] }>(`/albums/${id}`);
    },

    create: async (dto: CreateAlbumRequest): Promise<AlbumItem> => {
      return this.request<AlbumItem>('/albums', {
        method: 'POST',
        body: JSON.stringify(dto),
      });
    },

    update: async (id: string, dto: UpdateAlbumRequest): Promise<AlbumItem> => {
      return this.request<AlbumItem>(`/albums/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(dto),
      });
    },

    addMemory: async (
      albumId: string,
      memoryId: string,
    ): Promise<{ success: boolean }> => {
      return this.request<{ success: boolean }>(`/albums/${albumId}/memories`, {
        method: 'POST',
        body: JSON.stringify({ memoryId }),
      });
    },

    removeMemory: async (
      albumId: string,
      memoryId: string,
    ): Promise<{ success: boolean }> => {
      return this.request<{ success: boolean }>(
        `/albums/${albumId}/memories/${memoryId}`,
        {
          method: 'DELETE',
        },
      );
    },

    delete: async (id: string): Promise<{ success: boolean }> => {
      return this.request<{ success: boolean }>(`/albums/${id}`, {
        method: 'DELETE',
      });
    },
  };

  // 08A: Memory Map
  readonly memoryMap = {
    get: async (): Promise<MemoryMapResponseDto> => {
      return this.request<MemoryMapResponseDto>('/memory-map');
    },
  };

  // 08B: Love Letters
  readonly letters = {
    list: async (): Promise<LoveLetterDto[]> => {
      return this.request<LoveLetterDto[]>('/letters');
    },
    create: async (dto: CreateLoveLetterDto): Promise<LoveLetterDto> => {
      return this.request<LoveLetterDto>('/letters', {
        method: 'POST',
        body: JSON.stringify(dto),
      });
    },
    get: async (id: string): Promise<LoveLetterDto> => {
      return this.request<LoveLetterDto>(`/letters/${id}`);
    },
    update: async (id: string, dto: UpdateLoveLetterDto): Promise<LoveLetterDto> => {
      return this.request<LoveLetterDto>(`/letters/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(dto),
      });
    },
    send: async (id: string): Promise<LoveLetterDto> => {
      return this.request<LoveLetterDto>(`/letters/${id}/send`, {
        method: 'POST',
      });
    },
    unlock: async (id: string): Promise<LoveLetterDto> => {
      return this.request<LoveLetterDto>(`/letters/${id}/unlock`, {
        method: 'POST',
      });
    },
  };

  // 08C: Time Capsules
  readonly timeCapsules = {
    list: async (): Promise<TimeCapsuleDto[]> => {
      return this.request<TimeCapsuleDto[]>('/time-capsules');
    },
    create: async (dto: CreateTimeCapsuleDto): Promise<TimeCapsuleDto> => {
      return this.request<TimeCapsuleDto>('/time-capsules', {
        method: 'POST',
        body: JSON.stringify(dto),
      });
    },
    get: async (id: string): Promise<TimeCapsuleDto> => {
      return this.request<TimeCapsuleDto>(`/time-capsules/${id}`);
    },
  };

  // 08D: Couple Goals
  readonly goals = {
    list: async (): Promise<CoupleGoalDto[]> => {
      return this.request<CoupleGoalDto[]>('/goals');
    },
    create: async (dto: CreateCoupleGoalDto): Promise<CoupleGoalDto> => {
      return this.request<CoupleGoalDto>('/goals', {
        method: 'POST',
        body: JSON.stringify(dto),
      });
    },
    toggleMilestone: async (
      id: string,
      milestoneId: string,
      dto: ToggleMilestoneDto,
    ): Promise<CoupleGoalDto> => {
      return this.request<CoupleGoalDto>(`/goals/${id}/milestones/${milestoneId}`, {
        method: 'PATCH',
        body: JSON.stringify(dto),
      });
    },
    delete: async (id: string): Promise<{ success: boolean }> => {
      return this.request<{ success: boolean }>(`/goals/${id}`, {
        method: 'DELETE',
      });
    },
  };

  // 08E: Decisions & Polls
  readonly decisions = {
    list: async (): Promise<DecisionPollDto[]> => {
      return this.request<DecisionPollDto[]>('/decisions');
    },
    create: async (dto: CreateDecisionPollDto): Promise<DecisionPollDto> => {
      return this.request<DecisionPollDto>('/decisions', {
        method: 'POST',
        body: JSON.stringify(dto),
      });
    },
    vote: async (id: string, dto: CastVoteDto): Promise<DecisionPollDto> => {
      return this.request<DecisionPollDto>(`/decisions/${id}/vote`, {
        method: 'POST',
        body: JSON.stringify(dto),
      });
    },
    close: async (id: string): Promise<DecisionPollDto> => {
      return this.request<DecisionPollDto>(`/decisions/${id}/close`, {
        method: 'POST',
      });
    },
  };

  // 08F: Games & Quizzes
  readonly games = {
    getDailySpark: async (): Promise<DailySparkQuestionDto> => {
      return this.request<DailySparkQuestionDto>('/games/daily-spark');
    },
    answerDailySpark: async (
      dto: SubmitDailySparkAnswerDto,
    ): Promise<DailySparkQuestionDto> => {
      return this.request<DailySparkQuestionDto>('/games/daily-spark/answer', {
        method: 'POST',
        body: JSON.stringify(dto),
      });
    },
    listSessions: async (): Promise<QuizSessionDto[]> => {
      return this.request<QuizSessionDto[]>('/games/sessions');
    },
    createSession: async (dto: CreateQuizSessionDto): Promise<QuizSessionDto> => {
      return this.request<QuizSessionDto>('/games/sessions', {
        method: 'POST',
        body: JSON.stringify(dto),
      });
    },
    submitAnswers: async (
      id: string,
      dto: SubmitQuizAnswersDto,
    ): Promise<QuizSessionDto> => {
      return this.request<QuizSessionDto>(`/games/sessions/${id}/answer`, {
        method: 'POST',
        body: JSON.stringify(dto),
      });
    },
  };

  // 08G: Scheduled Surprises
  readonly surprises = {
    list: async (): Promise<ScheduledSurpriseDto[]> => {
      return this.request<ScheduledSurpriseDto[]>('/surprises');
    },
    create: async (dto: CreateScheduledSurpriseDto): Promise<ScheduledSurpriseDto> => {
      return this.request<ScheduledSurpriseDto>('/surprises', {
        method: 'POST',
        body: JSON.stringify(dto),
      });
    },
  };

  // 08H: OURS Wrapped
  readonly wrapped = {
    get: async (year?: number): Promise<OursWrappedDto> => {
      const q = year ? `?year=${year}` : '';
      return this.request<OursWrappedDto>(`/wrapped${q}`);
    },
  };

  // Phase 09: AI Assistant & Personalization
  readonly ai = {
    planDate: async (dto: AiPlanRequestDto): Promise<AiDatePlanProposalDto> => {
      return this.request<AiDatePlanProposalDto>('/ai/plan-date', {
        method: 'POST',
        body: JSON.stringify(dto),
      });
    },
    recommendations: async (): Promise<AiDateRecommendationDto[]> => {
      return this.request<AiDateRecommendationDto[]>('/ai/recommendations', {
        method: 'POST',
      });
    },
    insights: async (): Promise<AiRelationshipInsightDto[]> => {
      return this.request<AiRelationshipInsightDto[]>('/ai/insights');
    },
    getConsent: async (): Promise<{ enabled: boolean }> => {
      return this.request<{ enabled: boolean }>('/ai/consent');
    },
    setConsent: async (enabled: boolean): Promise<{ enabled: boolean }> => {
      return this.request<{ enabled: boolean }>('/ai/consent', {
        method: 'POST',
        body: JSON.stringify({ enabled }),
      });
    },
  };
}

export const api = new ApiClient();

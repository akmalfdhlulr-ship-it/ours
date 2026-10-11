export interface HomeDashboardResponse {
  coupleSpace: {
    id: string;
    name: string | null;
    status: string;
    currencyCode: string;
    timezone: string | null;
    anniversaryDate: string | null;
    daysTogether: number;
    daysUntilNextAnniversary: number | null;
  };
  partner: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
    email: string;
  } | null;
  upcomingDates: Array<{
    id: string;
    title: string;
    plannedDate: string | null;
    status: string;
    stopsCount: number;
  }>;
  recentMemories: Array<{
    id: string;
    title: string;
    memoryDate: string;
    coverUrl: string | null;
    isFavorite: boolean;
  }>;
  onThisDay: {
    memory: {
      id: string;
      title: string;
      memoryDate: string;
      yearsAgo: number;
      coverUrl: string | null;
    } | null;
    milestone: string | null;
  };
}

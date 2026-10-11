export interface OursWrappedDto {
  year: number;
  daysTogether: number;
  totalDatesPlanned: number;
  totalDatesCompleted: number;
  totalVisitsLogged: number;
  topCategories: { category: string; count: number }[];
  totalMemoriesCreated: number;
  totalMediaUploaded: number;
  totalExpensesAmount: number;
  currencyCode: string;
  coupleScoreAverage: number | null;
  mostMemorableSpot?: string;
  generatedAt: string;
}

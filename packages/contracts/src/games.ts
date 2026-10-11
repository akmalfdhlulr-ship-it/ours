export interface DailySparkQuestionDto {
  id: string;
  question: string;
  category: string;
  date: string;
  myAnswer?: string | null;
  partnerAnswer?: string | null;
  revealed?: boolean;
  myCompleted?: boolean;
  partnerCompleted?: boolean;
}

export interface SubmitDailySparkAnswerDto {
  answer: string;
}

export interface QuizQuestionDto {
  id: string;
  prompt: string;
  options?: string[];
}

export interface QuizSessionDto {
  id: string;
  coupleSpaceId: string;
  title: string;
  questions: QuizQuestionDto[];
  myAnswers?: Record<string, string>;
  partnerAnswers?: Record<string, string> | null;
  revealed: boolean;
  partnerCompleted: boolean;
  myCompleted: boolean;
  scoreMatchPercentage?: number;
  createdAt: string;
}

export interface CreateQuizSessionDto {
  title: string;
  questions: {
    prompt: string;
    options?: string[];
  }[];
}

export interface SubmitQuizAnswersDto {
  answers: Record<string, string>;
}

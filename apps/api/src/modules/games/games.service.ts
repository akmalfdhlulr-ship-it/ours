import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import {
  DailySparkQuestionDto,
  SubmitDailySparkAnswerDto,
  QuizSessionDto,
  CreateQuizSessionDto,
  SubmitQuizAnswersDto,
  QuizQuestionDto,
} from '@ours/contracts';
import { randomUUID } from 'crypto';
import { DurableStore } from '../../common/persistence/durable-store';

interface StoredQuizSession {
  id: string;
  coupleSpaceId: string;
  title: string;
  questions: QuizQuestionDto[];
  userAnswers: Record<string, Record<string, string>>;
  createdAt: string;
}

interface StoredDailySparkAnswer {
  id: string;
  coupleSpaceId: string;
  date: string;
  userAnswers: Record<string, string>;
  updatedAt: string;
}

const DAILY_SPARK_QUESTIONS = [
  'Momen terindah apa yang paling kamu syukuri saat bersamaku dalam seminggu terakhir?',
  'Jika besok kita bisa terbang ke mana saja, di mana kamu ingin kita terbangun bersama?',
  'Lagu apa yang paling mengingatkanmu pada awal perjalanan cinta kita berdua?',
  'Kebiasaan kecilku apa yang diam-diam selalu membuatmu tersenyum sendiri?',
  'Impian bersama apa yang paling membuatmu bersemangat untuk kita wujudkan berdua?',
  'Kapan momen pasti ketika kamu pertama kali menyadari bahwa kamu jatuh cinta padaku?',
  'Makanan atau makan malam apa yang paling berkesan yang pernah kita nikmati bersama?',
  'Bagaimana caraku yang paling membuatmu merasa dicintai saat kamu sedang lelah atau stres?',
  'Petualangan atau pengalaman baru apa yang paling ingin kamu coba bersamaku tahun ini?',
  'Jika kisah perjalanan cinta kita dijadikan judul film, judul apa yang paling cocok?',
];

@Injectable()
export class GamesService {
  private sessions = new DurableStore<StoredQuizSession>('quiz_sessions');
  private dailySparks = new DurableStore<StoredDailySparkAnswer>('daily_sparks');

  getDailySpark(coupleSpaceId?: string, currentUserId?: string): DailySparkQuestionDto {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10);
    const dayOfYear = Math.floor(
      (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24),
    );
    const index = Math.abs(dayOfYear) % DAILY_SPARK_QUESTIONS.length;

    const baseDto: DailySparkQuestionDto = {
      id: `spark-${dateStr}`,
      question: DAILY_SPARK_QUESTIONS[index],
      category: 'KEDEKATAN & IKATAN HATI',
      date: dateStr,
      myAnswer: null,
      partnerAnswer: null,
      revealed: false,
      myCompleted: false,
      partnerCompleted: false,
    };

    if (!coupleSpaceId || !currentUserId) {
      return baseDto;
    }

    const sparkRecordId = `${coupleSpaceId}_${dateStr}`;
    const record = this.dailySparks.get(sparkRecordId);
    if (!record || !record.userAnswers) {
      return baseDto;
    }

    const myAnswer = record.userAnswers[currentUserId] || null;
    const userIds = Object.keys(record.userAnswers);
    const partnerId = userIds.find((uid) => uid !== currentUserId);
    const partnerAnswer = partnerId ? record.userAnswers[partnerId] : null;

    const myCompleted = !!myAnswer;
    const partnerCompleted = !!partnerAnswer;
    const revealed = myCompleted && partnerCompleted;

    return {
      ...baseDto,
      myAnswer,
      partnerAnswer: revealed ? partnerAnswer : null,
      revealed,
      myCompleted,
      partnerCompleted,
    };
  }

  async answerDailySpark(
    coupleSpaceId: string,
    currentUserId: string,
    dto: SubmitDailySparkAnswerDto,
  ): Promise<DailySparkQuestionDto> {
    if (!dto.answer || !dto.answer.trim()) {
      throw new BadRequestException('Jawaban tidak boleh kosong');
    }

    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10);
    const sparkRecordId = `${coupleSpaceId}_${dateStr}`;

    let record = this.dailySparks.get(sparkRecordId);
    if (!record) {
      record = {
        id: sparkRecordId,
        coupleSpaceId,
        date: dateStr,
        userAnswers: {},
        updatedAt: today.toISOString(),
      };
    }

    if (!record.userAnswers) {
      record.userAnswers = {};
    }

    record.userAnswers[currentUserId] = dto.answer.trim();
    record.updatedAt = today.toISOString();
    this.dailySparks.set(record.id, record);

    return this.getDailySpark(coupleSpaceId, currentUserId);
  }

  async listSessions(coupleSpaceId: string, currentUserId: string): Promise<QuizSessionDto[]> {
    const list: QuizSessionDto[] = [];
    for (const session of this.sessions.values()) {
      if (session.coupleSpaceId === coupleSpaceId) {
        list.push(this.mapDto(session, currentUserId));
      }
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createSession(coupleSpaceId: string, dto: CreateQuizSessionDto): Promise<QuizSessionDto> {
    if (!dto.title?.trim() || !dto.questions || dto.questions.length === 0) {
      throw new BadRequestException('Title and at least one question are required');
    }

    const questions: QuizQuestionDto[] = dto.questions.map((q) => ({
      id: randomUUID(),
      prompt: q.prompt.trim(),
      options: q.options,
    }));

    const session: StoredQuizSession = {
      id: randomUUID(),
      coupleSpaceId,
      title: dto.title.trim(),
      questions,
      userAnswers: {},
      createdAt: new Date().toISOString(),
    };

    this.sessions.set(session.id, session);
    return this.mapDto(session, '');
  }

  async submitAnswers(
    coupleSpaceId: string,
    currentUserId: string,
    sessionId: string,
    dto: SubmitQuizAnswersDto,
  ): Promise<QuizSessionDto> {
    const session = this.sessions.get(sessionId);
    if (!session || session.coupleSpaceId !== coupleSpaceId) {
      throw new NotFoundException('Quiz session not found');
    }

    if (!session.userAnswers) {
      session.userAnswers = {};
    }
    session.userAnswers[currentUserId] = dto.answers;
    this.sessions.set(session.id, session);
    return this.mapDto(session, currentUserId);
  }

  private mapDto(session: StoredQuizSession, currentUserId: string): QuizSessionDto {
    const userAnswers = session.userAnswers || {};
    const userIds = Object.keys(userAnswers);
    const myAnswers = userAnswers[currentUserId];
    const partnerId = userIds.find((uid) => uid !== currentUserId);
    const partnerAnswersRaw = partnerId ? userAnswers[partnerId] : undefined;

    const bothCompleted = userIds.length >= 2;
    const revealed = bothCompleted;

    let scoreMatchPercentage: number | undefined = undefined;
    if (revealed && myAnswers && partnerAnswersRaw) {
      let matches = 0;
      let totalQuestions = session.questions.length;
      for (const q of session.questions) {
        const a1 = (myAnswers[q.id] || '').trim().toLowerCase();
        const a2 = (partnerAnswersRaw[q.id] || '').trim().toLowerCase();
        if (a1 && a2 && a1 === a2) {
          matches++;
        }
      }
      scoreMatchPercentage = totalQuestions > 0 ? Math.round((matches / totalQuestions) * 100) : 100;
    }

    return {
      id: session.id,
      coupleSpaceId: session.coupleSpaceId,
      title: session.title,
      questions: session.questions,
      myAnswers,
      partnerAnswers: revealed ? partnerAnswersRaw : null, // Blind privacy protected until mutual completion!
      revealed,
      partnerCompleted: !!partnerAnswersRaw,
      myCompleted: !!myAnswers,
      scoreMatchPercentage,
      createdAt: session.createdAt,
    };
  }
}

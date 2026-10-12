import { MemoryMapService } from '../src/modules/memory-map/memory-map.service';
import { LettersService } from '../src/modules/letters/letters.service';
import { TimeCapsulesService } from '../src/modules/time-capsules/time-capsules.service';
import { GoalsService } from '../src/modules/goals/goals.service';
import { DecisionsService } from '../src/modules/decisions/decisions.service';
import { GamesService } from '../src/modules/games/games.service';
import { SurprisesService } from '../src/modules/surprises/surprises.service';
import { WrappedService } from '../src/modules/wrapped/wrapped.service';
import { AiService } from '../src/modules/ai/ai.service';
import { AiPort } from '../src/modules/ai/ai.port';

describe('OURS — Phase 08 & Phase 09 Invariant Verification', () => {
  const testRunId = Date.now().toString(36);
  const coupleSpaceId = `space-test-${testRunId}`;
  const user1 = `user-alice-${testRunId}`;
  const user2 = `user-bob-${testRunId}`;

  describe('08A Memory Map', () => {
    it('aggregates geolocated visits and memories into pins with bounding box', async () => {
      const mockPrisma: any = {
        visit: {
          findMany: jest.fn().mockResolvedValue([
            {
              id: 'v1',
              visitedAt: new Date('2026-06-15'),
              place: {
                name: 'Seaside Bistro',
                address: '10 Ocean Way',
                latitude: -8.65,
                longitude: 115.13,
                category: 'DINING',
              },
            },
          ]),
        },
        memory: {
          findMany: jest.fn().mockResolvedValue([
            {
              id: 'm1',
              title: 'Cliff Walk Sunset',
              latitude: -8.70,
              longitude: 115.18,
              locationName: 'Uluwatu Cliffs',
              memoryDate: new Date('2026-07-20'),
              media: [],
            },
          ]),
        },
      };

      const service = new MemoryMapService(mockPrisma);
      const res = await service.getMap(coupleSpaceId);

      expect(res.totalPins).toBe(2);
      expect(res.pins).toHaveLength(2);
      expect(res.pins[0].type).toBe('VISIT');
      expect(res.pins[0].title).toBe('Seaside Bistro');
      expect(res.pins[1].type).toBe('MEMORY');
      expect(res.pins[1].title).toBe('Cliff Walk Sunset');
      expect(res.bounds).toBeDefined();
      expect(res.bounds!.minLat).toBe(-8.70);
      expect(res.bounds!.maxLat).toBe(-8.65);
    });
  });

  describe('08B Love Letters', () => {
    it('enforces that partner drafts are never visible to recipient until sent', async () => {
      const mockPrisma: any = {
        coupleMembership: {
          findMany: jest.fn().mockResolvedValue([
            { userId: user1, coupleSpaceId, status: 'ACTIVE' },
            { userId: user2, coupleSpaceId, status: 'ACTIVE' },
          ]),
        },
      };

      const service = new LettersService(mockPrisma);

      // User 1 creates draft
      const draft = await service.create(coupleSpaceId, user1, {
        title: 'Secret Notes for You',
        content: 'Draft thoughts for anniversary...',
        status: 'DRAFT',
      });

      // User 1 lists: can see their draft
      const user1List = await service.list(coupleSpaceId, user1);
      expect(user1List).toHaveLength(1);
      expect(user1List[0].id).toBe(draft.id);

      // User 2 lists: draft is strictly hidden!
      const user2List = await service.list(coupleSpaceId, user2);
      expect(user2List).toHaveLength(0);

      // User 1 sends letter
      await service.send(coupleSpaceId, user1, draft.id);

      // Now user 2 can see the sent letter
      const user2ListAfterSend = await service.list(coupleSpaceId, user2);
      expect(user2ListAfterSend).toHaveLength(1);
      expect(user2ListAfterSend[0].title).toBe('Secret Notes for You');
    });
  });

  describe('08C Time Capsules', () => {
    it('masks capsule content on backend until unlockAt date is reached', async () => {
      const service = new TimeCapsulesService();
      const futureDate = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30); // 30 days future

      const capsule = await service.create(coupleSpaceId, user1, {
        title: 'Open in One Month',
        content: 'Our hidden promise',
        unlockAt: futureDate.toISOString(),
      });

      expect(capsule.isLocked).toBe(true);
      expect(capsule.content).toBeNull(); // Masked!

      // Detail retrieval while locked
      const fetched = await service.get(coupleSpaceId, capsule.id);
      expect(fetched.isLocked).toBe(true);
      expect(fetched.content).toBeNull();
    });
  });

  describe('08D Couple Goals', () => {
    it('tracks progress percentage and transitions to ACHIEVED when 100% complete', async () => {
      const service = new GoalsService();
      const goal = await service.create(coupleSpaceId, user1, {
        title: 'Learn Italian Together',
        category: 'GROWTH',
        milestones: ['Complete Unit 1', 'Watch an Italian Movie', 'Cook Risotto together'],
      });

      expect(goal.status).toBe('IN_PROGRESS');
      expect(goal.progressPercentage).toBe(0);

      // Complete 1st milestone
      const step1 = await service.toggleMilestone(coupleSpaceId, goal.id, goal.milestones[0].id, { completed: true });
      expect(step1.progressPercentage).toBe(33);
      expect(step1.status).toBe('IN_PROGRESS');

      // Complete 2nd and 3rd milestone
      await service.toggleMilestone(coupleSpaceId, goal.id, goal.milestones[1].id, { completed: true });
      const completed = await service.toggleMilestone(coupleSpaceId, goal.id, goal.milestones[2].id, { completed: true });

      expect(completed.progressPercentage).toBe(100);
      expect(completed.status).toBe('ACHIEVED');
      expect(completed.achievedAt).toBeDefined();
    });
  });

  describe('08E Decisions & Polls', () => {
    it('resolves poll deterministically when both partners vote', async () => {
      const service = new DecisionsService();
      const poll = await service.create(coupleSpaceId, user1, {
        question: 'Saturday dinner spot?',
        options: ['Italian Pasta Bar', 'Japanese Omakase', 'Rooftop Tapas'],
      });

      expect(poll.status).toBe('OPEN');

      // User 1 votes for Japanese Omakase (index 1)
      const afterVote1 = await service.vote(coupleSpaceId, user1, poll.id, { optionIndex: 1 });
      expect(afterVote1.status).toBe('OPEN');
      expect(afterVote1.totalVotes).toBe(1);

      // User 2 also votes for Japanese Omakase (index 1)
      const afterVote2 = await service.vote(coupleSpaceId, user2, poll.id, { optionIndex: 1 });
      expect(afterVote2.status).toBe('RESOLVED');
      expect(afterVote2.winnerOptionIndex).toBe(1);

      // Verify tie handling when partners vote for different options
      const tiePoll = await service.create(coupleSpaceId, user1, {
        question: 'Weekend movie?',
        options: ['Comedy', 'Thriller'],
      });
      await service.vote(coupleSpaceId, user1, tiePoll.id, { optionIndex: 0 });
      const tieRes = await service.vote(coupleSpaceId, user2, tiePoll.id, { optionIndex: 1 });
      expect(tieRes.status).toBe('RESOLVED');
      expect(tieRes.winnerOptionIndex).toBeUndefined(); // Tie detected, neither option favored
    });
  });

  describe('08F Games & Quizzes', () => {
    it('manages bilateral daily spark with mutual blind reveal for couples', async () => {
      const service = new GamesService();
      const initialSpark = service.getDailySpark(coupleSpaceId, user1);
      expect(initialSpark.question).toBeDefined();
      expect(initialSpark.revealed).toBe(false);
      expect(initialSpark.myCompleted).toBe(false);

      // User 1 answers Daily Spark
      const u1Answer = await service.answerDailySpark(coupleSpaceId, user1, {
        answer: 'Makan malam romantis di rooftop Senopati',
      });
      expect(u1Answer.myCompleted).toBe(true);
      expect(u1Answer.partnerCompleted).toBe(false);
      expect(u1Answer.revealed).toBe(false);
      expect(u1Answer.myAnswer).toBe('Makan malam romantis di rooftop Senopati');
      expect(u1Answer.partnerAnswer).toBeNull(); // Masked from user 1

      // User 2 checks before answering
      const u2ViewBefore = service.getDailySpark(coupleSpaceId, user2);
      expect(u2ViewBefore.myCompleted).toBe(false);
      expect(u2ViewBefore.partnerCompleted).toBe(true); // User 1 has answered
      expect(u2ViewBefore.revealed).toBe(false);
      expect(u2ViewBefore.partnerAnswer).toBeNull(); // Still masked until User 2 answers!

      // User 2 answers
      const u2Answer = await service.answerDailySpark(coupleSpaceId, user2, {
        answer: 'Jalan santai berdua di tepi pantai saat senja',
      });
      expect(u2Answer.myCompleted).toBe(true);
      expect(u2Answer.partnerCompleted).toBe(true);
      expect(u2Answer.revealed).toBe(true); // MUTUAL REVEAL UNLOCKED!
      expect(u2Answer.myAnswer).toBe('Jalan santai berdua di tepi pantai saat senja');
      expect(u2Answer.partnerAnswer).toBe('Makan malam romantis di rooftop Senopati');

      // User 1 checks after User 2 answered
      const u1ViewAfter = service.getDailySpark(coupleSpaceId, user1);
      expect(u1ViewAfter.revealed).toBe(true);
      expect(u1ViewAfter.partnerAnswer).toBe('Jalan santai berdua di tepi pantai saat senja');
    });

    it('protects blind answers until both partners submit, then reveals mutual answers', async () => {
      const service = new GamesService();
      const session = await service.createSession(coupleSpaceId, {
        title: 'Couple Favorites Quiz',
        questions: [
          { prompt: 'What is my favorite dessert?' },
          { prompt: 'Where was our first vacation?' },
        ],
      });

      // User 1 submits answers
      const u1Submit = await service.submitAnswers(coupleSpaceId, user1, session.id, {
        answers: { [session.questions[0].id]: 'Tiramisu', [session.questions[1].id]: 'Bali' },
      });

      expect(u1Submit.revealed).toBe(false);
      expect(u1Submit.partnerAnswers).toBeNull(); // Masked!

      // User 2 submits answers
      const u2Submit = await service.submitAnswers(coupleSpaceId, user2, session.id, {
        answers: { [session.questions[0].id]: 'Tiramisu', [session.questions[1].id]: 'Bali' },
      });

      expect(u2Submit.revealed).toBe(true);
      expect(u2Submit.partnerAnswers).toBeDefined();
      expect(u2Submit.scoreMatchPercentage).toBe(100);
    });
  });

  describe('08G Scheduled Surprises', () => {
    it('masks surprise secret message for recipient until revealAt', async () => {
      const service = new SurprisesService();
      const futureReveal = new Date(Date.now() + 1000 * 60 * 60 * 48); // 48h future

      await service.create(coupleSpaceId, user1, {
        title: 'Anniversary Gift Delivery',
        message: 'Your gift is booked: Couple Spa at Wellness Retreat!',
        revealAt: futureReveal.toISOString(),
      });

      // Recipient (user 2) views surprises
      const recipientList = await service.list(coupleSpaceId, user2);
      expect(recipientList).toHaveLength(1);
      expect(recipientList[0].message).toBeNull(); // Masked!
      expect(recipientList[0].isRevealed).toBe(false);

      // Creator (user 1) views surprises
      const creatorList = await service.list(coupleSpaceId, user1);
      expect(creatorList[0].message).toContain('Couple Spa'); // Creator can see their own schedule
    });
  });

  describe('08H OURS Wrapped', () => {
    it('computes retrospective from real visits, dates, memories, and active expenses', async () => {
      const mockPrisma: any = {
        coupleSpace: {
          findUnique: jest.fn().mockResolvedValue({
            id: coupleSpaceId,
            anniversaryDate: new Date('2025-01-01'),
            currencyCode: 'USD',
          }),
        },
        datePlan: {
          findMany: jest.fn().mockResolvedValue([
            { id: 'dp1', status: 'COMPLETED' },
            { id: 'dp2', status: 'PLANNED' },
          ]),
        },
        visit: {
          findMany: jest.fn().mockResolvedValue([
            {
              id: 'v1',
              place: { name: 'Botanical Roasters', category: 'CAFE' },
              reviews: [{ overallRating: 5 }, { overallRating: 4 }],
            },
          ]),
        },
        memory: {
          count: jest.fn().mockResolvedValue(12),
        },
        mediaAsset: {
          count: jest.fn().mockResolvedValue(35),
        },
        expense: {
          findMany: jest.fn().mockResolvedValue([
            { amount: 5000, status: 'ACTIVE' },
            { amount: 2500, status: 'ACTIVE' },
          ]),
        },
      };

      const service = new WrappedService(mockPrisma);
      const wrapped = await service.getWrapped(coupleSpaceId, 2026);

      expect(wrapped.totalDatesPlanned).toBe(2);
      expect(wrapped.totalDatesCompleted).toBe(1);
      expect(wrapped.totalVisitsLogged).toBe(1);
      expect(wrapped.topCategories).toEqual([{ category: 'CAFE', count: 1 }]);
      expect(wrapped.coupleScoreAverage).toBe(4.5);
      expect(wrapped.totalMemoriesCreated).toBe(12);
      expect(wrapped.totalMediaUploaded).toBe(35);
      expect(wrapped.totalExpensesAmount).toBe(7500);
      expect(wrapped.currencyCode).toBe('USD');
    });
  });

  describe('Phase 09 AI Service & Guardrails', () => {
    it('generates structured date plan proposal and enforces rate limit', async () => {
      const mockAiPort: AiPort = {
        generatePlanProposal: jest.fn().mockResolvedValue({
          title: 'Sunset Beach Walk & Wine',
          description: 'A cozy evening by the shore',
          suggestedDate: '2026-10-15',
          estimatedBudgetMinorUnits: 4500,
          stops: [
            { title: 'Beach Viewpoint', placeName: 'Sunset Ridge', notes: 'Golden hour drinks', estimatedDurationMin: 60 },
          ],
          checklist: ['Warm jacket', 'Camera'],
        }),
        generateRecommendations: jest.fn().mockResolvedValue([]),
        generateRelationshipInsights: jest.fn().mockResolvedValue([]),
      };

      const mockPrisma: any = {
        visit: { count: jest.fn().mockResolvedValue(4), findMany: jest.fn().mockResolvedValue([]) },
        datePlan: { count: jest.fn().mockResolvedValue(2) },
        coupleSpace: { findUnique: jest.fn().mockResolvedValue({ anniversaryDate: new Date('2025-01-01') }) },
      };

      const service = new AiService(mockAiPort, mockPrisma);

      const plan = await service.planDate(coupleSpaceId, {
        prompt: 'Quiet beach sunset under $50',
      });

      expect(plan.title).toBe('Sunset Beach Walk & Wine');
      expect(plan.stops).toHaveLength(1);
      expect(plan.checklist).toContain('Warm jacket');
    });

    it('resolves model correctly in GeminiAdapter, guarding against decommissioned models', () => {
      const { GeminiAdapter } = require('../src/modules/ai/gemini.adapter');
      const adapter = new GeminiAdapter();

      const origEnv = process.env.GEMINI_MODEL;
      try {
        delete process.env.GEMINI_MODEL;
        expect(adapter.resolveModelName()).toBe('gemini-3.8-flash');

        process.env.GEMINI_MODEL = 'gemini-2.0-flash';
        expect(adapter.resolveModelName()).toBe('gemini-3.8-flash');

        process.env.GEMINI_MODEL = 'gemini-2.5-flash';
        expect(adapter.resolveModelName()).toBe('gemini-2.5-flash');

        process.env.GEMINI_MODEL = '"gemini-3.8-flash"';
        expect(adapter.resolveModelName()).toBe('gemini-3.8-flash');

        process.env.GEMINI_MODEL = 'models/gemini-3.8-flash';
        expect(adapter.resolveModelName()).toBe('gemini-3.8-flash');
      } finally {
        if (origEnv !== undefined) {
          process.env.GEMINI_MODEL = origEnv;
        } else {
          delete process.env.GEMINI_MODEL;
        }
      }
    });
  });
});


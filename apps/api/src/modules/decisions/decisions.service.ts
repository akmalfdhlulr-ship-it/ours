import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DecisionPollDto, CreateDecisionPollDto, CastVoteDto, DecisionVoteDto } from '@ours/contracts';
import { randomUUID } from 'crypto';

import { DurableStore } from '../../common/persistence/durable-store';

interface StoredVote {
  userId: string;
  optionIndex: number;
  votedAt: string;
}

interface StoredPoll {
  id: string;
  coupleSpaceId: string;
  createdById: string;
  question: string;
  options: string[];
  votes: StoredVote[];
  status: 'OPEN' | 'RESOLVED' | 'CLOSED';
  winnerOptionIndex?: number;
  createdAt: string;
}

@Injectable()
export class DecisionsService {
  private polls = new DurableStore<StoredPoll>('decision_polls');

  async list(coupleSpaceId: string, userId: string): Promise<DecisionPollDto[]> {
    const list: DecisionPollDto[] = [];
    for (const poll of this.polls.values()) {
      if (poll.coupleSpaceId === coupleSpaceId) {
        list.push(this.mapDto(poll, userId));
      }
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async create(coupleSpaceId: string, createdById: string, dto: CreateDecisionPollDto): Promise<DecisionPollDto> {
    if (!dto.question?.trim() || !dto.options || dto.options.length < 2) {
      throw new BadRequestException('Poll requires a question and at least 2 options');
    }

    const poll: StoredPoll = {
      id: randomUUID(),
      coupleSpaceId,
      createdById,
      question: dto.question.trim(),
      options: dto.options.map((o) => o.trim()),
      votes: [],
      status: 'OPEN',
      createdAt: new Date().toISOString(),
    };

    this.polls.set(poll.id, poll);
    return this.mapDto(poll, createdById);
  }

  async vote(coupleSpaceId: string, userId: string, pollId: string, dto: CastVoteDto): Promise<DecisionPollDto> {
    const poll = this.polls.get(pollId);
    if (!poll || poll.coupleSpaceId !== coupleSpaceId) {
      throw new NotFoundException('Decision poll not found');
    }

    if (poll.status !== 'OPEN') {
      throw new BadRequestException('Poll is already closed or resolved');
    }

    if (dto.optionIndex < 0 || dto.optionIndex >= poll.options.length) {
      throw new BadRequestException('Invalid option index');
    }

    // Record vote (replace if user already voted or push new)
    const existingIdx = poll.votes.findIndex((v) => v.userId === userId);
    const voteRecord: StoredVote = {
      userId,
      optionIndex: dto.optionIndex,
      votedAt: new Date().toISOString(),
    };
    if (existingIdx >= 0) {
      poll.votes[existingIdx] = voteRecord;
    } else {
      poll.votes.push(voteRecord);
    }

    // If both partners have voted (2 votes in a couple space), resolve deterministically!
    if (poll.votes.length >= 2) {
      const voteCounts = new Array(poll.options.length).fill(0);
      for (const v of poll.votes) {
        voteCounts[v.optionIndex]++;
      }

      let maxVotes = -1;
      let winningIdx = -1;
      for (let i = 0; i < voteCounts.length; i++) {
        if (voteCounts[i] > maxVotes) {
          maxVotes = voteCounts[i];
          winningIdx = i;
        }
      }

      poll.status = 'RESOLVED';
      poll.winnerOptionIndex = winningIdx;
    }

    this.polls.set(poll.id, poll);
    return this.mapDto(poll, userId);
  }

  async close(coupleSpaceId: string, pollId: string, userId: string): Promise<DecisionPollDto> {
    const poll = this.polls.get(pollId);
    if (!poll || poll.coupleSpaceId !== coupleSpaceId) {
      throw new NotFoundException('Decision poll not found');
    }

    poll.status = 'CLOSED';
    this.polls.set(poll.id, poll);
    return this.mapDto(poll, userId);
  }

  private mapDto(poll: StoredPoll, currentUserId: string): DecisionPollDto {
    const votesList: DecisionVoteDto[] = poll.votes.map((v) => ({
      userId: v.userId,
      optionIndex: v.optionIndex,
      votedAt: v.votedAt,
    }));
    const myVote = poll.votes.find((v) => v.userId === currentUserId);
    const myVoteIndex = myVote ? myVote.optionIndex : undefined;

    return {
      id: poll.id,
      coupleSpaceId: poll.coupleSpaceId,
      createdById: poll.createdById,
      question: poll.question,
      options: poll.options,
      votes: votesList,
      status: poll.status,
      winnerOptionIndex: poll.winnerOptionIndex,
      totalVotes: poll.votes.length,
      hasVoted: myVoteIndex !== undefined,
      myVoteIndex,
      createdAt: poll.createdAt,
    };
  }
}

import { isRankCode, isRecord } from '../../shared/guards.ts';
import type {
  CommunityStats,
  PlayerStats,
  RankCode,
} from '../../shared/types.ts';
import { getPreviousUtcDate } from './engine.ts';

const DAY_TTL_SECONDS = 30 * 24 * 60 * 60;

export type RedisLike = {
  hGetAll(key: string): Promise<Record<string, string>>;
  hGet(key: string, field: string): Promise<string | undefined>;
  hSet(key: string, fieldValues: Record<string, string>): Promise<number>;
  hSetNX(key: string, field: string, value: string): Promise<number>;
  hIncrBy(key: string, field: string, value: number): Promise<number>;
  expire(key: string, seconds: number): Promise<void>;
};

export type RecordAttemptInput = {
  readonly utcDate: string;
  readonly caseId: string;
  readonly userId: string | null;
  readonly correct: boolean;
  readonly evidenceCorrect: boolean;
  readonly actionCorrect: boolean;
  readonly evidenceId: string;
  readonly actionId: string;
  readonly rankCode: RankCode;
};

export type RecordArchiveAttemptInput = {
  readonly utcDate: string;
  readonly caseId: string;
  readonly userId: string | null;
  readonly correct: boolean;
};

export type RecordAttemptOutcome = {
  readonly isFirstAttempt: boolean;
  readonly playerStats: PlayerStats;
  readonly communityStats: CommunityStats;
};

export type DailySnapshot = {
  readonly playerStats: PlayerStats;
  readonly communityStats: CommunityStats;
};

export type ShiftStore = {
  readonly getDailySnapshot: (
    utcDate: string,
    userId: string | null
  ) => Promise<DailySnapshot>;
  readonly recordAttempt: (
    input: RecordAttemptInput
  ) => Promise<RecordAttemptOutcome>;
  readonly recordArchiveAttempt: (
    input: RecordArchiveAttemptInput
  ) => Promise<PlayerStats>;
  readonly hasSharedComment: (
    utcDate: string,
    userId: string
  ) => Promise<boolean>;
  readonly markCommentShared: (
    utcDate: string,
    userId: string
  ) => Promise<void>;
};

export const EMPTY_PLAYER_STATS: PlayerStats = {
  currentStreak: 0,
  bestStreak: 0,
  totalSolved: 0,
  solvedToday: false,
  firstAttemptAttempted: false,
  firstAttemptRank: null,
  sharedToday: false,
  solvedCaseIds: [],
};

export const EMPTY_COMMUNITY_STATS: CommunityStats = {
  totalAnalysts: 0,
  containedCount: 0,
  containmentRatePct: 0,
  actionCounts: {},
  evidenceCounts: {},
};

const dayStatsKey = (utcDate: string): string => `nsd:day:${utcDate}:stats`;
const dayPlayedKey = (utcDate: string): string => `nsd:day:${utcDate}:played`;
const daySharedKey = (utcDate: string): string => `nsd:day:${utcDate}:shared`;
const userProfileKey = (userId: string): string => `nsd:user:${userId}:profile`;
const userSolvedKey = (userId: string): string => `nsd:user:${userId}:solved`;

const parseSafeInt = (value: string | undefined): number => {
  if (!value) {
    return 0;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

type StoredFirstAttempt = {
  readonly correct: boolean;
  readonly rankCode: RankCode;
};

const parseFirstAttempt = (
  raw: string | undefined
): StoredFirstAttempt | null => {
  if (!raw) {
    return null;
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) {
      return null;
    }
    const correct = parsed['correct'];
    const rankCode = parsed['rankCode'];
    if (typeof correct === 'boolean' && isRankCode(rankCode)) {
      return { correct, rankCode };
    }
    return null;
  } catch {
    return null;
  }
};

const extractSolvedCaseIds = (raw: Record<string, string>): string[] => {
  return Object.entries(raw)
    .filter(([, value]) => value === '1')
    .map(([key]) => key)
    .sort();
};

const parseCommunityStats = (
  raw: Record<string, string>,
  includeBreakdowns: boolean
): CommunityStats => {
  const totalAnalysts = parseSafeInt(raw['firstAttempts']);
  const containedCount = parseSafeInt(raw['contained']);
  const containmentRatePct =
    totalAnalysts > 0 ? Math.round((containedCount / totalAnalysts) * 100) : 0;

  const actionCounts: Record<string, number> = {};
  const evidenceCounts: Record<string, number> = {};

  if (includeBreakdowns) {
    for (const [key, val] of Object.entries(raw)) {
      if (key.startsWith('action:')) {
        const id = key.slice('action:'.length);
        const count = parseSafeInt(val);
        if (id.length > 0 && count > 0) {
          actionCounts[id] = count;
        }
      } else if (key.startsWith('evidence:')) {
        const id = key.slice('evidence:'.length);
        const count = parseSafeInt(val);
        if (id.length > 0 && count > 0) {
          evidenceCounts[id] = count;
        }
      }
    }
  }

  return {
    totalAnalysts,
    containedCount,
    containmentRatePct,
    actionCounts,
    evidenceCounts,
  };
};

const buildPlayerStatsFromProfile = (
  profile: Record<string, string>,
  todayUtcDate: string,
  firstAttempt: StoredFirstAttempt | null,
  sharedToday: boolean,
  solvedCaseIds: readonly string[]
): PlayerStats => {
  const rawStreak = parseSafeInt(profile['currentStreak']);
  const bestStreak = parseSafeInt(profile['bestStreak']);
  const totalSolved = parseSafeInt(profile['totalSolved']);
  const lastSolvedUtcDate = profile['lastSolvedUtcDate'] ?? '';

  const yesterday = getPreviousUtcDate(todayUtcDate);
  const streakActive =
    lastSolvedUtcDate === todayUtcDate || lastSolvedUtcDate === yesterday;
  const currentStreak = streakActive ? rawStreak : 0;
  const solvedToday = lastSolvedUtcDate === todayUtcDate;

  return {
    currentStreak,
    bestStreak,
    totalSolved,
    solvedToday,
    firstAttemptAttempted: firstAttempt !== null,
    firstAttemptRank: firstAttempt?.rankCode ?? null,
    sharedToday,
    solvedCaseIds,
  };
};

export const createRedisShiftStore = (client: RedisLike): ShiftStore => {
  const getDailySnapshot = async (
    utcDate: string,
    userId: string | null
  ): Promise<DailySnapshot> => {
    try {
      const [rawStats, rawFirstAttempt, rawShared, rawProfile, rawSolved] =
        await Promise.all([
          client.hGetAll(dayStatsKey(utcDate)),
          userId
            ? client.hGet(dayPlayedKey(utcDate), userId)
            : Promise.resolve(undefined),
          userId
            ? client.hGet(daySharedKey(utcDate), userId)
            : Promise.resolve(undefined),
          userId ? client.hGetAll(userProfileKey(userId)) : Promise.resolve({}),
          userId ? client.hGetAll(userSolvedKey(userId)) : Promise.resolve({}),
        ]);

      const firstAttempt = parseFirstAttempt(rawFirstAttempt);
      const sharedToday = rawShared === '1';
      const solvedCaseIds = extractSolvedCaseIds(rawSolved);
      const playerStats = userId
        ? buildPlayerStatsFromProfile(
            rawProfile,
            utcDate,
            firstAttempt,
            sharedToday,
            solvedCaseIds
          )
        : EMPTY_PLAYER_STATS;

      const communityStats = parseCommunityStats(
        rawStats,
        playerStats.firstAttemptAttempted
      );

      return { playerStats, communityStats };
    } catch (error) {
      console.warn('ShiftStore.getDailySnapshot failed, falling back:', error);
      return {
        playerStats: EMPTY_PLAYER_STATS,
        communityStats: EMPTY_COMMUNITY_STATS,
      };
    }
  };

  const recordAttempt = async (
    input: RecordAttemptInput
  ): Promise<RecordAttemptOutcome> => {
    if (!input.userId) {
      const rawStats = await client
        .hGetAll(dayStatsKey(input.utcDate))
        .catch(() => ({}));
      return {
        isFirstAttempt: true,
        playerStats: {
          ...EMPTY_PLAYER_STATS,
          firstAttemptAttempted: true,
          firstAttemptRank: input.rankCode,
          solvedToday: input.correct,
          solvedCaseIds: input.correct ? [input.caseId] : [],
        },
        communityStats: parseCommunityStats(rawStats, true),
      };
    }

    try {
      const statsKey = dayStatsKey(input.utcDate);
      const playedKey = dayPlayedKey(input.utcDate);
      const profileKey = userProfileKey(input.userId);
      const solvedKey = userSolvedKey(input.userId);

      const serialized = JSON.stringify({
        correct: input.correct,
        rankCode: input.rankCode,
      });

      const inserted = await client.hSetNX(playedKey, input.userId, serialized);
      const isFirstAttempt = inserted === 1;

      if (isFirstAttempt) {
        const outcomeField = input.correct
          ? 'contained'
          : input.evidenceCorrect || input.actionCorrect
            ? 'partial'
            : 'failed';

        await Promise.all([
          client.hIncrBy(statsKey, 'firstAttempts', 1),
          client.hIncrBy(statsKey, outcomeField, 1),
          client.hIncrBy(statsKey, `action:${input.actionId}`, 1),
          client.hIncrBy(statsKey, `evidence:${input.evidenceId}`, 1),
          client.expire(statsKey, DAY_TTL_SECONDS),
          client.expire(playedKey, DAY_TTL_SECONDS),
        ]);
      }

      if (input.correct) {
        await client.hSet(solvedKey, { [input.caseId]: '1' });
      }

      const rawProfile = await client.hGetAll(profileKey);
      const lastSolvedUtcDate = rawProfile['lastSolvedUtcDate'] ?? '';

      if (input.correct && lastSolvedUtcDate !== input.utcDate) {
        const yesterday = getPreviousUtcDate(input.utcDate);
        const prevStreak = parseSafeInt(rawProfile['currentStreak']);
        const prevBest = parseSafeInt(rawProfile['bestStreak']);
        const prevSolved = parseSafeInt(rawProfile['totalSolved']);

        const nextStreak =
          lastSolvedUtcDate === yesterday ? prevStreak + 1 : 1;
        const nextBest = Math.max(prevBest, nextStreak);
        const nextSolved = prevSolved + 1;

        await client.hSet(profileKey, {
          currentStreak: String(nextStreak),
          bestStreak: String(nextBest),
          totalSolved: String(nextSolved),
          lastSolvedUtcDate: input.utcDate,
        });
      }

      const [
        updatedStats,
        updatedProfile,
        rawFirstAttempt,
        rawShared,
        rawSolved,
      ] = await Promise.all([
        client.hGetAll(statsKey),
        client.hGetAll(profileKey),
        client.hGet(playedKey, input.userId),
        client.hGet(daySharedKey(input.utcDate), input.userId),
        client.hGetAll(solvedKey),
      ]);

      const firstAttempt = parseFirstAttempt(rawFirstAttempt);
      const playerStats = buildPlayerStatsFromProfile(
        updatedProfile,
        input.utcDate,
        firstAttempt,
        rawShared === '1',
        extractSolvedCaseIds(rawSolved)
      );

      return {
        isFirstAttempt,
        playerStats,
        communityStats: parseCommunityStats(updatedStats, true),
      };
    } catch (error) {
      console.warn('ShiftStore.recordAttempt failed, falling back:', error);
      return {
        isFirstAttempt: true,
        playerStats: {
          ...EMPTY_PLAYER_STATS,
          firstAttemptAttempted: true,
          firstAttemptRank: input.rankCode,
          solvedToday: input.correct,
          solvedCaseIds: input.correct ? [input.caseId] : [],
        },
        communityStats: EMPTY_COMMUNITY_STATS,
      };
    }
  };

  const recordArchiveAttempt = async (
    input: RecordArchiveAttemptInput
  ): Promise<PlayerStats> => {
    if (!input.userId) {
      return {
        ...EMPTY_PLAYER_STATS,
        solvedCaseIds: input.correct ? [input.caseId] : [],
      };
    }

    try {
      const solvedKey = userSolvedKey(input.userId);
      if (input.correct) {
        await client.hSet(solvedKey, { [input.caseId]: '1' });
      }

      const [rawProfile, rawFirstAttempt, rawShared, rawSolved] =
        await Promise.all([
          client.hGetAll(userProfileKey(input.userId)),
          client.hGet(dayPlayedKey(input.utcDate), input.userId),
          client.hGet(daySharedKey(input.utcDate), input.userId),
          client.hGetAll(solvedKey),
        ]);

      return buildPlayerStatsFromProfile(
        rawProfile,
        input.utcDate,
        parseFirstAttempt(rawFirstAttempt),
        rawShared === '1',
        extractSolvedCaseIds(rawSolved)
      );
    } catch (error) {
      console.warn('ShiftStore.recordArchiveAttempt failed:', error);
      return EMPTY_PLAYER_STATS;
    }
  };

  const hasSharedComment = async (
    utcDate: string,
    userId: string
  ): Promise<boolean> => {
    try {
      const existing = await client.hGet(daySharedKey(utcDate), userId);
      return existing === '1';
    } catch (error) {
      console.warn('ShiftStore.hasSharedComment failed:', error);
      return false;
    }
  };

  const markCommentShared = async (
    utcDate: string,
    userId: string
  ): Promise<void> => {
    try {
      const key = daySharedKey(utcDate);
      await client.hSet(key, { [userId]: '1' });
      await client.expire(key, DAY_TTL_SECONDS);
    } catch (error) {
      console.warn('ShiftStore.markCommentShared failed:', error);
    }
  };

  return {
    getDailySnapshot,
    recordAttempt,
    recordArchiveAttempt,
    hasSharedComment,
    markCommentShared,
  };
};

export const createInMemoryRedisClient = (): RedisLike => {
  const hashes = new Map<string, Map<string, string>>();

  const getHash = (key: string): Map<string, string> => {
    let existing = hashes.get(key);
    if (!existing) {
      existing = new Map<string, string>();
      hashes.set(key, existing);
    }
    return existing;
  };

  return {
    hGetAll: async (key: string): Promise<Record<string, string>> => {
      const hash = hashes.get(key);
      if (!hash) {
        return {};
      }
      const out: Record<string, string> = {};
      for (const [k, v] of hash.entries()) {
        out[k] = v;
      }
      return out;
    },
    hGet: async (key: string, field: string): Promise<string | undefined> => {
      return hashes.get(key)?.get(field);
    },
    hSet: async (
      key: string,
      fieldValues: Record<string, string>
    ): Promise<number> => {
      const hash = getHash(key);
      let added = 0;
      for (const [field, value] of Object.entries(fieldValues)) {
        if (!hash.has(field)) {
          added += 1;
        }
        hash.set(field, value);
      }
      return added;
    },
    hSetNX: async (
      key: string,
      field: string,
      value: string
    ): Promise<number> => {
      const hash = getHash(key);
      if (hash.has(field)) {
        return 0;
      }
      hash.set(field, value);
      return 1;
    },
    hIncrBy: async (
      key: string,
      field: string,
      value: number
    ): Promise<number> => {
      const hash = getHash(key);
      const prev = parseSafeInt(hash.get(field));
      const next = prev + value;
      hash.set(field, String(next));
      return next;
    },
    expire: async (): Promise<void> => {
      // No-op in local memory store.
    },
  };
};

export const createInMemoryShiftStore = (): ShiftStore => {
  return createRedisShiftStore(createInMemoryRedisClient());
};

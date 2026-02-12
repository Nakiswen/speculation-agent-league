import type { Agent, AgentStrategy, RankDirection } from '@/types';

/**
 * 自定义序列化错误类
 */
export class SerializationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SerializationError';
  }
}

/** 有效的 Agent 策略值 */
const VALID_STRATEGIES: ReadonlySet<AgentStrategy> = new Set([
  'momentum',
  'mean-revert',
  'random',
  'conservative',
  'aggressive',
]);

/** 有效的排名变化方向 */
const VALID_RANK_DIRECTIONS: ReadonlySet<RankDirection> = new Set([
  'up',
  'down',
  'stable',
]);

/** 有效的连胜/连败类型 */
const VALID_STREAK_TYPES: ReadonlySet<string> = new Set([
  'win',
  'lose',
  'none',
]);

/**
 * 将 Agent 对象序列化为 JSON 字符串
 */
export function serializeAgent(agent: Agent): string {
  return JSON.stringify(agent);
}

/**
 * 从 JSON 字符串反序列化为 Agent 对象
 * @throws {SerializationError} JSON 解析失败或数据验证失败时抛出
 */
export function deserializeAgent(json: string): Agent {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new SerializationError('无效的 JSON 字符串');
  }
  return validateAgent(parsed);
}

/**
 * 断言值为非 null 的对象
 */
function assertObject(data: unknown, context: string): Record<string, unknown> {
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    throw new SerializationError(`${context} 必须是一个对象`);
  }
  return data as Record<string, unknown>;
}

/**
 * 断言字段存在且为指定类型
 */
function assertField<T>(
  obj: Record<string, unknown>,
  field: string,
  type: string,
  validator?: (value: unknown) => value is T
): T {
  if (!(field in obj)) {
    throw new SerializationError(`缺少必需字段: ${field}`);
  }
  const value = obj[field];
  if (validator) {
    if (!validator(value)) {
      throw new SerializationError(`字段 "${field}" 类型无效，期望 ${type}`);
    }
  } else if (typeof value !== type) {
    throw new SerializationError(
      `字段 "${field}" 类型无效，期望 ${type}，实际为 ${typeof value}`
    );
  }
  return value as T;
}

/**
 * 验证解析后的对象是否为有效的 Agent
 * @throws {SerializationError} 数据验证失败时抛出
 */
export function validateAgent(data: unknown): Agent {
  const obj = assertObject(data, 'Agent 数据');

  const id = assertField<string>(obj, 'id', 'string');
  const name = assertField<string>(obj, 'name', 'string');
  const strategyTag = assertField<string>(obj, 'strategyTag', 'string');

  const strategy = assertField<AgentStrategy>(
    obj,
    'strategy',
    'AgentStrategy',
    (v): v is AgentStrategy =>
      typeof v === 'string' && VALID_STRATEGIES.has(v as AgentStrategy)
  );

  const avatarUrl = assertField<string>(obj, 'avatarUrl', 'string');
  const roi = assertField<number>(obj, 'roi', 'number');
  const stability = assertField<number>(obj, 'stability', 'number');

  const survivalBonus = assertField<0 | 1>(
    obj,
    'survivalBonus',
    '0 | 1',
    (v): v is 0 | 1 => v === 0 || v === 1
  );

  const score = assertField<number>(obj, 'score', 'number');
  const rank = assertField<number>(obj, 'rank', 'number');
  const uptime = assertField<string>(obj, 'uptime', 'string');
  const winRate = assertField<number>(obj, 'winRate', 'number');

  // 验证 rankChange 嵌套对象
  const rankChangeRaw = assertObject(obj['rankChange'], 'rankChange');
  const direction = assertField<RankDirection>(
    rankChangeRaw,
    'direction',
    'RankDirection',
    (v): v is RankDirection =>
      typeof v === 'string' && VALID_RANK_DIRECTIONS.has(v as RankDirection)
  );
  const delta = assertField<number>(rankChangeRaw, 'delta', 'number');

  // 验证 streak 嵌套对象
  const streakRaw = assertObject(obj['streak'], 'streak');
  const streakType = assertField<'win' | 'lose' | 'none'>(
    streakRaw,
    'type',
    'win | lose | none',
    (v): v is 'win' | 'lose' | 'none' =>
      typeof v === 'string' && VALID_STREAK_TYPES.has(v)
  );
  const streakCount = assertField<number>(streakRaw, 'count', 'number');

  return {
    id,
    name,
    strategyTag,
    strategy,
    avatarUrl,
    roi,
    stability,
    survivalBonus,
    score,
    rank,
    rankChange: { direction, delta },
    streak: { type: streakType, count: streakCount },
    uptime,
    winRate,
  };
}

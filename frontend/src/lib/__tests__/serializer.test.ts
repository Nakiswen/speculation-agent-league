import { describe, it, expect } from 'vitest';
import {
  serializeAgent,
  deserializeAgent,
  validateAgent,
  SerializationError,
} from '../serializer';
import type { Agent } from '@/types';

/** 创建一个有效的 Agent 测试数据 */
function createValidAgent(): Agent {
  return {
    id: 'agent-1',
    name: 'MomentumBot',
    strategyTag: '动量策略',
    strategy: 'momentum',
    avatarUrl: '/avatars/momentum.png',
    roi: 12.5,
    stability: 85.3,
    survivalBonus: 1,
    score: 33.09,
    rank: 1,
    rankChange: { direction: 'up', delta: 2 },
    streak: { type: 'win', count: 5 },
    uptime: '72h',
    winRate: 0.68,
  };
}

describe('serializeAgent', () => {
  it('应将 Agent 对象序列化为有效的 JSON 字符串', () => {
    const agent = createValidAgent();
    const json = serializeAgent(agent);
    const parsed: unknown = JSON.parse(json);
    expect(parsed).toEqual(agent);
  });
});

describe('deserializeAgent', () => {
  it('应从有效 JSON 字符串还原完整 Agent 对象', () => {
    const agent = createValidAgent();
    const json = JSON.stringify(agent);
    const result = deserializeAgent(json);
    expect(result).toEqual(agent);
  });

  it('无效 JSON 字符串应抛出 SerializationError', () => {
    expect(() => deserializeAgent('not-json')).toThrow(SerializationError);
    expect(() => deserializeAgent('not-json')).toThrow('无效的 JSON 字符串');
  });

  it('空字符串应抛出 SerializationError', () => {
    expect(() => deserializeAgent('')).toThrow(SerializationError);
  });

  it('序列化后再反序列化应产生等价对象（往返一致性）', () => {
    const agent = createValidAgent();
    const roundTrip = deserializeAgent(serializeAgent(agent));
    expect(roundTrip).toEqual(agent);
  });
});

describe('validateAgent', () => {
  it('有效 Agent 数据应通过验证', () => {
    const agent = createValidAgent();
    expect(validateAgent(agent)).toEqual(agent);
  });

  it('null 应抛出错误', () => {
    expect(() => validateAgent(null)).toThrow(SerializationError);
    expect(() => validateAgent(null)).toThrow('必须是一个对象');
  });

  it('数组应抛出错误', () => {
    expect(() => validateAgent([])).toThrow(SerializationError);
  });

  it('原始类型应抛出错误', () => {
    expect(() => validateAgent('string')).toThrow(SerializationError);
    expect(() => validateAgent(42)).toThrow(SerializationError);
    expect(() => validateAgent(true)).toThrow(SerializationError);
  });

  it('缺少必需字段应抛出描述性错误', () => {
    const agent = createValidAgent();
    const { id: _, ...withoutId } = agent;
    expect(() => validateAgent(withoutId)).toThrow('缺少必需字段: id');
  });

  it('缺少 name 字段应抛出错误', () => {
    const agent = createValidAgent();
    const { name: _, ...withoutName } = agent;
    expect(() => validateAgent(withoutName)).toThrow('缺少必需字段: name');
  });

  it('字段类型错误应抛出描述性错误', () => {
    const agent = createValidAgent();
    const invalid = { ...agent, roi: '不是数字' };
    expect(() => validateAgent(invalid)).toThrow('字段 "roi" 类型无效');
  });

  it('无效的 strategy 值应抛出错误', () => {
    const agent = createValidAgent();
    const invalid = { ...agent, strategy: 'invalid-strategy' };
    expect(() => validateAgent(invalid)).toThrow('字段 "strategy" 类型无效');
  });

  it('无效的 survivalBonus 值应抛出错误', () => {
    const agent = createValidAgent();
    const invalid = { ...agent, survivalBonus: 2 };
    expect(() => validateAgent(invalid)).toThrow('字段 "survivalBonus" 类型无效');
  });

  it('无效的 rankChange.direction 应抛出错误', () => {
    const agent = createValidAgent();
    const invalid = { ...agent, rankChange: { direction: 'sideways', delta: 1 } };
    expect(() => validateAgent(invalid)).toThrow('字段 "direction" 类型无效');
  });

  it('无效的 streak.type 应抛出错误', () => {
    const agent = createValidAgent();
    const invalid = { ...agent, streak: { type: 'draw', count: 1 } };
    expect(() => validateAgent(invalid)).toThrow('字段 "type" 类型无效');
  });

  it('rankChange 不是对象应抛出错误', () => {
    const agent = createValidAgent();
    const invalid = { ...agent, rankChange: 'not-object' };
    expect(() => validateAgent(invalid)).toThrow('rankChange 必须是一个对象');
  });

  it('streak 不是对象应抛出错误', () => {
    const agent = createValidAgent();
    const invalid = { ...agent, streak: null };
    expect(() => validateAgent(invalid)).toThrow('streak 必须是一个对象');
  });

  it('survivalBonus 为 0 应通过验证', () => {
    const agent = createValidAgent();
    agent.survivalBonus = 0;
    expect(validateAgent(agent).survivalBonus).toBe(0);
  });

  it('所有策略类型都应通过验证', () => {
    const strategies = ['momentum', 'mean-revert', 'random', 'conservative', 'aggressive'] as const;
    for (const strategy of strategies) {
      const agent = { ...createValidAgent(), strategy };
      expect(validateAgent(agent).strategy).toBe(strategy);
    }
  });

  it('所有排名方向都应通过验证', () => {
    const directions = ['up', 'down', 'stable'] as const;
    for (const direction of directions) {
      const agent = { ...createValidAgent(), rankChange: { direction, delta: 1 } };
      expect(validateAgent(agent).rankChange.direction).toBe(direction);
    }
  });

  it('所有连胜类型都应通过验证', () => {
    const types = ['win', 'lose', 'none'] as const;
    for (const type of types) {
      const agent = { ...createValidAgent(), streak: { type, count: 3 } };
      expect(validateAgent(agent).streak.type).toBe(type);
    }
  });
});

import { atom } from 'jotai';
import type { Agent } from '@/types';
import { getMockAgents } from '@/lib/mock-data';
import { fetchLeaderboard, isApiAvailable } from '@/lib/api-client';

/** Agent 列表原子状态，初始为空（等待 API 加载） */
export const agentsAtom = atom<Agent[]>([]);

/** 数据来源标记 */
export const dataSourceAtom = atom<'mock' | 'live' | 'loading'>('loading');

/** 按 Score 降序排列的派生 atom，排序后重新赋值 rank */
export const sortedAgentsAtom = atom((get) => {
  const agents = get(agentsAtom);
  return [...agents]
    .sort((a, b) => b.score - a.score)
    .map((agent, i) => ({ ...agent, rank: i + 1 }));
});

/** 根据 ID 获取单个 Agent 的派生 atom 工厂函数（从排序后的列表取，确保 rank 正确） */
export const agentByIdAtom = (id: string) =>
  atom((get) => get(sortedAgentsAtom).find((a) => a.id === id));

/** 刷新 Agent 数据的写入 atom — 优先从 API 获取，失败则 fallback mock */
export const refreshAgentsAtom = atom(null, async (_get, set) => {
  try {
    const available = await isApiAvailable();
    if (available) {
      const agents = await fetchLeaderboard();
      if (agents.length > 0) {
        set(agentsAtom, agents);
        set(dataSourceAtom, 'live');
        return;
      }
    }
  } catch {
    // fallback to mock
  }
  set(agentsAtom, getMockAgents());
  set(dataSourceAtom, 'mock');
});

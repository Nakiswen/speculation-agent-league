import { atom } from 'jotai';
import type { Agent } from '@/types';
import { getMockAgents } from '@/lib/mock-data';

/** Agent 列表原子状态，使用 mock 数据初始化 */
export const agentsAtom = atom<Agent[]>(getMockAgents());

/** 按 Score 降序排列的派生 atom */
export const sortedAgentsAtom = atom((get) => {
  const agents = get(agentsAtom);
  return [...agents].sort((a, b) => b.score - a.score);
});

/** 根据 ID 获取单个 Agent 的派生 atom 工厂函数 */
export const agentByIdAtom = (id: string) =>
  atom((get) => get(agentsAtom).find((a) => a.id === id));

import { atom } from 'jotai';
import type { TradeRecord } from '@/types';
import { getMockTrades } from '@/lib/mock-data';

/** 交易记录原子状态，使用 mock 数据初始化 */
export const tradesAtom = atom<TradeRecord[]>(getMockTrades());

/** 按 Agent ID 过滤交易的派生 atom 工厂函数 */
export const tradesByAgentAtom = (agentId: string) =>
  atom((get) => get(tradesAtom).filter((t) => t.agentId === agentId));

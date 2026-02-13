import { atom } from 'jotai';

/** 濒危 Agent 信息 */
export interface EndangeredAgent {
  address: string;
  tokenAddress: string;
  name: string;
  symbol: string;
  currentPrice: string;
  basePrice: string;
  deathLinePrice: string;
  priceRatio: number;
  belowDeathLine: boolean;
  alive: boolean;
}

/** Last Stand 状态 */
export interface LastStandState {
  active: boolean;
  epochRemainingPct: number;
  epochRemainingSeconds: number;
  endangeredAgents: EndangeredAgent[];
}

const INITIAL_STATE: LastStandState = {
  active: false,
  epochRemainingPct: 100,
  epochRemainingSeconds: 0,
  endangeredAgents: [],
};

/** Last Stand 原子状态 */
export const lastStandAtom = atom<LastStandState>(INITIAL_STATE);

/** 是否处于 Last Stand 模式 */
export const isLastStandActiveAtom = atom((get) => get(lastStandAtom).active);

/** 濒危 Agent 地址集合（用于 Leaderboard 高亮） */
export const endangeredAddressesAtom = atom((get) => {
  const state = get(lastStandAtom);
  return new Set(state.endangeredAgents.map((a) => a.address.toLowerCase()));
});

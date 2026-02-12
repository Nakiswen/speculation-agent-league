import { atom } from 'jotai';
import type { Round } from '@/types';
import { getMockRound } from '@/lib/mock-data';

/** 当前 Round 原子状态，使用 mock 数据初始化 */
export const roundAtom = atom<Round | null>(getMockRound());

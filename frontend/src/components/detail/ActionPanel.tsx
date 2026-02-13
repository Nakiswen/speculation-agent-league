'use client';

import type { Agent } from '@/types';
import BetButton from '@/components/ui/BetButton';
import GlassCard from '@/components/ui/GlassCard';
import nadfunTokens from '@/lib/nadfun-tokens.json';

interface ActionPanelProps {
  agent: Agent;
}

interface NadFunTokenInfo {
  tokenAddress: string;
  poolAddress: string;
  nadFunUrl: string;
}

/** Agent ID → Token 符号映射 */
const AGENT_TOKEN_SYMBOLS: Record<string, string> = {
  'momentum-bot': 'ARBK',
  'mean-revert-bot': 'LIQB',
  'random-bot': 'RBAL',
  'conservative-bot': 'STDY',
  'aggro-bot': 'FSND',
};

/** 获取 nad.fun 交易链接 */
function getNadFunUrl(agentId: string): string {
  const tokenInfo = (nadfunTokens as Record<string, NadFunTokenInfo>)[agentId];
  if (tokenInfo?.nadFunUrl) return tokenInfo.nadFunUrl;
  return 'https://nad.fun';
}

/**
 * 操作面板 — Buy/Sell 跳转到 nad.fun
 */
export default function ActionPanel({ agent }: ActionPanelProps) {
  const nadFunUrl = getNadFunUrl(agent.id);
  const symbol = AGENT_TOKEN_SYMBOLS[agent.id] ?? 'Token';
  const tokenInfo = (nadfunTokens as Record<string, NadFunTokenInfo>)[agent.id];
  const hasToken = tokenInfo?.tokenAddress && tokenInfo.tokenAddress.length > 0;

  const handleBuy = () => window.open(nadFunUrl, '_blank');
  const handleSell = () => window.open(nadFunUrl, '_blank');

  return (
    <div className="space-y-6">
      {/* Operator 信息 */}
      <GlassCard>
        <h3 className="mb-3 text-sm font-medium uppercase tracking-wider text-slate-400">
          Operator
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Strategy</span>
            <span className="text-white/80">{agent.strategyTag}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Uptime</span>
            <span className="font-mono text-white/80">{agent.uptime}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Token</span>
            <span className="font-mono text-cyan-400">${symbol}</span>
          </div>
          {hasToken && (
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Contract</span>
              <a
                href={nadFunUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-[10px] text-cyan-400/70 hover:text-cyan-400 transition-colors"
              >
                {tokenInfo.tokenAddress.slice(0, 6)}...{tokenInfo.tokenAddress.slice(-4)}
              </a>
            </div>
          )}
        </div>
      </GlassCard>

      {/* Buy/Sell Terminal */}
      <GlassCard>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium uppercase tracking-wider text-slate-400">
            Terminal
          </h3>
          <a
            href={nadFunUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[9px] text-cyan-400/60 hover:text-cyan-400 transition-colors"
          >
            nad.fun ↗
          </a>
        </div>
        <div className="flex gap-3">
          <BetButton variant="buy" onClick={handleBuy}>
            Buy ${symbol}
          </BetButton>
          <BetButton variant="sell" onClick={handleSell}>
            Sell ${symbol}
          </BetButton>
        </div>
      </GlassCard>
    </div>
  );
}

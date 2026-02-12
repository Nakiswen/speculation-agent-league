'use client';

import GlassCard from '@/components/ui/GlassCard';
import AlgorithmSection from '@/components/rules/AlgorithmSection';
import FaqAccordion from '@/components/rules/FaqAccordion';
import type { FaqItem } from '@/types';

/** 锚点导航配置 */
const sections = [
  { id: 'algorithm', label: 'The Algorithm' },
  { id: 'game-loop', label: 'Game Loop' },
  { id: 'faq', label: 'FAQ' },
  { id: 'risk-disclosure', label: 'Risk Disclosure' },
];

/** 默认 FAQ 数据 */
const faqItems: FaqItem[] = [
  {
    question: '什么是 Speculation Agent League?',
    answer:
      'SAL 是一个 Agent 原生的链上投机竞技场，多个 AI Agent 并行执行交易策略，用户可以查看排行榜、分析 Agent 表现，并投机押注 Agent 的交易结果。',
  },
  {
    question: '评分公式如何计算?',
    answer:
      'Score = ROI × 0.6 + Stability × 0.3 + SurvivalBonus × 0.1。ROI 衡量盈利能力，Stability 衡量收益稳定性，SurvivalBonus 奖励存活的 Agent。',
  },
  {
    question: '什么是 SurvivalBonus?',
    answer:
      '如果 Agent 在回合中未爆仓，SurvivalBonus = 1；如果 Agent 因连续亏损被淘汰，SurvivalBonus = 0。这鼓励 Agent 采取风险可控的策略。',
  },
  {
    question: '回合时长是多少?',
    answer:
      '每个回合时长为 1 小时。在回合期间，所有 Agent 并行执行各自的交易策略，回合结束后根据评分公式计算排名。',
  },
  {
    question: '如何押注 Agent?',
    answer:
      '在 Agent 详情页点击 Buy/Sell 按钮即可对该 Agent 进行押注操作。Buy 表示看好该 Agent 的表现，Sell 表示看空。',
  },
];

/**
 * Rules & Mechanics 页面
 * 包含四个章节：The Algorithm、Game Loop、FAQ、Risk Disclosure
 * 桌面端左侧锚点导航 + 右侧内容，移动端单栏布局
 */
export default function RulesPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* 左侧锚点导航 - 桌面端 sticky，移动端顶部水平排列 */}
        <nav className="lg:w-48 shrink-0">
          <div className="lg:sticky lg:top-24 flex lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0">
            {sections.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="whitespace-nowrap px-4 py-2 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors duration-200"
              >
                {section.label}
              </a>
            ))}
          </div>
        </nav>

        {/* 右侧主内容区域 */}
        <main className="flex-1 space-y-12">
          {/* The Algorithm 章节 */}
          <section id="algorithm">
            <h2 className="text-2xl font-bold text-white mb-6">The Algorithm</h2>
            <AlgorithmSection />
          </section>

          {/* Game Loop 章节 */}
          <section id="game-loop">
            <h2 className="text-2xl font-bold text-white mb-6">Game Loop</h2>
            <GlassCard>
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg text-white font-semibold">赛制流程</h3>
                  <ol className="space-y-4 text-slate-300 text-sm leading-relaxed">
                    <li className="flex gap-3">
                      <span className="font-mono text-cyan-400 shrink-0">01</span>
                      <span>每个回合时长 1 小时，所有 Agent 在回合开始时同时启动交易策略。</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="font-mono text-cyan-400 shrink-0">02</span>
                      <span>Agent 根据各自策略（Momentum、Mean-Revert、Random 等）自主执行买卖操作。</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="font-mono text-cyan-400 shrink-0">03</span>
                      <span>回合结束后，系统根据评分公式计算每个 Agent 的 Score 并更新排行榜。</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="font-mono text-cyan-400 shrink-0">04</span>
                      <span>连续亏损的 Agent 将被标记为 eliminated，SurvivalBonus 归零。</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="font-mono text-cyan-400 shrink-0">05</span>
                      <span>用户可在回合进行中对 Agent 进行 Buy/Sell 押注，回合结束后结算。</span>
                    </li>
                  </ol>
                </div>
              </div>
            </GlassCard>
          </section>

          {/* FAQ 章节 */}
          <section id="faq">
            <h2 className="text-2xl font-bold text-white mb-6">FAQ</h2>
            <FaqAccordion items={faqItems} />
          </section>

          {/* Risk Disclosure 章节 */}
          <section id="risk-disclosure">
            <h2 className="text-2xl font-bold text-white mb-6">Risk Disclosure</h2>
            <div className="rounded-2xl bg-slate-800/30 border border-slate-700/30 px-6 py-5">
              <p className="text-sm text-slate-500 leading-relaxed">
                风险声明：Speculation Agent League
                仅供娱乐和教育目的。所有交易数据均为模拟数据，不构成任何投资建议。参与者应充分了解加密货币交易的风险，包括但不限于市场波动、流动性风险和智能合约风险。请勿将超出承受能力的资金用于投机活动。
              </p>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

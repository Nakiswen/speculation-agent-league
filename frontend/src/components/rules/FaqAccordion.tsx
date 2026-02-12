'use client';

import { useState, useCallback } from 'react';
import type { FaqItem } from '@/types';

interface FaqAccordionProps {
  items: FaqItem[];
}

/**
 * 折叠式问答组件
 * 点击标题展开/折叠答案，Chevron 图标旋转指示状态
 */
export default function FaqAccordion({ items }: FaqAccordionProps) {
  // 记录展开状态的索引集合，默认全部展开
  const [openIndices, setOpenIndices] = useState<Set<number>>(
    () => new Set(items.map((_, i) => i))
  );

  const toggle = useCallback((index: number) => {
    setOpenIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }, []);

  return (
    <div className="space-y-3">
      {items.map((item, index) => {
        const isOpen = openIndices.has(index);
        return (
          <div
            key={index}
            className="border border-white/[0.08] rounded-2xl overflow-hidden bg-white/[0.02]"
          >
            {/* 可点击的问题标题 */}
            <button
              type="button"
              onClick={() => toggle(index)}
              className="w-full flex items-center justify-between px-5 py-4 text-left text-white hover:bg-white/[0.04] transition-colors duration-200"
            >
              <span className="font-medium pr-4">{item.question}</span>
              {/* Chevron 图标，展开时旋转 180° */}
              <svg
                className={`w-5 h-5 text-slate-400 shrink-0 transition-transform duration-300 ${
                  isOpen ? 'rotate-180' : 'rotate-0'
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* 可折叠的答案区域，平滑高度过渡 */}
            <div
              className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
                isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
              }`}
            >
              <div className="overflow-hidden">
                <p className="px-5 pb-4 pt-1 text-sm text-slate-400 leading-relaxed">
                  {item.answer}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

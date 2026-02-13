'use client';

import { useCallback, useRef } from 'react';

type BetVariant = 'buy' | 'sell';

interface BetButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant: BetVariant;
  disabled?: boolean;
}

const variantStyles: Record<BetVariant, string> = {
  buy: 'bg-gradient-to-r from-cyan-500 to-cyan-400 text-black',
  sell: 'bg-gradient-to-r from-red-500 to-red-400 text-white',
};

const rippleColor: Record<BetVariant, string> = {
  buy: 'rgba(0, 0, 0, 0.25)',
  sell: 'rgba(255, 255, 255, 0.3)',
};

/**
 * 投注按钮组件
 * Buy: 青色渐变，Sell: 红色渐变
 * cursor pointer + 点击水花涟漪效果
 */
export default function BetButton({ children, onClick, variant, disabled = false }: BetButtonProps) {
  const btnRef = useRef<HTMLButtonElement>(null);

  const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    // 涟漪效果
    const btn = btnRef.current;
    if (btn) {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const ripple = document.createElement('span');
      const size = Math.max(rect.width, rect.height) * 2;
      ripple.style.cssText = `
        position:absolute;width:${size}px;height:${size}px;
        left:${x - size / 2}px;top:${y - size / 2}px;
        background:${rippleColor[variant]};border-radius:50%;
        transform:scale(0);opacity:1;pointer-events:none;
        animation:rippleEffect 500ms ease-out forwards;
      `;
      btn.appendChild(ripple);
      setTimeout(() => ripple.remove(), 500);
    }
    onClick?.();
  }, [onClick, variant]);

  return (
    <button
      ref={btnRef}
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={`
        relative overflow-hidden
        flex-1 rounded-xl px-3 py-3 font-semibold text-sm text-center cursor-pointer whitespace-nowrap
        transition-transform duration-200 ease-in-out
        hover:scale-[1.02] active:scale-[0.98]
        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:active:scale-100
        ${variantStyles[variant]}
      `}
    >
      {children}
    </button>
  );
}

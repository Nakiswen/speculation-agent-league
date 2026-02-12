'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';

interface PageTransitionProps {
  children: ReactNode;
}

/**
 * 路由过渡动画组件
 * - 路由切换时执行 300ms ease-out 前景 cross-fade + 4px Y 轴位移
 * - 背景粒子与光球不受影响（它们在 layout 中独立于此组件）
 */
export default function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    // 路由变化时触发过渡：先隐藏，再显示
    setIsTransitioning(true);

    const timer = setTimeout(() => {
      setIsTransitioning(false);
    }, 20); // 短暂延迟让浏览器应用初始状态后再移除

    return () => clearTimeout(timer);
  }, [pathname]);

  return (
    <div
      className="transition-all duration-300 ease-out"
      style={{
        opacity: isTransitioning ? 0 : 1,
        transform: isTransitioning ? 'translateY(4px)' : 'translateY(0)',
      }}
    >
      {children}
    </div>
  );
}

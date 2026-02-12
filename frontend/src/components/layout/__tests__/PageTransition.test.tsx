import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import PageTransition from '../PageTransition';

// Mock next/navigation
let currentPathname = '/';
const mockUsePathname = vi.fn(() => currentPathname);
vi.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
}));

describe('PageTransition', () => {
  beforeEach(() => {
    currentPathname = '/';
    mockUsePathname.mockReturnValue('/');
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('渲染子内容', () => {
    render(
      <PageTransition>
        <div>测试内容</div>
      </PageTransition>
    );
    expect(screen.getByText('测试内容')).toBeInTheDocument();
  });

  it('初始渲染后过渡完成，opacity 为 1 且无 Y 位移', () => {
    render(
      <PageTransition>
        <div>内容</div>
      </PageTransition>
    );

    act(() => {
      vi.advanceTimersByTime(20);
    });

    const wrapper = screen.getByText('内容').parentElement;
    expect(wrapper?.style.opacity).toBe('1');
    expect(wrapper?.style.transform).toBe('translateY(0)');
  });

  it('包裹 div 具有 300ms ease-out 过渡类', () => {
    render(
      <PageTransition>
        <div>内容</div>
      </PageTransition>
    );

    const wrapper = screen.getByText('内容').parentElement;
    expect(wrapper?.className).toContain('transition-all');
    expect(wrapper?.className).toContain('duration-300');
    expect(wrapper?.className).toContain('ease-out');
  });

  it('路由变化时触发过渡状态（opacity: 0, translateY: 4px）', () => {
    const { rerender } = render(
      <PageTransition>
        <div>内容</div>
      </PageTransition>
    );

    // 完成初始过渡
    act(() => {
      vi.advanceTimersByTime(20);
    });

    // 模拟路由变化
    currentPathname = '/archive';
    mockUsePathname.mockReturnValue('/archive');

    rerender(
      <PageTransition>
        <div>内容</div>
      </PageTransition>
    );

    // 过渡开始时应为隐藏状态
    const wrapper = screen.getByText('内容').parentElement;
    expect(wrapper?.style.opacity).toBe('0');
    expect(wrapper?.style.transform).toBe('translateY(4px)');
  });

  it('路由变化后短暂延迟恢复可见状态', () => {
    const { rerender } = render(
      <PageTransition>
        <div>内容</div>
      </PageTransition>
    );

    act(() => {
      vi.advanceTimersByTime(20);
    });

    // 模拟路由变化
    currentPathname = '/rules';
    mockUsePathname.mockReturnValue('/rules');

    rerender(
      <PageTransition>
        <div>内容</div>
      </PageTransition>
    );

    // 等待过渡恢复
    act(() => {
      vi.advanceTimersByTime(20);
    });

    const wrapper = screen.getByText('内容').parentElement;
    expect(wrapper?.style.opacity).toBe('1');
    expect(wrapper?.style.transform).toBe('translateY(0)');
  });
});

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import GlassCard from '../GlassCard';
import MetricPill from '../MetricPill';
import StatusBadge from '../StatusBadge';
import BetButton from '../BetButton';
import Skeleton from '../Skeleton';
import FormulaPill from '../FormulaPill';

describe('GlassCard', () => {
  it('渲染子元素', () => {
    render(<GlassCard><p>测试内容</p></GlassCard>);
    expect(screen.getByText('测试内容')).toBeInTheDocument();
  });

  it('应用玻璃态样式类', () => {
    const { container } = render(<GlassCard>内容</GlassCard>);
    const card = container.firstElementChild as HTMLElement;
    expect(card.className).toContain('bg-white/[0.04]');
    expect(card.className).toContain('backdrop-blur-[40px]');
    expect(card.className).toContain('border-white/[0.08]');
    expect(card.className).toContain('rounded-3xl');
    expect(card.className).toContain('p-6');
  });

  it('支持自定义 className', () => {
    const { container } = render(<GlassCard className="mt-4">内容</GlassCard>);
    const card = container.firstElementChild as HTMLElement;
    expect(card.className).toContain('mt-4');
  });

  it('包含 hover brightness 过渡', () => {
    const { container } = render(<GlassCard>内容</GlassCard>);
    const card = container.firstElementChild as HTMLElement;
    expect(card.className).toContain('hover:brightness-[1.05]');
    expect(card.className).toContain('duration-200');
  });
});

describe('MetricPill', () => {
  it('渲染 label 和 value', () => {
    render(<MetricPill label="TVL" value="$1.2M" />);
    expect(screen.getByText('TVL')).toBeInTheDocument();
    expect(screen.getByText('$1.2M')).toBeInTheDocument();
  });

  it('应用胶囊样式', () => {
    const { container } = render(<MetricPill label="TVL" value="100" />);
    const pill = container.firstElementChild as HTMLElement;
    expect(pill.className).toContain('rounded-full');
    expect(pill.className).toContain('bg-slate-800/50');
    expect(pill.className).toContain('border-slate-600/30');
  });

  it('value 使用 mono 字体', () => {
    render(<MetricPill label="ROI" value="12.5%" />);
    const valueEl = screen.getByText('12.5%');
    expect(valueEl.className).toContain('font-mono');
  });

  it('支持数字类型 value', () => {
    render(<MetricPill label="Bots" value={5} />);
    expect(screen.getByText('5')).toBeInTheDocument();
  });
});

describe('StatusBadge', () => {
  it('active 状态显示绿色', () => {
    const { container } = render(<StatusBadge status="active" />);
    const dot = container.querySelector('span span:first-child') as HTMLElement;
    expect(dot.className).toContain('bg-emerald-400');
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('eliminated 状态显示红色', () => {
    const { container } = render(<StatusBadge status="eliminated" />);
    const dot = container.querySelector('span span:first-child') as HTMLElement;
    expect(dot.className).toContain('bg-red-400');
    expect(screen.getByText('Eliminated')).toBeInTheDocument();
  });

  it('warning 状态显示黄色', () => {
    const { container } = render(<StatusBadge status="warning" />);
    const dot = container.querySelector('span span:first-child') as HTMLElement;
    expect(dot.className).toContain('bg-yellow-400');
    expect(screen.getByText('Warning')).toBeInTheDocument();
  });

  it('支持自定义 label', () => {
    render(<StatusBadge status="active" label="运行中" />);
    expect(screen.getByText('运行中')).toBeInTheDocument();
  });
});

describe('BetButton', () => {
  it('渲染子元素', () => {
    render(<BetButton variant="buy">买入</BetButton>);
    expect(screen.getByText('买入')).toBeInTheDocument();
  });

  it('buy 变体应用青色渐变', () => {
    render(<BetButton variant="buy">Buy</BetButton>);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('from-cyan-500');
    expect(btn.className).toContain('to-cyan-400');
  });

  it('sell 变体应用红色渐变', () => {
    render(<BetButton variant="sell">Sell</BetButton>);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('from-red-500');
    expect(btn.className).toContain('to-red-400');
  });

  it('包含 hover/active 缩放过渡', () => {
    render(<BetButton variant="buy">Buy</BetButton>);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('hover:scale-[1.02]');
    expect(btn.className).toContain('active:scale-[0.98]');
    expect(btn.className).toContain('duration-200');
  });

  it('点击触发 onClick', () => {
    const handleClick = vi.fn();
    render(<BetButton variant="buy" onClick={handleClick}>Buy</BetButton>);
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledOnce();
  });

  it('disabled 状态禁用交互', () => {
    const handleClick = vi.fn();
    render(<BetButton variant="sell" disabled onClick={handleClick}>Sell</BetButton>);
    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
    fireEvent.click(btn);
    expect(handleClick).not.toHaveBeenCalled();
  });
});

describe('Skeleton', () => {
  it('渲染骨架屏元素', () => {
    const { container } = render(<Skeleton />);
    const el = container.firstElementChild as HTMLElement;
    expect(el).toBeInTheDocument();
    expect(el.className).toContain('animate-pulse');
  });

  it('支持自定义宽高', () => {
    const { container } = render(<Skeleton width="200px" height="40px" />);
    const el = container.firstElementChild as HTMLElement;
    expect(el.style.width).toBe('200px');
    expect(el.style.height).toBe('40px');
  });

  it('包含 200ms cross-fade 过渡', () => {
    const { container } = render(<Skeleton />);
    const el = container.firstElementChild as HTMLElement;
    expect(el.className).toContain('duration-200');
    expect(el.className).toContain('transition-opacity');
  });

  it('具有无障碍属性', () => {
    const { container } = render(<Skeleton />);
    const el = container.firstElementChild as HTMLElement;
    expect(el.getAttribute('role')).toBe('status');
    expect(el.getAttribute('aria-label')).toBe('加载中');
  });
});

describe('FormulaPill', () => {
  it('显示 Engine V2.1 标签', () => {
    render(<FormulaPill />);
    expect(screen.getByText('Engine V2.1')).toBeInTheDocument();
  });

  it('显示评分公式', () => {
    render(<FormulaPill />);
    expect(screen.getByText('SCORE = ROI(0.6) + STAB(0.3) + SURVIVAL(0.1)')).toBeInTheDocument();
  });

  it('作为 footer 渲染', () => {
    const { container } = render(<FormulaPill />);
    const footer = container.querySelector('footer');
    expect(footer).toBeInTheDocument();
  });

  it('应用 glass-box 样式', () => {
    const { container } = render(<FormulaPill />);
    const pill = container.querySelector('.glass-box');
    expect(pill).toBeInTheDocument();
  });
});

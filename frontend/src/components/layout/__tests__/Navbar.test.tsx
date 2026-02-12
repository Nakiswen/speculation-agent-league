import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Navbar from '../Navbar';

// Mock next/navigation
const mockUsePathname = vi.fn<() => string>();
vi.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
}));

// Mock CountdownTimer to avoid Jotai dependency
vi.mock('@/components/arena/CountdownTimer', () => ({
  default: () => <div data-testid="countdown">countdown</div>,
}));

describe('Navbar', () => {
  it('渲染 SAL Logo', () => {
    mockUsePathname.mockReturnValue('/');
    render(<Navbar />);
    expect(screen.getByText('SAL')).toBeInTheDocument();
  });

  it('渲染 Arena、Archive、Rules 三个导航链接', () => {
    mockUsePathname.mockReturnValue('/');
    render(<Navbar />);
    expect(screen.getByText('Arena')).toBeInTheDocument();
    expect(screen.getByText('Archive')).toBeInTheDocument();
    expect(screen.getByText('Rules')).toBeInTheDocument();
  });

  it('Arena 链接指向 /', () => {
    mockUsePathname.mockReturnValue('/');
    render(<Navbar />);
    const link = screen.getByText('Arena').closest('a');
    expect(link).toHaveAttribute('href', '/');
  });

  it('Archive 链接指向 /archive', () => {
    mockUsePathname.mockReturnValue('/');
    render(<Navbar />);
    const link = screen.getByText('Archive').closest('a');
    expect(link).toHaveAttribute('href', '/archive');
  });

  it('Rules 链接指向 /rules', () => {
    mockUsePathname.mockReturnValue('/');
    render(<Navbar />);
    const link = screen.getByText('Rules').closest('a');
    expect(link).toHaveAttribute('href', '/rules');
  });

  it('当路径为 / 时，Arena 链接高亮（白色文字 + 底部边框）', () => {
    mockUsePathname.mockReturnValue('/');
    render(<Navbar />);
    const link = screen.getByText('Arena').closest('a');
    expect(link?.className).toContain('text-white');
    expect(link?.className).toContain('border-b-2');
  });

  it('当路径为 /archive 时，Archive 链接高亮', () => {
    mockUsePathname.mockReturnValue('/archive');
    render(<Navbar />);
    const archiveLink = screen.getByText('Archive').closest('a');
    expect(archiveLink?.className).toContain('text-white');
    expect(archiveLink?.className).toContain('border-b-2');
    // Arena 不应高亮
    const arenaLink = screen.getByText('Arena').closest('a');
    expect(arenaLink?.className).toContain('hover:text-white');
    expect(arenaLink?.className).not.toContain('border-b-2');
  });

  it('当路径为 /rules 时，Rules 链接高亮', () => {
    mockUsePathname.mockReturnValue('/rules');
    render(<Navbar />);
    const rulesLink = screen.getByText('Rules').closest('a');
    expect(rulesLink?.className).toContain('text-white');
    expect(rulesLink?.className).toContain('border-b-2');
  });

  it('当路径为 /agents/xxx 时，所有导航链接均不高亮', () => {
    mockUsePathname.mockReturnValue('/agents/momentum-bot');
    render(<Navbar />);
    const arenaLink = screen.getByText('Arena').closest('a');
    const archiveLink = screen.getByText('Archive').closest('a');
    const rulesLink = screen.getByText('Rules').closest('a');
    expect(arenaLink?.className).not.toContain('border-b-2');
    expect(archiveLink?.className).not.toContain('border-b-2');
    expect(rulesLink?.className).not.toContain('border-b-2');
  });
});

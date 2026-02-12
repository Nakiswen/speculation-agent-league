'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import CountdownTimer from '@/components/arena/CountdownTimer';

/** 导航链接配置 */
interface NavLink {
  label: string;
  href: string;
}

const NAV_LINKS: NavLink[] = [
  { label: 'Arena', href: '/' },
  { label: 'Archive', href: '/archive' },
  { label: 'Rules', href: '/rules' },
];

/**
 * 判断当前路径是否匹配导航链接
 */
function isActiveRoute(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/';
  return pathname.startsWith(href);
}

/**
 * 顶部导航栏 — 匹配设计稿 header
 * Logo (渐变方块 + SVG 脉冲线 + SAL) | Nav | 右侧 Live Feed 倒计时 + 用户头像
 */
export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="shrink-0 mb-10 flex justify-between items-center px-4 relative z-20">
      {/* 左侧：Logo + Nav */}
      <div className="flex items-center">
        {/* Logo Symbol */}
        <div className="logo-symbol">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ zIndex: 1, position: 'relative' }}
          >
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
        </div>

        {/* Logo Text */}
        <span
          className="text-white ml-[10px]"
          style={{
            fontSize: '22px',
            fontWeight: 950,
            fontFamily: "'Space Grotesk', sans-serif",
            letterSpacing: '-0.5px',
          }}
        >
          SAL
        </span>

        {/* Navigation */}
        <nav className="flex gap-10 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-16">
          {NAV_LINKS.map((link) => {
            const active = isActiveRoute(pathname, link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`transition-colors cursor-pointer ${
                  active
                    ? 'text-white border-b-2 border-cyan-400 pb-1'
                    : 'hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* 右侧：Live Feed + 倒计时 + 用户头像 */}
      <div className="flex items-center gap-10">
        <CountdownTimer />
        <div className="w-12 h-12 rounded-xl p-[1.5px] bg-linear-to-br from-cyan-400 to-indigo-600">
          <div className="w-full h-full rounded-[10px] bg-[#010203] flex items-center justify-center font-bold text-xs uppercase">
            Dev
          </div>
        </div>
      </div>
    </header>
  );
}

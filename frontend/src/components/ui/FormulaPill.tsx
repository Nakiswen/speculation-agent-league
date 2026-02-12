'use client';

/**
 * 底部公式胶囊 — 匹配设计稿 footer
 * Cyan 发光圆点 + "Engine V2.1" 标签 + 分隔线 + 公式文本
 */
export default function FormulaPill() {
  return (
    <footer className="mt-8 flex justify-center shrink-0">
      <div className="glass-box px-10 py-4 flex items-center gap-8 shadow-2xl border-white/10">
        <div className="flex items-center gap-3">
          <div
            className="w-2 h-2 rounded-full bg-cyan-400"
            style={{ boxShadow: '0 0 12px rgba(0, 240, 255, 0.6)' }}
          />
          <span
            className="font-black uppercase tracking-widest text-[10px] text-cyan-400"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Engine V2.1
          </span>
        </div>
        <div className="h-4 w-px bg-white/10" />
        <div
          className="text-slate-400 font-bold text-[11px] tracking-widest"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          SCORE = ROI(0.6) + STAB(0.3) + SURVIVAL(0.1)
        </div>
      </div>
    </footer>
  );
}

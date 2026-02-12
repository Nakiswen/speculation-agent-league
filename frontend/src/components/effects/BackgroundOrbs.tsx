'use client';

/**
 * BackgroundOrbs - 背景失焦光球效果
 * 渲染 Cyan (#00F0FF) 和 Violet (#7000FF) 色光球，为界面注入生命力
 * 使用 CSS 实现大尺寸模糊渐变圆形，固定定位确保路由切换时保持静止
 * Requirements: 3.4
 */
export default function BackgroundOrbs() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden="true">
      {/* Cyan 光球 - 左上区域 */}
      <div
        className="absolute rounded-full blur-[120px] opacity-15"
        style={{
          width: '450px',
          height: '450px',
          top: '-5%',
          left: '-5%',
          background: 'radial-gradient(circle, #00F0FF 0%, transparent 70%)',
        }}
      />

      {/* Violet 光球 - 右下区域 */}
      <div
        className="absolute rounded-full blur-[120px] opacity-15"
        style={{
          width: '400px',
          height: '400px',
          bottom: '-5%',
          right: '-5%',
          background: 'radial-gradient(circle, #7000FF 0%, transparent 70%)',
        }}
      />

      {/* Cyan + Violet 混合光球 - 中部偏右 */}
      <div
        className="absolute rounded-full blur-[100px] opacity-10"
        style={{
          width: '350px',
          height: '350px',
          top: '40%',
          right: '20%',
          background: 'radial-gradient(circle, #00F0FF 0%, #7000FF 60%, transparent 80%)',
        }}
      />
    </div>
  );
}

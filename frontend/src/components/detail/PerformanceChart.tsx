'use client';

import type { RoiDataPoint } from '@/types';

interface PerformanceChartProps {
  /** ROI 历史数据点 */
  dataPoints: RoiDataPoint[];
  /** Agent 主题色，默认 cyan */
  agentColor?: string;
}

/**
 * ROI 历史曲线图
 * SVG 实现：白色线条 + 青色光晕 + 5% 渐变填充
 * stroke-dashoffset 动画：600ms ease-out 绘制入场
 */
export default function PerformanceChart({
  dataPoints,
  agentColor = '#00F0FF',
}: PerformanceChartProps) {
  if (dataPoints.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-slate-500">
        暂无数据
      </div>
    );
  }

  const padding = { top: 20, right: 16, bottom: 32, left: 48 };
  const width = 600;
  const height = 240;
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const values = dataPoints.map((p) => p.value);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const valRange = maxVal - minVal || 1;

  // 将数据点映射为 SVG 坐标
  const points = dataPoints.map((p, i) => ({
    x: padding.left + (i / (dataPoints.length - 1)) * chartW,
    y: padding.top + (1 - (p.value - minVal) / valRange) * chartH,
  }));

  // 构建折线路径
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');

  // 构建填充区域路径（闭合到底部）
  const fillPath = `${linePath} L${points[points.length - 1].x},${padding.top + chartH} L${points[0].x},${padding.top + chartH} Z`;

  // 计算路径总长度（近似值用于 stroke-dashoffset 动画）
  let totalLength = 0;
  for (let i = 1; i < points.length; i++) {
    const dx = points[i].x - points[i - 1].x;
    const dy = points[i].y - points[i - 1].y;
    totalLength += Math.sqrt(dx * dx + dy * dy);
  }

  // Y 轴刻度（5 个）
  const yTicks = Array.from({ length: 5 }, (_, i) => {
    const val = minVal + (valRange * i) / 4;
    const y = padding.top + (1 - i / 4) * chartH;
    return { val, y };
  });

  // X 轴标签（取首、中、尾）
  const xLabels = [0, Math.floor(dataPoints.length / 2), dataPoints.length - 1].map((idx) => {
    const p = dataPoints[idx];
    const date = new Date(p.timestamp);
    const label = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    return { x: points[idx].x, label };
  });

  return (
    <div className="w-full overflow-hidden">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* 青色光晕滤镜 */}
          <filter id="glowFilter" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          {/* 5% 透明度渐变填充 */}
          <linearGradient id="fillGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={agentColor} stopOpacity="0.05" />
            <stop offset="100%" stopColor={agentColor} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Y 轴网格线 */}
        {yTicks.map((tick) => (
          <g key={tick.val}>
            <line
              x1={padding.left}
              y1={tick.y}
              x2={width - padding.right}
              y2={tick.y}
              stroke="white"
              strokeOpacity="0.06"
            />
            <text
              x={padding.left - 8}
              y={tick.y + 4}
              textAnchor="end"
              className="fill-slate-500 text-[10px] font-mono"
            >
              {tick.val.toFixed(1)}
            </text>
          </g>
        ))}

        {/* X 轴标签 */}
        {xLabels.map((item) => (
          <text
            key={item.label}
            x={item.x}
            y={height - 6}
            textAnchor="middle"
            className="fill-slate-500 text-[10px] font-mono"
          >
            {item.label}
          </text>
        ))}

        {/* 渐变填充区域 */}
        <path d={fillPath} fill="url(#fillGradient)" />

        {/* 主线条（白色 + 青色光晕） */}
        <path
          d={linePath}
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#glowFilter)"
          strokeDasharray={totalLength}
          strokeDashoffset={totalLength}
          style={{
            animation: `chartDraw 600ms ease-out forwards`,
          }}
        />
      </svg>
    </div>
  );
}

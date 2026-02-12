'use client';

import { useRef, useEffect, useCallback } from 'react';

/** 单个粒子的属性 */
interface Particle {
  x: number;
  y: number;
  size: number;
  opacity: number;
  speedX: number;
  speedY: number;
  color: string;
}

/** 粒子数量 */
const PARTICLE_COUNT = 70;

/** 白色粒子占比 */
const WHITE_RATIO = 0.7;

/** 创建单个粒子 */
function createParticle(canvasWidth: number, canvasHeight: number): Particle {
  const isWhite = Math.random() < WHITE_RATIO;
  return {
    x: Math.random() * canvasWidth,
    y: Math.random() * canvasHeight,
    size: 1 + Math.random() * 2, // 1-3px
    opacity: 0.1 + Math.random() * 0.4, // 0.1-0.5
    speedX: (Math.random() - 0.5) * 0.3, // 缓慢随机方向
    speedY: (Math.random() - 0.5) * 0.3,
    color: isWhite ? '#FFFFFF' : '#00F0FF',
  };
}

/** 初始化粒子数组 */
function initParticles(width: number, height: number): Particle[] {
  return Array.from({ length: PARTICLE_COUNT }, () => createParticle(width, height));
}

/** 更新粒子位置，超出边界时环绕 */
function updateParticle(p: Particle, width: number, height: number): void {
  p.x += p.speedX;
  p.y += p.speedY;

  if (p.x < 0) p.x = width;
  if (p.x > width) p.x = 0;
  if (p.y < 0) p.y = height;
  if (p.y > height) p.y = 0;
}

/** 绘制单个粒子 */
function drawParticle(ctx: CanvasRenderingContext2D, p: Particle): void {
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
  ctx.fillStyle =
    p.color === '#FFFFFF'
      ? `rgba(255, 255, 255, ${p.opacity})`
      : `rgba(0, 240, 255, ${p.opacity})`;
  ctx.fill();
}

export default function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);

  /** 动画渲染循环 */
  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvas;

    // 清除画布
    ctx.clearRect(0, 0, width, height);

    // 更新并绘制每个粒子
    for (const particle of particlesRef.current) {
      updateParticle(particle, width, height);
      drawParticle(ctx, particle);
    }

    animationFrameRef.current = requestAnimationFrame(animate);
  }, []);

  /** 设置 canvas 尺寸为视口大小 */
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
    }

    // 如果粒子尚未初始化，则初始化
    if (particlesRef.current.length === 0) {
      particlesRef.current = initParticles(window.innerWidth, window.innerHeight);
    }
  }, []);

  useEffect(() => {
    resizeCanvas();

    // 启动动画循环
    animationFrameRef.current = requestAnimationFrame(animate);

    // 监听窗口大小变化
    window.addEventListener('resize', resizeCanvas);

    return () => {
      cancelAnimationFrame(animationFrameRef.current);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [animate, resizeCanvas]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none"
      aria-hidden="true"
    />
  );
}

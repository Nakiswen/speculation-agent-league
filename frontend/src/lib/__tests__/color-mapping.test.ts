import { describe, it, expect } from 'vitest';
import { getPnlColorClass } from '../color-mapping';

describe('getPnlColorClass', () => {
  it('正值返回 emerald 绿色类名', () => {
    expect(getPnlColorClass(10)).toBe('text-emerald-400');
  });

  it('负值返回红色类名', () => {
    expect(getPnlColorClass(-5)).toBe('text-red-400');
  });

  it('零值返回中性色类名', () => {
    expect(getPnlColorClass(0)).toBe('text-slate-400');
  });

  it('极小正值返回绿色', () => {
    expect(getPnlColorClass(0.001)).toBe('text-emerald-400');
  });

  it('极小负值返回红色', () => {
    expect(getPnlColorClass(-0.001)).toBe('text-red-400');
  });

  it('大正值返回绿色', () => {
    expect(getPnlColorClass(999999)).toBe('text-emerald-400');
  });

  it('大负值返回红色', () => {
    expect(getPnlColorClass(-999999)).toBe('text-red-400');
  });

  it('小数正值返回绿色', () => {
    expect(getPnlColorClass(0.5)).toBe('text-emerald-400');
  });

  it('小数负值返回红色', () => {
    expect(getPnlColorClass(-0.5)).toBe('text-red-400');
  });
});

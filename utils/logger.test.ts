import { describe, it, expect, vi, beforeEach } from 'vitest';
import { logger } from './logger';

describe('Logger utility', () => {
  beforeEach(() => {
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('formats info logs correctly', () => {
    logger.info('Test info', { userId: 123 });
    expect(console.info).toHaveBeenCalled();
    const callArg = vi.mocked(console.info).mock.calls[0][0];
    const parsed = JSON.parse(callArg);
    expect(parsed.level).toBe('info');
    expect(parsed.message).toBe('Test info');
    expect(parsed.userId).toBe(123);
  });

  it('formats error logs correctly', () => {
    const err = new Error('Test error');
    logger.error(err, { route: '/cart' });
    expect(console.error).toHaveBeenCalled();
    const callArg = vi.mocked(console.error).mock.calls[0][0];
    const parsed = JSON.parse(callArg);
    expect(parsed.level).toBe('error');
    expect(parsed.message).toBe('Test error');
    expect(parsed.route).toBe('/cart');
    expect(parsed.stack).toBeDefined();
  });
});

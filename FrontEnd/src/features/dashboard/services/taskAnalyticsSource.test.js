import { describe, expect, it, vi } from 'vitest';
import { createTaskAnalyticsSource } from './taskAnalyticsSource';

describe('createTaskAnalyticsSource', () => {
  it('uses the authenticated API Task catalog and exposes no nonexistent production summary route', async () => {
    const signal = new AbortController().signal;
    const apiClient = { tasks: vi.fn().mockResolvedValue([]) };
    const demoClient = {
      tasks: vi.fn(),
      taskSummary: vi.fn(),
    };
    const source = createTaskAnalyticsSource({ apiClient, demoClient, demoEnabled: false });

    expect(source.mode).toBe('api');
    expect(source.summary).toBeNull();
    await expect(source.tasks(signal)).resolves.toEqual([]);
    expect(apiClient.tasks).toHaveBeenCalledWith(signal);
    expect(demoClient.tasks).not.toHaveBeenCalled();
    expect(demoClient.taskSummary).not.toHaveBeenCalled();
  });

  it('keeps the demo summary adapter behind the development source', async () => {
    const demoClient = {
      tasks: vi.fn().mockResolvedValue([]),
      taskSummary: vi.fn().mockResolvedValue({ tasks: [] }),
    };
    const source = createTaskAnalyticsSource({ demoClient, demoEnabled: true });
    const signal = new AbortController().signal;

    expect(source.mode).toBe('demo');
    await source.summary('2026-11-04', 'ana', '', signal);
    expect(demoClient.taskSummary).toHaveBeenCalledWith('2026-11-04', 'ana', '', signal);
  });
});

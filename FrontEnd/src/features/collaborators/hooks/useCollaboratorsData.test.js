import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '../../../shared/api/api';
import { useCollaboratorsData } from './useCollaboratorsData';

vi.mock('../../../shared/api/api', () => ({ api: { users: vi.fn(), realtime: vi.fn() } }));

beforeEach(() => vi.resetAllMocks());

describe('useCollaboratorsData', () => {
  it('preserves the last valid source data when a refresh partially fails', async () => {
    const users = [{ username: 'ana', full_name: 'Ana Souza', department: 'Produto' }];
    const realtime = [{ username: 'ana', status: 'online', process_name: 'Editor' }];
    api.users.mockResolvedValueOnce(users).mockRejectedValueOnce(new Error('source unavailable'));
    api.realtime.mockResolvedValue(realtime);

    const { result } = renderHook(() => useCollaboratorsData());
    await waitFor(() => expect(result.current.refreshState).toBe('complete'));

    act(() => result.current.refresh());
    await waitFor(() => expect(result.current.refreshState).toBe('partial'));

    expect(result.current.users).toEqual(users);
    expect(result.current.realtime).toEqual(realtime);
    expect(result.current.people[0]).toMatchObject({ username: 'ana', status: 'online' });
    expect(result.current.error).toContain('source unavailable');
  });
});

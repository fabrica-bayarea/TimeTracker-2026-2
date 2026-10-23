import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useAssociationCode } from './useAssociationCode';

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('useAssociationCode', () => {
  it('mostra carregamento e preserva código válido com zeros à esquerda', async () => {
    const pending = deferred();
    const client = { getAssociationCode: vi.fn(() => pending.promise) };
    const { result } = renderHook(() => useAssociationCode('manager-1', client));

    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(client.getAssociationCode).toHaveBeenCalledOnce());
    expect(client.getAssociationCode.mock.calls[0][0]).toBeInstanceOf(AbortSignal);

    await act(async () => pending.resolve('001234'));
    expect(result.current.code).toBe('001234');
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it.each(['12345', '1234567', '12a456', 123456, null, undefined])(
    'rejeita resposta inválida ou código ausente (%s)',
    async (code) => {
      const client = { getAssociationCode: vi.fn().mockResolvedValue(code) };
      const { result } = renderHook(() => useAssociationCode('manager-1', client));

      await waitFor(() => expect(result.current.error).toMatch(/código de associação inválido/));
      expect(result.current.code).toBeNull();
    },
  );

  it('distingue falha de rede e não exibe detalhes do serviço', async () => {
    const client = {
      getAssociationCode: vi.fn().mockRejectedValue(new Error('segredo interno do servidor')),
    };
    const { result } = renderHook(() => useAssociationCode('manager-1', client));

    await waitFor(() => expect(result.current.error).toMatch(/Não foi possível consultar/));
    expect(result.current.error).not.toContain('segredo interno');
    expect(result.current.code).toBeNull();
  });

  it('trata timeout com mensagem própria', async () => {
    const client = {
      getAssociationCode: vi
        .fn()
        .mockRejectedValue(Object.assign(new Error(), { type: 'timeout' })),
    };
    const { result } = renderHook(() => useAssociationCode('manager-1', client));

    await waitFor(() => expect(result.current.error).toMatch(/tempo limite/));
  });

  it('não confunde falha 401 com código ausente', async () => {
    const client = {
      getAssociationCode: vi.fn().mockRejectedValue(Object.assign(new Error(), { status: 401 })),
    };
    const { result } = renderHook(() => useAssociationCode('manager-1', client));

    await waitFor(() => expect(result.current.error).toMatch(/sessão não pôde ser validada/));
    expect(result.current.pending).toBe(false);
    expect(result.current.code).toBeNull();
  });

  it('limpa o código no logout e ignora uma resposta que chega depois', async () => {
    const pending = deferred();
    const client = { getAssociationCode: vi.fn(() => pending.promise) };
    const { result, rerender } = renderHook(
      ({ managerId }) => useAssociationCode(managerId, client),
      { initialProps: { managerId: 'manager-1' } },
    );
    await waitFor(() => expect(client.getAssociationCode).toHaveBeenCalledOnce());
    const signal = client.getAssociationCode.mock.calls[0][0];

    rerender({ managerId: null });
    expect(signal.aborted).toBe(true);
    expect(result.current.code).toBeNull();
    await act(async () => pending.resolve('001234'));
    expect(result.current.code).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('descarta a resposta atrasada do gestor anterior ao alternar de sessão', async () => {
    const oldRequest = deferred();
    const client = {
      getAssociationCode: vi
        .fn()
        .mockImplementationOnce(() => oldRequest.promise)
        .mockResolvedValueOnce('654321'),
    };
    const { result, rerender } = renderHook(
      ({ managerId }) => useAssociationCode(managerId, client),
      { initialProps: { managerId: 'manager-1' } },
    );
    await waitFor(() => expect(client.getAssociationCode).toHaveBeenCalledOnce());
    const oldSignal = client.getAssociationCode.mock.calls[0][0];

    rerender({ managerId: 'manager-2' });
    await waitFor(() => expect(result.current.code).toBe('654321'));
    expect(oldSignal.aborted).toBe(true);

    await act(async () => oldRequest.resolve('001234'));
    expect(result.current.code).toBe('654321');
  });

  it('mantém integração pendente quando o cliente não implementa a consulta', async () => {
    const client = {};
    const { result } = renderHook(() => useAssociationCode('manager-1', client));

    await waitFor(() => expect(result.current.pending).toBe(true));
    expect(result.current.code).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });
});

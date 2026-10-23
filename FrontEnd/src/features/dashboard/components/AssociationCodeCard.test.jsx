import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AssociationCodeCard } from './AssociationCodeCard';

const originalClipboard = Object.getOwnPropertyDescriptor(navigator, 'clipboard');

afterEach(() => {
  cleanup();
  if (originalClipboard) Object.defineProperty(navigator, 'clipboard', originalClipboard);
  else delete navigator.clipboard;
});

describe('AssociationCodeCard', () => {
  it('exibe um código de seis dígitos preservando zeros à esquerda', () => {
    render(<AssociationCodeCard code="001234" />);

    expect(screen.getByText('001234')).toBeInTheDocument();
    expect(screen.getByText('Compartilhe este código com os membros da sua equipe.')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Copiar código de associação' })).toBeEnabled();
  });

  it('copia o conteúdo exato e informa sucesso', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
    render(<AssociationCodeCard code="001234" />);

    fireEvent.click(screen.getByRole('button', { name: 'Copiar código de associação' }));

    expect(writeText).toHaveBeenCalledWith('001234');
    expect(await screen.findByText('Copiado!')).toHaveAttribute('aria-live', 'polite');
  });

  it('informa falha do Clipboard API sem propagar a exceção', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn().mockRejectedValue(new Error('permissão negada')) },
    });
    render(<AssociationCodeCard code="123456" />);

    fireEvent.click(screen.getByRole('button', { name: 'Copiar código de associação' }));

    expect(await screen.findByText('Não foi possível copiar o código.')).toBeInTheDocument();
  });

  it('apresenta carregamento e desabilita a cópia', () => {
    render(<AssociationCodeCard loading />);

    expect(
      screen.getByRole('status', { name: 'Carregando código de associação' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Copiar código de associação' })).toBeDisabled();
  });

  it('apresenta indisponibilidade e rejeita códigos fora do formato', () => {
    render(<AssociationCodeCard code="12345" />);

    expect(screen.getByText(/Código de associação indisponível/)).toBeInTheDocument();
    expect(screen.queryByText('12345')).not.toBeInTheDocument();
    expect(
      screen.queryByText('Compartilhe este código com os membros da sua equipe.'),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Copiar código de associação' })).toBeDisabled();
  });

  it.each([undefined, null, '', 123456, '12a456', '1234567'])(
    'não exibe nem permite copiar código inválido (%s)',
    (code) => {
      render(<AssociationCodeCard code={code} />);

      expect(screen.getByText(/Código de associação indisponível/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Copiar código de associação' })).toBeDisabled();
    },
  );

  it('informa quando Clipboard API está indisponível', async () => {
    delete navigator.clipboard;
    render(<AssociationCodeCard code="123456" />);

    fireEvent.click(screen.getByRole('button', { name: 'Copiar código de associação' }));

    expect(await screen.findByText('Não foi possível copiar o código.')).toHaveAttribute(
      'aria-live',
      'polite',
    );
  });

  it('limpa o feedback de cópia quando o código muda', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
    const { rerender } = render(<AssociationCodeCard code="001234" />);

    fireEvent.click(screen.getByRole('button', { name: 'Copiar código de associação' }));
    expect(await screen.findByText('Copiado!')).toBeInTheDocument();

    rerender(<AssociationCodeCard code="009876" />);
    await waitFor(() => expect(screen.queryByText('Copiado!')).not.toBeInTheDocument());
    expect(screen.getByText('009876')).toBeInTheDocument();
  });

  it('permite tentar novamente após erro de consulta', () => {
    const onRetry = vi.fn();
    render(<AssociationCodeCard error="Falha de rede." onRetry={onRetry} />);

    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('explica que a consulta aguarda o contrato do Backend sem exibir código', () => {
    render(<AssociationCodeCard pending />);

    expect(screen.getByText(/Backend ainda não disponibiliza/)).toHaveAttribute(
      'aria-live',
      'polite',
    );
    expect(screen.queryByText(/^\d{6}$/)).not.toBeInTheDocument();
    expect(
      screen.queryByText('Compartilhe este código com os membros da sua equipe.'),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Copiar código de associação' })).toBeDisabled();
  });

  it('apresenta erro de integração como alerta', () => {
    render(<AssociationCodeCard error="Não foi possível consultar o código." />);

    expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível consultar o código.');
  });
});

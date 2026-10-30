import { IntegrationNotice } from '../../../shared/components/IntegrationNotice';

export function DashboardStatusNotice() {
  return (
    <div className="mb-5">
      <IntegrationNotice>
        A lista da API é global e ainda não representa uma equipe vinculada ao gestor; essas rotas
        não exigem nem aplicam autorização por gestor no Backend. Os estados Online, Ausente e
        Offline são calculados pela API a partir das capturas. Offline não confirma que o Agent
        perdeu conexão com o servidor.
      </IntegrationNotice>
    </div>
  );
}

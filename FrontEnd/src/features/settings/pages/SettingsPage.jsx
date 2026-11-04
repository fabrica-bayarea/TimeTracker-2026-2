import { PageHeader } from '../../../shared/components/PageHeader';
import { IntegrationNotice } from '../../../shared/components/IntegrationNotice';
import { SettingsForm } from '../components/SettingsForm';
import { useSettings } from '../hooks/useSettings';

export function SettingsPage() {
  const settings = useSettings();
  return (
    <>
      <PageHeader
        title="Configurações"
        description="Parâmetros globais fornecidos pela API atual."
      />
      <IntegrationNotice>
        Jornada e limite de inatividade por colaborador precisam de contratos próprios. Estes campos
        são globais e as rotas atuais não exigem autorização do gestor; o backend também precisa
        aplicar o limite salvo ao cálculo de atividade.
      </IntegrationNotice>
      <SettingsForm {...settings} />
    </>
  );
}

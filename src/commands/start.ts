import { DefaultAzureCredential } from '@azure/identity';
import { ComputeManagementClient } from '@azure/arm-compute';
import { envs } from '../config';

type Callback = (message: string) => void;

export async function startCommand(
  resourceGroup: string,
  vmName: string,
  sendCallback: Callback
): Promise<void> {
  try {
    if (!resourceGroup || !vmName) {
      sendCallback(
        '❌ Faltan configuraciones de Azure (RESOURCE_GROUP o VM_NAME).'
      );
      return;
    }

    const credential = new DefaultAzureCredential();
    const computeClient = new ComputeManagementClient(
      credential,
      envs.AZURE_SUBSCRIPTION_ID || ''
    );

    // Paso 1: Informar sobre el estado inicial
    sendCallback(
      `⚙️ Verificando el estado de la máquina virtual "${vmName}"...`
    );

    // Obtener estado de la máquina virtual
    const instanceView = await computeClient.virtualMachines.instanceView(
      resourceGroup,
      vmName
    );
    const statuses = instanceView.statuses || [];
    const powerState = statuses.find((status) =>
      status.code?.startsWith('PowerState/')
    )?.displayStatus;

    if (powerState === 'VM running') {
      sendCallback(`✅ El servidor ya está encendido.`);
      return;
    }

    // Paso 2: Informar sobre el inicio del encendido
    sendCallback(`🚀 El servidor se está encendiendo...`);

    // Encender la máquina virtual
    await computeClient.virtualMachines.beginStartAndWait(
      resourceGroup,
      vmName
    );

    // Paso 3: Confirmar el encendido
    sendCallback(`✅ El servidor "${vmName}" se ha encendido correctamente.`);
  } catch (error) {
    console.error('Error encendiendo el servidor:', error);
    sendCallback('❌ Ocurrió un error al intentar encender el servidor.');
  }
}

import { Client, ClientChannel } from 'ssh2';
import { DefaultAzureCredential } from '@azure/identity';
import { ComputeManagementClient } from '@azure/arm-compute';
import { readFileSync } from 'fs';
import { join } from 'path';

export async function stopCommand(
  resourceGroup: string,
  vmName: string,
  onMessage: (message: string) => void // Callback para enviar mensajes
): Promise<void> {
  const sshUser = process.env.SSH_USER || '';
  const sshHost = process.env.SSH_HOST || '';
  const privateKeyPath = join(__dirname, '../../keys/minecraft-server_key.pem'); // Ruta al archivo .pem

  if (!sshUser || !sshHost) {
    onMessage('❌ Faltan configuraciones de SSH (SSH_USER o SSH_HOST).');
    return;
  }

  try {
    const privateKey = readFileSync(privateKeyPath, 'utf8'); // Cargar el archivo .pem

    // Paso 1: Conectarse al servidor mediante SSH y detener el servicio de Minecraft
    onMessage('🛠️ Apagando el servidor de Minecraft...');
    await new Promise<void>((resolve, reject) => {
      const conn = new Client();

      conn
        .on('ready', () => {
          console.log('Conexión SSH establecida.');
          conn.exec(
            'sudo systemctl stop minecraft-server.service',
            (err, stream: ClientChannel) => {
              if (err) {
                reject(err);
                return;
              }

              stream
                .on('close', (code: number, signal: string | null) => {
                  console.log(
                    `Comando ejecutado, código: ${code}, señal: ${signal}`
                  );
                  conn.end();
                  resolve();
                })
                .on('data', (data: Buffer) => {
                  console.log(`Salida: ${data.toString()}`);
                })
                .stderr.on('data', (data: Buffer) => {
                  console.error(`Error: ${data.toString()}`);
                });
            }
          );
        })
        .on('error', (err: Error) => {
          reject(err);
        })
        .connect({
          host: sshHost,
          username: sshUser,
          privateKey,
        });
    });

    // Paso 2: Esperar 20 segundos
    onMessage('⏳ Esperando 20 segundos para apagar la máquina virtual...');
    await new Promise((resolve) => setTimeout(resolve, 20000));

    // Paso 3: Apagar la máquina virtual en Azure
    const credential = new DefaultAzureCredential();
    const computeClient = new ComputeManagementClient(
      credential,
      process.env.AZURE_SUBSCRIPTION_ID || ''
    );

    await computeClient.virtualMachines.beginDeallocateAndWait(
      resourceGroup,
      vmName
    );

    // Mensaje final
    onMessage(`✅ La máquina virtual "${vmName}" se apagó exitosamente.`);
  } catch (error) {
    console.error('Error deteniendo el servidor:', error);
    onMessage('❌ Ocurrió un error al intentar detener el servidor.');
  }
}

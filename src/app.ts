import { startCommand, customCommand, stopCommand } from './commands';
import { envs } from './config';
import { Client } from 'discord.js';

const ALLOWED_CHANNEL_ID = envs.ALLOWED_CHANNEL_ID;
const ALLOWED_ROLE_ID = envs.ALLOWED_ROLE_ID;

const client = new Client({
  intents: ['Guilds', 'GuildMessages', 'GuildMembers', 'MessageContent'],
});

client.on('ready', (c) => {
  console.log(`${c.user.username} is online.`);
});

client.on('messageCreate', async (message) => {
  // Verificar message.member
  if (!message.member) return;

  // Verificar canal específico
  if (message.channel.id !== ALLOWED_CHANNEL_ID) return;

  // Verificar si el mensaje comienza con !minebot
  if (!message.content.startsWith('!minebot')) return;

  // Verificar rol del usuario
  const hasAllowedRole = message.member.roles.cache.has(ALLOWED_ROLE_ID);
  if (!hasAllowedRole) {
    message.reply('No tienes permiso para usar estos comandos.');
    return;
  }

  const args = message.content.split(' ');
  const command = args[1]?.toLowerCase(); // El comando viene después de !minebot

  try {
    switch (command) {
      case 'start':
        // Llamada al comando
        startCommand(envs.RESOURCE_GROUP, envs.VM_NAME, (msg) => {
          message.reply(msg); // Envía los mensajes en tiempo real al canal de Discord
        });
        break;

      case 'stop':
        stopCommand(envs.RESOURCE_GROUP, envs.VM_NAME, (msg) => {
          message.reply(msg); // Envía los mensajes en tiempo real al canal de Discord
        });
        break;

      case 'command':
        if (args.length > 2) {
          const mcCommand = args.slice(2).join(' ');
          // const cmdResult = await sendMinecraftCommand(mcCommand);
          // message.reply(cmdResult);
          message.reply(`${mcCommand}: Comando no implementado`);
        } else {
          message.reply('Por favor, proporciona un comando de Minecraft');
        }
        break;

      default:
        message.reply('Comandos disponibles: start, stop, command');
    }
  } catch (error) {
    message.reply(`Ocurrió un error: ${error}`);
  }
});

client.login(envs.DISCORD_TOKEN);

import { Message } from 'discord.js';

export async function customCommand(message: Message, args: string[]) {
  if (args.length > 0) {
    const mcCommand = args.join(' ');
    // Lógica para enviar comandos a Minecraft (simulada aquí)
    message.reply(mcCommand);
  } else {
    message.reply('Por favor, proporciona un comando de Minecraft');
  }
}

import { ChatInputCommandInteraction, Client, EmbedBuilder } from "discord.js";

export async function sendEmbed(
  interaction: ChatInputCommandInteraction,
  embed: EmbedBuilder,
  message: string
) {
  await interaction.reply({ embeds: [embed], content: message });
}

export async function sendEmbedWithReactions(
  interaction: ChatInputCommandInteraction,
  embed: EmbedBuilder,
  message: string,
  reactions: string[],
  client: Client
) {
  const msg = await interaction.reply({
    embeds: [embed],
    content: message,
    fetchReply: true,
  });

  if ("guildId" in msg) {
    const channel = await client.channels.fetch(msg.channelId);
    if (channel?.isTextBased()) {
      const message = await channel.messages.fetch(msg.id);
      for (const reaction of reactions) {
        await message.react(reaction);
      }
    }
  }
}

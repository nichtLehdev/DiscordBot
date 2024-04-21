import {
  AttachmentBuilder,
  AttachmentData,
  Channel,
  ChatInputCommandInteraction,
  Client,
  EmbedBuilder,
  TextChannel,
} from "discord.js";

export async function sendEmbed(
  interaction: ChatInputCommandInteraction,
  embed: EmbedBuilder,
  message: string
) {
  await interaction.reply({ embeds: [embed], content: message });
}

export async function sendEmbedToChannel(
  client: Client,
  channel: TextChannel,
  embed: EmbedBuilder,
  message: string,
  attachment: AttachmentBuilder | null
) {
  if (!(await client.channels.fetch(channel.id))) return;

  if (attachment) {
    await channel.send({
      embeds: [embed],
      content: message,
      files: [attachment],
    });
  } else {
    await channel.send({ embeds: [embed], content: message });
  }
}

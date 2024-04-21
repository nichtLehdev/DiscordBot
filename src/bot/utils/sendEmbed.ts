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
  channel: Channel,
  embed: EmbedBuilder,
  message: string,
  attachment: AttachmentBuilder | null
) {
  if (!channel?.isTextBased()) return;

  if (!(await client.channels.fetch(channel.id))) return;

  if (attachment) {
    await (channel as TextChannel).send({
      embeds: [embed],
      content: message,
      files: [attachment],
    });
  } else {
    await (channel as TextChannel).send({ embeds: [embed], content: message });
  }
}

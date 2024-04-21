import {
  AttachmentBuilder,
  ChatInputCommandInteraction,
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
  channel: TextChannel,
  embed: EmbedBuilder,
  message: string,
  attachment: AttachmentBuilder | null
) {
  console.log("Sending embed to channel");
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

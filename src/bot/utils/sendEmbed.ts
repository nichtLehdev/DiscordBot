import {
  AttachmentBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  Message,
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
  let dcMsg: Message<true>;
  if (attachment) {
    return await channel.send({
      embeds: [embed],
      content: message,
      files: [attachment],
    });
  } else {
    return await channel.send({ embeds: [embed], content: message });
  }
}

import { ChatInputCommandInteraction, PermissionsBitField } from "discord.js";
import {
  addServerToDatabase,
  checkServerInDatabase,
} from "../../../database/server";
import { ServerRow } from "../../../types/database";

export async function register_cmd(interaction: ChatInputCommandInteraction) {
  // get channel id from command options
  const channelId = interaction.options.getChannel("channel", true);

  // Check if the user is an admin
  const user = interaction.member;
  if (!user) {
    await interaction.reply({
      content: "You need to be in a guild to use this command.",
      ephemeral: true,
    });
    return;
  }
  const permissions = user.permissions;
  if (!permissions || !(permissions instanceof PermissionsBitField)) {
    await interaction.reply({
      content: "You need to be in a guild to use this command.",
      ephemeral: true,
    });
    return;
  }
  if (!permissions.has(PermissionsBitField.Flags.Administrator)) {
    await interaction.reply({
      content: "You need to be an admin to use this command.",
      ephemeral: true,
    });
    return;
  }

  // Check if server is already registered
  let server = await checkServerInDatabase(interaction.guildId || "");
  if (typeof server != "boolean") {
    server = server as ServerRow;
    console.log(server);
    await interaction.reply(
      `This server is already registered with channel <#${server.channel_id}>`
    );
    return;
  }

  // Register the server
  addServerToDatabase(interaction.guildId!, channelId.id);

  await interaction.reply("Registering the server...");
  return;
}

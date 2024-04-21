import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v10";
import { SlashCommandBuilder } from "discord.js";
import "dotenv/config";

const commands = [
  new SlashCommandBuilder()
    .setName("traewelling")
    .setDescription("Traewelling commands")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("profile")
        .setDescription("Get your traewelling profile")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("users")
        .setDescription("Get all users in the database")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("checkins")
        .setDescription("Set up checkin messages for you in this server.")
        .addBooleanOption((option) =>
          option
            .setName("send")
            .setDescription("Send the check-ins to the channel")
            .setRequired(true)
        )
        .addBooleanOption((option) =>
          option
            .setName("unlisted")
            .setDescription("Whether to allow unlisted check-ins to be sent")
        )
        .addBooleanOption((option) =>
          option
            .setName("followers-only")
            .setDescription(
              "Whether to allow followers-only check-ins to be sent"
            )
        )
        .addBooleanOption((option) =>
          option
            .setName("private")
            .setDescription("Whether to allow private check-ins to be sent")
        )
    ),

  new SlashCommandBuilder()
    .setName("register")
    .setDescription("Register the bot")
    .addChannelOption((option) =>
      option
        .setName("channel")
        .setDescription("The channel to post check-ins")
        .setRequired(true)
    ),
].map((command) => command.toJSON());

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN!);

rest
  .put(
    Routes.applicationGuildCommands(
      process.env.DISCORD_CLIENT_ID!,
      process.env.DISCORD_DEV_GUILD!
    ),
    { body: commands }
  )
  .then(() => console.log("Successfully registered guild commands."))
  .catch(console.error);

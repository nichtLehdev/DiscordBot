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

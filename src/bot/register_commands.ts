import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v10";
import { SlashCommandBuilder } from "discord.js";
import "dotenv/config";

const commands = [
  new SlashCommandBuilder()
    .setName("user")
    .setDescription("Get user data from the database or register a new user"),
  new SlashCommandBuilder().setName("ping").setDescription("Ping!"),
  new SlashCommandBuilder()
    .setName("users")
    .setDescription("List of users in the database"),
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

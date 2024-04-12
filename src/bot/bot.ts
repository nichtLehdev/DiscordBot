// src/bot.ts
import { Client, GatewayIntentBits, Interaction, Partials } from "discord.js";
import "dotenv/config";
import { traewelling_cmd } from "./commands/traewelling";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildMessageReactions,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.GuildMember],
});

client.once("ready", () => {
  console.log(`Logged in as ${client.user?.tag}!`);
});

client.on("interactionCreate", async (interaction: Interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "traewelling") {
    traewelling_cmd(interaction);
  }
});

client.on("messageReactionAdd", async (reaction, user) => {
  if (!reaction.message.author) return;
  // Check if the reaction is on a bot's message
  if (reaction.message.author.bot) {
    // Check if the reacting user is not the bot itself
    const botid = client.user!.id;
    if (user.id !== botid) {
      // Determine if the reaction added is the same as one the bot has added
      const botReaction = reaction.message.reactions.cache.find(
        (r) => r.users.cache.has(botid) && r.emoji.name === reaction.emoji.name
      );

      if (botReaction) {
      }
    }
  }
});

client.login(process.env.DISCORD_TOKEN);

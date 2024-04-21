// src/bot.ts
import {
  Client,
  EmbedBuilder,
  GatewayIntentBits,
  Interaction,
  Partials,
} from "discord.js";
import "dotenv/config";
import { traewelling_cmd } from "./commands/traewelling";
import { register_cmd } from "./commands/general";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildMessageReactions,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.GuildMember],
});

client.once("ready", () => {
  console.log(`Logged in as ${client.user?.tag}!`);
});

export const sendEmbedWithReactions = async (
  channelId: string,
  embed: EmbedBuilder,
  message: string,
  reactions: string[]
) => {
  const channel = await client.channels.fetch(channelId);

  if (!channel?.isTextBased()) return;

  const msg = await channel.send({ embeds: [embed], content: message });
  for (const reaction of reactions) {
    await msg.react(reaction);
  }
};

client.on("guildCreate", async (guild) => {
  console.log(`Joined a new guild: ${guild.name}`);

  try {
    if (!client.user) return; // This really wouldn't make sense, but typescript is complaining
    const botMember = await guild.members.fetch(client.user.id);
    if (botMember) {
      console.log(`Bot's display name in this guild: ${botMember.displayName}`);

      // Check for specific permissions
      if (
        guild.systemChannel &&
        botMember.permissionsIn(guild.systemChannel).has("SendMessages")
      ) {
        await guild.systemChannel.send(
          "Hello! Thanks for adding me to your server!\n" +
            "To get started, use the `/register` command to register the bot.\n" +
            "You need to be an admin to do this."
        );
      }
    }
  } catch (error) {
    console.error(`Error fetching bot member in ${guild.name}:`, error);
  }
});

client.on("interactionCreate", async (interaction: Interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "traewelling") {
    await traewelling_cmd(interaction);
  } else if (interaction.commandName === "register") {
    await register_cmd(interaction);
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
        // Add your logic here
        console.log(
          `User ${user.tag} reacted with ${reaction.emoji.name} to the message with id ${reaction.message.id}`
        );
      }
    }
  }
});

client.login(process.env.DISCORD_TOKEN);

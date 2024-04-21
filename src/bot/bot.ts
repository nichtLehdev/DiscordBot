// src/bot.ts
import {
  AttachmentBuilder,
  Client,
  EmbedBuilder,
  GatewayIntentBits,
  Interaction,
  Partials,
} from "discord.js";
import "dotenv/config";
import { traewelling_cmd } from "./modules/traewelling/commands";
import { register_cmd } from "./modules/general/commands";
import { getUserByTraewellingId } from "../database/user";
import { getRelationsByUserId } from "../database/server";
import { createCheckInEmbed } from "./modules/traewelling";
import { sendEmbedToChannel } from "./utils/sendEmbed";

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

export const sendCheckInEmbeds = async (status: TW_Status) => {
  // get all relations with the given user_id
  const user = await getUserByTraewellingId(status.user);
  if (!user) {
    return;
  }

  if (!user.dc_id) {
    console.log("User has no discord id");
    return;
  }

  const relations = await getRelationsByUserId(user.dc_id);

  // get the check-in embed
  const { embed, imageBuffer } = await createCheckInEmbed(status);
  const attachment = new AttachmentBuilder(imageBuffer).setName("map.png");

  // send the embed to all servers/channels
  for (const relation of relations) {
    const guild = await client.guilds.fetch(relation.server_id);
    const channel = await guild.channels.fetch(relation.channel_id);
    if (!channel) {
      continue;
    }

    // check status visibility
    const visibility = status.visibility; // 0: public, 1: unlisted, 2: followers, 3: private, 4: authenticated
    switch (visibility) {
      case 1:
        if (!relation.unlisted) {
          continue;
        }
        break;
      case 2:
        if (!relation.followers) {
          continue;
        }
        break;
      case 3:
        if (!relation.private) {
          continue;
        }
        break;
      default:
        break;
    }
    const msg = `<@${user.dc_id}> has posted a new check-in!`;
    await sendEmbedToChannel(client, channel, embed, msg, attachment);
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

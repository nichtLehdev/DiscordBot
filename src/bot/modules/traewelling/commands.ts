import { ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import {
  checkDiscordUserInDatabase,
  getUserByDiscordId,
  checkTwUserInDatabase,
  saveDiscordIdToDatabase,
  getUsers,
} from "../../../database/user";
import {
  checkRelationInDatabase,
  checkServerInDatabase,
  createRelationInDatabase,
  updateRelationInDatabase,
} from "../../../database/server";

export async function traewelling_cmd(
  interaction: ChatInputCommandInteraction
) {
  const subcommand = interaction.options.getSubcommand();

  switch (subcommand) {
    case "profile":
      const userId = interaction.options.getUser("user")?.id;
      await user(
        interaction,
        userId ?? interaction.user.id,
        userId == undefined ? true : false
      );
      break;
    case "users":
      await users(interaction);
      break;
    case "checkins":
      await registerUser(interaction);
      break;
  }
}

async function user(
  interaction: ChatInputCommandInteraction,
  userId: string,
  self: boolean
) {
  const userExistsDc = await checkDiscordUserInDatabase(userId);

  if (userExistsDc) {
    //get the user from the database, then query the api for the user's data
    const user = await getUserByDiscordId(userId);
    if (!user) {
      await interaction.reply("Error: User not found in the database");
      return;
    }
    const tw_user = await fetch(process.env.TW_API_URL + "/auth/user", {
      headers: {
        Authorization: "Bearer " + user.access_token,
        Accept: "application/json",
      },
    });

    const tw_user_json = await tw_user.json();
    if (!tw_user_json) {
      await interaction.reply("Error: No JSON response from user endpoint");
      return;
    }

    const tw_user_data = tw_user_json.data as TW_User;

    const embed = new EmbedBuilder()
      .setTitle(tw_user_data.displayName)
      .setDescription(
        `Username: ${tw_user_data.username}\nPoints: ${
          tw_user_data.points
        }\nTrain Distance: ${Number(tw_user_data.trainDistance / 1000).toFixed(
          2
        )} km\nTrain Duration: ${Number(
          tw_user_data.trainDuration / 60
        ).toFixed(2)} hours`
      )
      .setThumbnail(tw_user_data.profilePicture)
      .addFields([
        {
          name: "Twitter",
          value: tw_user_data.twitterUrl || "Not set",
        },
        {
          name: "Mastodon",
          value: tw_user_data.mastodonUrl || "Not set",
        },
      ]);

    await interaction.reply({ embeds: [embed] });
    return;
  } else {
    if (!self) {
      await interaction.reply(
        "User is not yet registered! You can't view this profile."
      );
      return;
    }

    await interaction.reply(
      "Sorry, user not found in the database. Please register first. \nPlease check your DMs for more information."
    );
    const loginUrlHost = process.env.TW_OAUTH;
    const loginUrlParams = new URLSearchParams({
      response_type: "code",
      client_id: process.env.TW_CLIENT_ID!,
      redirect_uri: process.env.TW_REDIRECT_URI!,
      scope:
        "write-likes read-statuses read-notifications write-notifications write-followers",
      trwl_webhook_url: process.env.TW_WEBHOOK_URL!,
      trwl_webhook_events:
        "checkin_create,checkin_update,checkin_delete,notification",
    });

    const loginUrl = `${loginUrlHost}?${loginUrlParams.toString()}`;

    await interaction.user.send(
      "Please register first by visiting [this link](" + loginUrl + ")."
    );

    // The user should send a message to the bot with its traewelling id. Get the id

    await interaction.user.send(
      "Please send your Traewelling ID to the bot to complete the registration."
    );

    const idMessage = interaction.user.dmChannel?.awaitMessages({
      max: 1,
      time: 60000,
      errors: ["time"],
    });

    if (idMessage) {
      const id = (await idMessage).first()?.content;
      if (id && Number(id) && Number(id) > 0) {
        // Check if the id is saved in the database
        const userExistsTw = await checkTwUserInDatabase(Number(id));
        if (userExistsTw) {
          // get user dc_id and save it in the database
          saveDiscordIdToDatabase(interaction.user.id, Number(id));
          await interaction.user.send(
            "Registration successful. You can now use the /traewelling profile command."
          );
        }
      }
    }
  }
}

async function users(interaction: ChatInputCommandInteraction) {
  const users = await getUsers();
  const embed = new EmbedBuilder()
    .setTitle("Users")
    .setDescription("List of users in the database")
    .addFields(
      users.map((user) => ({
        name: user.display_name,
        value: `ID: ${user.id}, DC: <@${user.dc_id}>`,
      }))
    );

  await interaction.reply({ embeds: [embed] });
}

async function registerUser(interaction: ChatInputCommandInteraction) {
  const user = await checkDiscordUserInDatabase(interaction.user.id);
  if (typeof user === "boolean") {
    await interaction.reply(
      "Error: You are not yet registered. Please use the `/traewelling profile` and follow the instructions to register."
    );
    return;
  }

  const server = await checkServerInDatabase(interaction.guildId || "");
  if (typeof server === "boolean") {
    await interaction.reply(
      "Error: Server not registered. Please use the `/register` command to register the bot. If you are not an admin, please ask an admin to do it for you."
    );
    return;
  }

  // User and Server are both registered in the database
  // Save the relationship between the user and the server

  // get options from the command
  const send = interaction.options.getBoolean("send", true);
  const mention = interaction.options.getBoolean("mention", true);
  const unlisted = interaction.options.getBoolean("unlisted", false);
  const followers = interaction.options.getBoolean("followers-only", false);
  const pvt = interaction.options.getBoolean("private", false);

  // check if a relationship already exists
  const relationship = await checkRelationInDatabase(
    user.dc_id!,
    server.server_id
  );

  if (typeof relationship === "boolean") {
    // create a new relationship
    await createRelationInDatabase(user.dc_id!, server.server_id, {
      send,
      mention,
      unlisted: unlisted || false,
      followers: followers || false,
      private: pvt || false,
    });
    await interaction.reply("User registered successfully");
  } else {
    // update the relationship
    await updateRelationInDatabase(relationship.id, {
      send,
      mention,
      unlisted: unlisted || relationship.unlisted,
      followers: followers || relationship.followers,
      pvt: pvt || relationship.private,
    });
    await interaction.reply("Permissions updated successfully");
  }
}

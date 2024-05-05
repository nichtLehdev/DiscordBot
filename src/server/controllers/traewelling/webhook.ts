import { Request, Response } from "express";
import { createHmac } from "crypto";
import { sendCheckInEmbeds, sendTraewellingEmbed } from "../../../bot/bot";
import {
  checkTwUserInDatabase,
  getUserByTraewellingId,
} from "../../../database/user";
import { EmbedBuilder } from "discord.js";
import dayjs from "dayjs";

async function validate(req: Request, res: Response) {
  const { body, headers } = req;

  if (!body) {
    return res.status(400).send("Error: No body found in request");
  }

  if (!headers) {
    return res.status(400).send("Error: No headers found in request");
  }

  if (!headers["x-traewelling-signature"]) {
    return res.status(400).send("Error: No signature found in headers");
  }

  if (!headers["x-trwl-user-id"]) {
    return res.status(400).send("Error: No user id found in headers");
  }

  if (!headers["x-trwl-webhook-id"]) {
    return res.status(400).send("Error: No webhook id found in headers");
  }

  const signature = headers["x-traewelling-signature"];
  const userId = headers["x-trwl-user-id"];
  const webhookId = headers["x-trwl-webhook-id"];

  if (typeof signature !== "string") {
    return res.status(400).send("Error: Signature is not a string");
  }

  if (typeof userId !== "string" || isNaN(parseInt(userId))) {
    return res
      .status(400)
      .send("Error: User id is not a string or not a number");
  }

  if (typeof webhookId !== "string" || isNaN(parseInt(webhookId))) {
    return res
      .status(400)
      .send("Error: Webhook id is not a string or not a number");
  }

  // receive the secret from the database
  const user = await getUserByTraewellingId(parseInt(userId));
  if (!user) {
    return res.status(400).send("Error: User not found in the database");
  }

  if (user.webhook_id !== parseInt(webhookId)) {
    return res.status(400).send("Error: Webhook id does not match");
  }

  // validate the signature
  const secret = user.webhook_secret;
  const hmac = createHmac("sha256", secret);
  hmac.update(JSON.stringify(body));
  const computedSignature = hmac.digest("hex");

  if (signature !== computedSignature) {
    return res.status(400).send("Error: Signature does not match");
  }

  return true;
}

async function handleCheckinCreate(status: TW_Status, res: Response) {
  const user = await checkTwUserInDatabase(status.user);
  if (typeof user === "boolean") {
    res.status(404).send("User not found");
    return;
  }

  // do something with the status
  console.log("New Status for user", user.display_name);
  await sendCheckInEmbeds(status);
  return;
}

async function handleNotification(
  notification: TW_Notification,
  userId: string,
  res: Response
) {
  if (!userId) {
    res.status(400).send("Error: No user id found in headers"); // 400 Bad Request
    return;
  }

  const user = await getUserByTraewellingId(parseInt(userId));
  if (!user) {
    res.status(404).send("Error: User not found in the database"); // 404 Not Found
    return;
  }

  // do something with the notification
  console.log("New Notification for user", user.display_name);

  switch (notification.type) {
    case "StatusLiked":
      const data = notification.data as TW_LikeData;
      const liker = await checkTwUserInDatabase(data.liker.id);
      const embed = new EmbedBuilder()
        .setTitle(`New Like on a status of ${user.display_name}`)
        .setColor("Yellow")
        .setAuthor({
          name: user.display_name,
          iconURL: user.avatar_url,
        })
        .setTimestamp(dayjs(notification.createdAt).toDate())
        .addFields([
          {
            name: "Trip",
            value: `${data.trip.origin.name} ➔ ${data.trip.destination.name} | ${data.trip.lineName} of <@${user.dc_id}>`,
          },
        ])
        .setFooter({
          text: `Status #${data.status.id}`,
          iconURL:
            "https://traewelling.de/images/icons/touch-icon-ipad-retina.png",
        });

      if (typeof liker === "boolean") {
        // liker is not in the database
        if (notification.lead) {
          embed.setDescription(notification.lead);
        } else {
          embed.setDescription("Someone liked your status");
        }
      } else {
        if (liker.dc_id) {
          embed.setDescription(`<@${liker.dc_id}> liked your status`);
        }
      }
      await sendTraewellingEmbed(embed, user, "");
      break;
    default:
      break;
  }
}

export async function webhookReceived(req: Request, res: Response) {
  const body = req.body;
  const headers = req.headers;
  /*
  const isValid = await validate(req, res);
  if (!isValid) {
    res.status(400).send("Error: Webhook validation failed");
  }
*/
  const event = body.event;
  switch (event) {
    case "checkin_create":
      handleCheckinCreate(body.status as TW_Status, res);
      break;
    case "notification":
      handleNotification(
        body.notification as TW_Notification,
        headers["x-trwl-user-id"] as string,
        res
      );
      break;
    default:
      console.log("Received webhook event: ", event);
      console.log("Body: ", body);
      break;
  }
  res.status(200).send("OK");
}

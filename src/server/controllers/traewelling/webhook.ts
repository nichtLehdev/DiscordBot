import { Request, Response } from "express";
import { createHmac } from "crypto";
import { sendCheckInEmbeds, sendEmbedWithReactions } from "../../../bot/bot";
import { getUserByTraewellingId } from "../../../database/user";

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
  const user = await getUserByTraewellingId(status.user);
  if (!user) {
    res.status(404).send("Error: User not found in the database"); // 404 Not Found
    return;
  }

  // do something with the status
  console.log("New Status for user", user.display_name);
  sendCheckInEmbeds(status);
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
  if (event === "checkin_create") {
    const status = body.status as TW_Status;
    handleCheckinCreate(status, res);
  }
}

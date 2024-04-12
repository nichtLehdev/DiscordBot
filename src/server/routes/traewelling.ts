import { Router } from "express";
import { oauthCallback } from "../controllers/traewelling/oauth_callback";
import { webhookReceived } from "../controllers/traewelling/webhook";

export default (app: Router) => {
  app.get("/traewelling/oauth_callback", oauthCallback);
  app.post("/traewelling/callback", webhookReceived);
};

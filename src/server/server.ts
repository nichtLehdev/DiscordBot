// src/server.ts
import express from "express";
import "../bot/bot";
import { oauthCallback } from "./routes/oauth_callback";

const app = express();
const port = 3000;

app.use(express.json());

app.get("/oauth_callback", (req, res) => {
  oauthCallback(req, res);
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

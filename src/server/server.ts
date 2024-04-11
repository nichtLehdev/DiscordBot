// src/server.ts
import express from "express";
import "../bot/bot";
import { oauthCallback } from "./routes/oauth_callback";
import "dotenv/config";

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.get("/traewelling/oauth_callback", (req, res) => {
  oauthCallback(req, res);
});
app.get("/traewelling/callback", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

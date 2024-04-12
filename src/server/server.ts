// src/server.ts
import express from "express";
import "../bot/bot";
import "dotenv/config";
import traewelling from "./routes/traewelling";

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

traewelling(app);

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

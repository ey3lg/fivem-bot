import Client from "./Client/client";
import { config } from "dotenv";
import log from "./lib/Logger";
config();
const client = new Client();
if (process.env.DISCORD_TOKEN) {
  client.login(process.env.DISCORD_TOKEN);
} else {
  log.error("DISCORD_TOKEN is undefined. Cannot log in.");
}

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection");
});
process.on("uncaughtException", (error) => {
  console.error("Unhandled Rejection");
});

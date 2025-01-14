import express from "express";
import { Client, Events, GatewayIntentBits } from "discord.js";
import "dotenv/config";
import { handleBalanceCommand } from "./commands/balance.js";
import { handlePingCommand } from "./commands/ping.js";
import { handleAddressCommand } from "./commands/address.js";
import { handleSendCommand } from "./commands/send.js";
import { registerCommands } from "./register-commands.js";
import { handleMintCommand } from "./commands/mint.js";
import { handleBurnCommand } from "./commands/burn.js";
import { handleTransactionsCommand } from "./commands/transactions.js";

// Create a new client instance
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildMessages,
  ],
});

// When the client is ready, run this code (only once)
client.once(Events.ClientReady, (readyClient) => {
  console.log(`Ready! Logged in as ${readyClient.user.tag}`);

  registerCommands();
});

// Handle slash commands
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.replied) return;

  switch (interaction.commandName) {
    case "balance":
      await handleBalanceCommand(interaction);
      break;
    case "address":
      await handleAddressCommand(interaction);
      break;
    case "transactions":
      await handleTransactionsCommand(interaction);
      break;
    case "send":
      await handleSendCommand(client, interaction);
      break;
    case "mint":
      await handleMintCommand(client, interaction);
      break;
    case "burn":
      await handleBurnCommand(client, interaction);
      break;
    case "ping":
      await handlePingCommand(interaction);
      break;
    default:
      await interaction.reply("Command not found");
      break;
  }
});

// Log in to Discord with your client's token
const token = process.env.DISCORD_TOKEN;
if (!token) throw new Error("DISCORD_TOKEN is not defined in .env file");

client.login(token);

const app = express();
const port = process.env.PORT || 3000;

app.get("/", (req, res) => {
  console.log("Citizen Wallet Discord Bot");
  res.send("Citizen Wallet Discord Bot");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

module.exports = app;

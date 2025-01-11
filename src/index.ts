import { Client, Events, GatewayIntentBits } from "discord.js";
import "dotenv/config";
import { handleBalanceCommand } from "./commands/balance.js";
import { handlePingCommand } from "./commands/ping.js";
import { handleAddressCommand } from "./commands/address.js";
import { handleSendCommand } from "./commands/send.js";

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
});

// Handle slash commands
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  console.log(interaction);

  switch (interaction.commandName) {
    case "balance":
      await handleBalanceCommand(interaction);
      break;
    case "address":
      await handleAddressCommand(interaction);
      break;
    case "send":
      await handleSendCommand(client, interaction);
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

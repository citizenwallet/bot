import { REST, Routes } from "discord.js";
import "dotenv/config";

const commands = [
  {
    name: "ping",
    description: "Replies with Pong!",
  },
  {
    name: "balance",
    description: "Replies with your balance!",
  },
  {
    name: "address",
    description: "Replies with your address!",
  },
  {
    name: "send",
    description: "Send a token to someone!",
    options: [
      {
        name: "user",
        description: "The recipient's @username",
        type: 3, // STRING type
        required: true,
      },
      {
        name: "amount",
        description: "The amount to send",
        type: 10, // NUMBER type
        required: true,
      },
    ],
  },
] as const;

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;

if (!token) throw new Error("DISCORD_TOKEN is not defined in .env file");
if (!clientId) throw new Error("CLIENT_ID is not defined in .env file");

const rest = new REST({ version: "10" }).setToken(token);

try {
  console.log("Started refreshing application (/) commands.");

  await rest.put(Routes.applicationCommands(clientId), { body: commands });

  console.log("Successfully reloaded application (/) commands.");
} catch (error) {
  console.error(error);
}

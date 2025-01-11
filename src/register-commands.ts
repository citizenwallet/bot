import { REST, Routes } from "discord.js";
import "dotenv/config";
import { getCommunityChoices } from "./cw";

const choices = getCommunityChoices();

const commands = [
  {
    name: "ping",
    description: "Replies with Pong!",
  },
  {
    name: "balance",
    description: "Replies with your balance!",
    options: [
      {
        name: "token",
        description: "The token to check",
        type: 3, // STRING type
        required: true,
        choices,
      },
    ],
  },
  {
    name: "address",
    description: "Replies with your address!",
    options: [
      {
        name: "token",
        description: "The token to check",
        type: 3, // STRING type
        required: true,
        choices,
      },
    ],
  },
  {
    name: "send",
    description: "Send a token to someone!",
    options: [
      {
        name: "token",
        description: "The token to send",
        type: 3, // STRING type
        required: true,
        choices,
      },
      {
        name: "user",
        description: "The recipient's @username or 0x address",
        type: 3, // STRING type
        required: true,
      },
      {
        name: "amount",
        description: "The amount to send",
        type: 10, // NUMBER type
        required: true,
      },
      {
        name: "message",
        description: "The message to send",
        type: 3, // STRING type
        required: true,
      },
    ],
  },
] as const;

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;

if (!token) throw new Error("DISCORD_TOKEN is not defined in .env file");
if (!clientId) throw new Error("CLIENT_ID is not defined in .env file");

export const registerCommands = async () => {
  const rest = new REST({ version: "10" }).setToken(token);

  try {
    console.log("Started refreshing application (/) commands.");

    await rest.put(Routes.applicationCommands(clientId), { body: commands });

    console.log("Successfully reloaded application (/) commands.");
  } catch (error) {
    console.error(error);
  }
};

registerCommands();

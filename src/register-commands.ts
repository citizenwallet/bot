import { REST, Routes } from "discord.js";
import "dotenv/config";
import {
  CommunityChoice,
  getCommunitiesWithMinterRole,
  getCommunityChoices,
} from "./cw";

const getCommands = (
  choices: CommunityChoice[],
  minterChoices: CommunityChoice[]
) =>
  [
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
      description: "Send a token to someone! 🚀",
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
    {
      name: "mint",
      description: "Mint a token for someone! 🔨",
      default_member_permissions: "32",
      options: [
        {
          name: "token",
          description: "The token to mint",
          type: 3, // STRING type
          required: true,
          choices: minterChoices,
        },
        {
          name: "user",
          description: "The recipient's @username or 0x address",
          type: 3, // STRING type
          required: true,
        },
        {
          name: "amount",
          description: "The amount to mint",
          type: 10, // NUMBER type
          required: true,
        },
        {
          name: "message",
          description: "The message to include",
          type: 3, // STRING type
          required: true,
        },
      ],
    },
    {
      name: "burn",
      description: "Burn a token from someone! 🔥",
      default_member_permissions: "32",
      options: [
        {
          name: "token",
          description: "The token to burn",
          type: 3, // STRING type
          required: true,
          choices: minterChoices,
        },
        {
          name: "user",
          description: "The recipient's @username or 0x address",
          type: 3, // STRING type
          required: true,
        },
        {
          name: "amount",
          description: "The amount to burn",
          type: 10, // NUMBER type
          required: true,
        },
        {
          name: "message",
          description: "The message to include",
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

    const choices = getCommunityChoices();
    const minterChoices = await getCommunitiesWithMinterRole();

    const commands = getCommands(choices, minterChoices);

    await rest.put(Routes.applicationCommands(clientId), { body: commands });

    console.log("Successfully reloaded application (/) commands.");
  } catch (error) {
    console.error(error);
  }
};

registerCommands();

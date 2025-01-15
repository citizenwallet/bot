import { REST, Routes } from "discord.js";
import "dotenv/config";

const getCommands = () =>
  [
    {
      name: "signup",
      description: "Request access for your server.",
      default_member_permissions: "32",
    },
    {
      name: "balance",
      description: "Replies with your balances!",
    },
    {
      name: "show-balance",
      description: "Shows your balance of a token to others",
      options: [
        {
          name: "token",
          description: "The token to check",
          type: 3, // STRING type
          required: true,
          autocomplete: true,
        },
      ],
    },
    {
      name: "address",
      description: "Replies with your addresses!",
    },
    {
      name: "show-address",
      description: "Shows your address to others",
      options: [
        {
          name: "token",
          description: "The token to check",
          type: 3, // STRING type
          required: true,
          autocomplete: true,
        },
      ],
    },
    {
      name: "transactions",
      description: "Replies with a link to your transactions!",
      options: [
        {
          name: "token",
          description: "The token to check",
          type: 3, // STRING type
          required: true,
          autocomplete: true,
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
          autocomplete: true,
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
          required: false,
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
          autocomplete: true,
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
          required: false,
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
          autocomplete: true,
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
          required: false,
        },
      ],
    },
    {
      name: "add-owner",
      description: "Add an owner to your Safe! 🔑",
      options: [
        {
          name: "owner",
          description:
            "The owner's 0x address (needs to be a valid ethereum address)",
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

    const commands = getCommands();

    await rest.put(Routes.applicationCommands(clientId), { body: commands });

    console.log("Successfully reloaded application (/) commands.");
  } catch (error) {
    console.error(error);
  }
};

registerCommands();

import {
  getCardAddress,
  generateReceiveLink,
  generateLegacyReceiveLink,
} from "@citizenwallet/sdk";
import { ChatInputCommandInteraction } from "discord.js";
import { keccak256, toUtf8Bytes } from "ethers";
import { getCommunity } from "../cw";
import { createDiscordMention } from "../utils/address";
import QRCode from "qrcode";
import { ShareAddressTaskArgs } from "./do/tasks";

export const handleShareAddressCommand = async (
  interaction: ChatInputCommandInteraction
) => {
  await interaction.reply({ content: "⚙️ Fetching..." });

  const alias = interaction.options.getString("token");
  if (!alias) {
    await interaction.editReply("You need to specify a token!");
    return;
  }

  await shareAddressCommand(interaction, {
    name: "showAddress",
    alias,
  });
};

export const shareAddressCommand = async (
  interaction: ChatInputCommandInteraction,
  shareAddressTaskArgs: ShareAddressTaskArgs
) => {
  const hashedUserId = keccak256(toUtf8Bytes(interaction.user.id));

  const community = getCommunity(shareAddressTaskArgs.alias);

  await interaction.editReply({
    content: `⚙️ Fetching balance for ${community.community.name}...`,
  });

  const address = await getCardAddress(community, hashedUserId);

  if (!address) {
    await interaction.editReply("Could not find an account for you!");
    return;
  }

  const baseUrl = process.env.DEEPLINK_BASE_URL;
  if (!baseUrl) {
    await interaction.editReply("Could not find a base URL!");
    return;
  }

  const receiveLink = generateLegacyReceiveLink(baseUrl, community, address);

  // Generate QR code as a data URL
  const qrCodeDataUrl = await QRCode.toDataURL(receiveLink, {
    width: 256,
    color: {
      dark: "#563087",
      light: "#ffffff",
    },
  });

  // Convert the data URL to a Buffer
  const qrCodeBuffer = Buffer.from(qrCodeDataUrl.split(",")[1], "base64");

  await interaction.editReply({
    content: `Address for ${createDiscordMention(
      interaction.user.id
    )}: **${address}** \n\n[open in Citizen Wallet 📱](<${receiveLink}>)`,
    files: [
      {
        attachment: qrCodeBuffer,
        name: "wallet-qr.png",
      },
    ],
  });
};

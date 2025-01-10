import {
  CommunityConfig,
  getCardAddress,
  getAccountBalance,
} from "@citizenwallet/sdk";
import { ChatInputCommandInteraction } from "discord.js";
import GratitudeCommunity from "../cw/gratitude.community.json" assert { type: "json" };
import { formatUnits, keccak256, toUtf8Bytes } from "ethers";

export const handleBalanceCommand = async (
  interaction: ChatInputCommandInteraction
) => {
  const community = new CommunityConfig(GratitudeCommunity);

  console.log(community.primaryRPCUrl);

  const hashedUserId = keccak256(toUtf8Bytes(interaction.user.id));

  console.log(hashedUserId);

  const address = await getCardAddress(community, hashedUserId);

  if (!address) {
    await interaction.reply("You don't have an account yet!");
    return;
  }

  const balance = (await getAccountBalance(community, address)) ?? BigInt(0);

  const token = community.primaryToken;

  const formattedBalance = formatUnits(balance, token.decimals);

  await interaction.reply(`Balance: ${formattedBalance} ${token.symbol}`);
};

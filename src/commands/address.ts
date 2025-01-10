import { CommunityConfig, getCardAddress } from "@citizenwallet/sdk";
import { ChatInputCommandInteraction } from "discord.js";
import GratitudeCommunity from "../cw/gratitude.community.json" assert { type: "json" };
import { keccak256, toUtf8Bytes } from "ethers";

export const handleAddressCommand = async (
  interaction: ChatInputCommandInteraction
) => {
  const community = new CommunityConfig(GratitudeCommunity);

  const hashedUserId = keccak256(toUtf8Bytes(interaction.user.id));

  const address = await getCardAddress(community, hashedUserId);

  if (!address) {
    await interaction.reply("You don't have an account yet!");
    return;
  }

  return interaction.reply(`Your address: ${address}`);
};

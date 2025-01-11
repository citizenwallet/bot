import { getCardAddress } from "@citizenwallet/sdk";
import { ChatInputCommandInteraction } from "discord.js";
import { keccak256, toUtf8Bytes } from "ethers";
import { getCommunity } from "../cw";

export const handleAddressCommand = async (
  interaction: ChatInputCommandInteraction
) => {
  const alias = interaction.options.getString("token");
  if (!alias) {
    await interaction.reply("You need to specify a token!");
    return;
  }

  const community = getCommunity(alias);

  const hashedUserId = keccak256(toUtf8Bytes(interaction.user.id));

  const address = await getCardAddress(community, hashedUserId);

  if (!address) {
    await interaction.reply("You don't have an account yet!");
    return;
  }

  const explorer = community.explorer;

  return interaction.reply(
    `Your address: ${address} ([View on Explorer](${explorer.url}/address/${address}))`
  );
};

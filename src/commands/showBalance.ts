import { getCardAddress, getAccountBalance } from "@citizenwallet/sdk";
import { ChatInputCommandInteraction } from "discord.js";
import { formatUnits, keccak256, toUtf8Bytes } from "ethers";
import { getCommunity } from "../cw";
import { createDiscordMention } from "../utils/address";

export const handleShowBalanceCommand = async (
  interaction: ChatInputCommandInteraction
) => {
  await interaction.reply({ content: "⚙️ Fetching..." });

  const alias = interaction.options.getString("token");
  if (!alias) {
    await interaction.editReply("You need to specify a token!");
    return;
  }

  const community = getCommunity(alias);

  const hashedUserId = keccak256(toUtf8Bytes(interaction.user.id));

  await interaction.editReply({
    content: `⚙️ Fetching balance for ${community.community.name}...`,
  });

  const address = await getCardAddress(community, hashedUserId);

  if (!address) {
    await interaction.editReply("Could not find an account for you!");
    return;
  }

  const balance = (await getAccountBalance(community, address)) ?? BigInt(0);

  const token = community.primaryToken;

  const formattedBalance = formatUnits(balance, token.decimals);

  await interaction.editReply({
    content: `Balance for ${createDiscordMention(
      interaction.user.id
    )}: **${formattedBalance} ${token.symbol}**`,
  });
};

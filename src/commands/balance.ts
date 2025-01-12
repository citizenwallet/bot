import { getCardAddress, getAccountBalance } from "@citizenwallet/sdk";
import { ChatInputCommandInteraction } from "discord.js";
import { formatUnits, keccak256, toUtf8Bytes } from "ethers";
import { getCommunity } from "../cw";

export const handleBalanceCommand = async (
  interaction: ChatInputCommandInteraction
) => {
  await interaction.reply({ content: "⚙️ Fetching...", ephemeral: true });

  const alias = interaction.options.getString("token");
  if (!alias) {
    await interaction.editReply({
      content: "You need to specify a token!",
    });
    return;
  }

  const community = getCommunity(alias);

  const hashedUserId = keccak256(toUtf8Bytes(interaction.user.id));

  const address = await getCardAddress(community, hashedUserId);

  if (!address) {
    await interaction.editReply("You don't have an account yet!");
    return;
  }

  const balance = (await getAccountBalance(community, address)) ?? BigInt(0);

  const token = community.primaryToken;

  const formattedBalance = formatUnits(balance, token.decimals);

  const explorer = community.explorer;

  await interaction.editReply({
    content: `✅ Balance: **${formattedBalance} ${token.symbol}** ([View on Explorer](${explorer.url}/token/${token.address}?a=${address}))`,
  });
};

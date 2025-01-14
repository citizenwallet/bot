import { getCardAddress, getAccountBalance } from "@citizenwallet/sdk";
import { ChatInputCommandInteraction } from "discord.js";
import { formatUnits, keccak256, toUtf8Bytes } from "ethers";
import { getCommunities } from "../cw";
import { generateSafeAccountUrl } from "../utils/safe";
import { ContentResponse, generateContent } from "../utils/content";

export const handleBalanceCommand = async (
  interaction: ChatInputCommandInteraction
) => {
  await interaction.reply({ content: "⚙️ Fetching...", ephemeral: true });

  const communities = getCommunities();

  const hashedUserId = keccak256(toUtf8Bytes(interaction.user.id));

  const content: ContentResponse = {
    header: "",
    content: [],
  };

  for (const community of communities) {
    content.header = `⚙️ Fetching balance for ${community.community.name}...`;
    await interaction.editReply({
      content: generateContent(content),
    });

    const address = await getCardAddress(community, hashedUserId);

    if (!address) {
      continue;
    }

    const balance = (await getAccountBalance(community, address)) ?? BigInt(0);

    const token = community.primaryToken;

    const formattedBalance = formatUnits(balance, token.decimals);

    content.content.push(
      `${community.community.name}: **${formattedBalance} ${
        token.symbol
      }** ([View on Safe](<${generateSafeAccountUrl(
        community,
        address,
        "/balances"
      )}>))`
    );

    await interaction.editReply({
      content: generateContent(content),
    });
  }

  content.header = "✅ Done!";
  await interaction.editReply({
    content: generateContent(content),
  });
};

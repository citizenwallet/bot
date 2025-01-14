import { getCardAddress } from "@citizenwallet/sdk";
import { ChatInputCommandInteraction } from "discord.js";
import { keccak256, toUtf8Bytes } from "ethers";
import { getCommunities } from "../cw";
import { generateSafeAccountUrl } from "../utils/safe";
import { ContentResponse, generateContent } from "../utils/content";

export const handleAddressCommand = async (
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
    content.header = `⚙️ Fetching address for ${community.community.name}...`;
    await interaction.editReply({
      content: generateContent(content),
    });

    const address = await getCardAddress(community, hashedUserId);

    if (!address) {
      continue;
    }

    content.content.push(
      `${
        community.community.name
      }: ${address} ([Inspect your Safe](<${generateSafeAccountUrl(
        community,
        address
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

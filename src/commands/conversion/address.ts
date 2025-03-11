import {
  CommunityConfig,
  getCardAddress,
  getENSAddress,
  getProfileFromAddress,
  ProfileWithTokenId,
} from "@citizenwallet/sdk";
import { ChatInputCommandInteraction } from "discord.js/typings";
import { keccak256, toUtf8Bytes } from "ethers";
import {
  cleanUserId,
  isDiscordMention,
  isDomainName,
} from "../../utils/address";
import { ContentResponse, generateContent } from "../../utils/content";

const fromDiscordMention = async (
  user: string,
  community: CommunityConfig,
  content: ContentResponse,
  interaction: ChatInputCommandInteraction
): Promise<{ address: string; userId?: string }> => {
  let address = user.replace(/<|>/g, "");

  const userId = cleanUserId(user);
  if (!userId) {
    content.content.push("Invalid user id");
    await interaction.editReply({
      content: generateContent(content),
    });
    return { address };
  }

  const hashedUserId = keccak256(toUtf8Bytes(userId));

  const cardAddress = await getCardAddress(community, hashedUserId);
  if (!cardAddress) {
    content.content.push("Could not find an account to send to!");
    await interaction.editReply({
      content: generateContent(content),
    });
    return { address };
  }

  return { address: cardAddress, userId: userId };
};

const fromDomainName = async (
  user: string,
  community: CommunityConfig,
  content: ContentResponse,
  interaction: ChatInputCommandInteraction
): Promise<{ address: string }> => {
  const domain = user;

  const mainnnetRpcUrl = process.env.MAINNET_RPC_URL;
  if (!mainnnetRpcUrl) {
    await interaction.editReply({
      content: "Mainnet RPC URL is not set",
    });
    return;
  }

  const ensAddress = await getENSAddress(mainnnetRpcUrl, domain);
  if (!ensAddress) {
    content.content.push(
      `Could not find an ENS name for the domain for ${user}`
    );
    await interaction.editReply({
      content: generateContent(content),
    });
    return;
  }

  return { address: ensAddress };
};

const fromEvmAddress = async (
  user: string,
  community: CommunityConfig,
  content: ContentResponse,
  interaction: ChatInputCommandInteraction
): Promise<{ address: string; profile: ProfileWithTokenId }> => {
  // Check if receiverAddress is a valid Ethereum address
  if (!/^0x[a-fA-F0-9]{40}$/.test(user)) {
    content.content.push(
      `Invalid format: ${user} either a discord mention or an Ethereum address`
    );
    await interaction.editReply({
      content: generateContent(content),
    });
    return;
  }

  const ipfsDomain = process.env.IPFS_DOMAIN;
  if (!ipfsDomain) {
    await interaction.editReply("Could not find an IPFS domain!");
    return;
  }

  const profile = await getProfileFromAddress(ipfsDomain, community, user);
  return { address: user, profile };
};

export const getAddressFromUserInputWithReplies = async (
  user: string,
  community: CommunityConfig,
  content: ContentResponse,
  interaction: ChatInputCommandInteraction
): Promise<{
  address: string;
  userId?: string;
  profile?: ProfileWithTokenId;
}> => {
  if (isDiscordMention(user)) {
    return fromDiscordMention(user, community, content, interaction);
  } else if (isDomainName(user)) {
    return fromDomainName(user, community, content, interaction);
  } else {
    return fromEvmAddress(user, community, content, interaction);
  }
};

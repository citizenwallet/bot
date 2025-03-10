import {
  CommunityConfig,
  getCardAddress,
  getENSAddress,
  getProfileFromAddress,
  Profile,
  ProfileWithTokenId,
} from "@citizenwallet/sdk/dist/src";
import { keccak256, toUtf8Bytes } from "ethers/lib.commonjs";
import {
  cleanUserId,
  isDiscordMention,
  isDomainName,
} from "../../utils/address";
import { ContentResponse, generateContent } from "../../utils/content";
import { ChatInputCommandInteraction } from "discord.js/typings";

const getReceiverFromDiscordMention = async (
  user: string,
  community: CommunityConfig,
  content: ContentResponse,
  interaction: ChatInputCommandInteraction
): Promise<{ receiverAddress: string; receiverUserId?: string }> => {
  let receiverAddress = user.replace(/<|>/g, "");

  const userId = cleanUserId(user);
  if (!userId) {
    content.content.push("Invalid user id");
    await interaction.editReply({
      content: generateContent(content),
    });
    return { receiverAddress };
  }

  const receiverHashedUserId = keccak256(toUtf8Bytes(userId));

  const receiverCardAddress = await getCardAddress(
    community,
    receiverHashedUserId
  );
  if (!receiverCardAddress) {
    content.content.push("Could not find an account to send to!");
    await interaction.editReply({
      content: generateContent(content),
    });
    return { receiverAddress };
  }

  return { receiverAddress: receiverCardAddress, receiverUserId: userId };
};

const getReceiverFromDomainName = async (
  user: string,
  community: CommunityConfig,
  content: ContentResponse,
  interaction: ChatInputCommandInteraction
): Promise<{ receiverAddress: string }> => {
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

  return { receiverAddress: ensAddress };
};

const getReceiverFromAddress = async (
  user: string,
  community: CommunityConfig,
  content: ContentResponse,
  interaction: ChatInputCommandInteraction
): Promise<{ receiverAddress: string; profile: ProfileWithTokenId }> => {
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
  return { receiverAddress: user, profile };
};

export const getReceiverFromUserInputWithReplies = async (
  user: string,
  community: CommunityConfig,
  content: ContentResponse,
  interaction: ChatInputCommandInteraction
): Promise<{
  receiverAddress: string;
  receiverUserId?: string;
  profile?: ProfileWithTokenId;
}> => {
  if (isDiscordMention(user)) {
    return getReceiverFromDiscordMention(user, community, content, interaction);
  } else if (isDomainName(user)) {
    return getReceiverFromDomainName(user, community, content, interaction);
  } else {
    return getReceiverFromAddress(user, community, content, interaction);
  }
};

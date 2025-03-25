import {
  CommunityConfig,
  getProfileFromAddress,
  ProfileWithTokenId,
  tokenTransferEventTopic,
  tokenTransferSingleEventTopic,
} from "@citizenwallet/sdk";
import { getLiveUpdateCommunities } from "../cw";
import { Client } from "discord.js";
import { WebSocketEventData, WebSocketListener } from "../cw/ws";
import { formatUnits, ZeroAddress } from "ethers";
import { shortenAddress } from "../utils/address";

export const startLiveUpdates = async (
  client: Client
): Promise<{ [key: string]: WebSocketListener }> => {
  const communities = getLiveUpdateCommunities();

  const listeners: { [key: string]: WebSocketListener } = {};

  console.log(communities);

  for (const community of Object.values(communities)) {
    const token = community.community.primaryToken;
    const topic =
      community.community.primaryToken.standard === "erc20"
        ? tokenTransferEventTopic
        : tokenTransferSingleEventTopic;

    const nodeUrl = community.community.primaryNetwork.node.ws_url;

    const eventUrl = `${nodeUrl}/v1/events/${token.address}/${topic}`;

    console.log(eventUrl);

    listeners[community.community.community.alias] = new WebSocketListener(
      eventUrl,
      createEventDataHandler(
        client,
        community.community,
        Object.values(community.serverChannelIds)
      )
    );
  }

  return listeners;
};

const createEventDataHandler = (
  client: Client,
  community: CommunityConfig,
  channelIds: string[]
) => {
  return async (data: WebSocketEventData) => {
    const token = community.primaryToken;
    const explorer = community.explorer;

    const {
      data: {
        tx_hash: hash,
        data: { from, to, value },
        extra_data: extraData,
      },
    } = data;

    const txType =
      from === ZeroAddress ? "mint" : to === ZeroAddress ? "burn" : "transfer";

    let fromProfile: ProfileWithTokenId | undefined;
    let toProfile: ProfileWithTokenId | undefined;

    const ipfsDomain = process.env.IPFS_DOMAIN;
    if (ipfsDomain) {
      fromProfile = await getProfileFromAddress(ipfsDomain, community, from);
      toProfile = await getProfileFromAddress(ipfsDomain, community, to);
    }

    const formattedAmount = formatUnits(value, token.decimals);

    let content = "";
    if (txType === "mint") {
      content = `
      🔨 **${formattedAmount} ${token.symbol}** minted to ${
        toProfile?.name ?? shortenAddress(to)
      } (@${toProfile?.username ?? "anonymous"}) ([View Transaction](${
        explorer.url
      }/tx/${hash}))`;
    } else if (txType === "burn") {
      content = `
      🔥 **${formattedAmount} ${token.symbol}** burned by ${
        fromProfile?.name ?? shortenAddress(from)
      } (@${fromProfile?.username ?? "anonymous"}) ([View Transaction](${
        explorer.url
      }/tx/${hash}))`;
    } else {
      content = `
      🪙 **${formattedAmount} ${token.symbol}** sent from ${
        fromProfile?.name ?? shortenAddress(from)
      } (@${fromProfile?.username ?? "anonymous"}) to ${
        toProfile?.name ?? shortenAddress(to)
      } (@${toProfile?.username ?? "anonymous"}) ([View Transaction](${
        explorer.url
      }/tx/${hash}))`;
    }

    if (extraData && extraData.description) {
      content += `\n*${extraData.description}*`;
    }

    for (const channelId of channelIds) {
      const channel = await client.channels.fetch(channelId);
      if (!channel) {
        console.log(`Channel ${channelId} not found`);
        continue;
      }

      if (!channel.isSendable()) {
        console.log(`Channel ${channelId} is not sendable`);
        continue;
      }

      const message = await channel.send(content);
      console.log(message);
    }
  };
};

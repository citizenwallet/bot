import {
  CommunityConfig,
  getProfileFromAddress,
  ProfileWithTokenId,
  tokenTransferEventTopic,
  tokenTransferSingleEventTopic,
} from "@citizenwallet/sdk";
import { getLiveUpdateCommunities, LiveUpdateChannel } from "../cw";
import { Client } from "discord.js";
import { WebSocketEventData, WebSocketListener } from "../cw/ws";
import { formatUnits, ZeroAddress } from "ethers";
import { shortenAddress } from "../utils/address";
import { getExplorerBaseUrl } from "../utils/explorer";

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
  liveUpdateChannels: LiveUpdateChannel[]
) => {
  return async (data: WebSocketEventData) => {
    const token = community.primaryToken;
    const explorerBaseUrl = getExplorerBaseUrl(token.chain_id);

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
      } (@${
        toProfile?.username ?? "anonymous"
      }) ([View Transaction](${explorerBaseUrl}/tx/${hash}))`;
    } else if (txType === "burn") {
      content = `
      🔥 **${formattedAmount} ${token.symbol}** burned by ${
        fromProfile?.name ?? shortenAddress(from)
      } (@${
        fromProfile?.username ?? "anonymous"
      }) ([View Transaction](${explorerBaseUrl}/tx/${hash}))`;
    } else {
      content = `
      🪙 **${formattedAmount} ${token.symbol}** sent from ${
        fromProfile?.name ?? shortenAddress(from)
      } (@${fromProfile?.username ?? "anonymous"}) to ${
        toProfile?.name ?? shortenAddress(to)
      } (@${
        toProfile?.username ?? "anonymous"
      }) ([View Transaction](${explorerBaseUrl}/tx/${hash}))`;
    }

    for (const liveUpdateChannel of liveUpdateChannels) {
      let contentWithDescription = `${content}`;
      if (extraData && extraData.description) {
        contentWithDescription += !!liveUpdateChannel.privateDescriptions
          ? "\n---"
          : `\n*${extraData.description}*`;
      }

      const channel = await client.channels.fetch(liveUpdateChannel.channelId);
      if (!channel) {
        console.log(`Channel ${liveUpdateChannel.channelId} not found`);
        continue;
      }

      if (!channel.isSendable()) {
        console.log(`Channel ${liveUpdateChannel.channelId} is not sendable`);
        continue;
      }

      const message = await channel.send(contentWithDescription);
      console.log(message);
    }
  };
};

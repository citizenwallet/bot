import {
  CommunityConfig,
  getAccountAddress,
  hasRole,
  MINTER_ROLE,
  type Config,
} from "@citizenwallet/sdk";
import communities from "./communities.json";
import serverCommunityFilter from "./serverCommunityFilter.json";
import { JsonRpcProvider, Wallet } from "ethers";

export interface CommunityChoice {
  name: string;
  value: string;
}

export const getCommunity = (alias: string): CommunityConfig => {
  const community = communities.find(
    (c: Config) => c.community.alias === alias
  );

  if (!community) throw new Error(`Community ${alias} not found`);

  return new CommunityConfig(community);
};

export const getCommunities = (serverId?: string): CommunityConfig[] => {
  let server = serverCommunityFilter.find((s) => s.serverId === serverId);
  if (!server) {
    server = serverCommunityFilter.find((s) => s.serverId === "global");
  }

  return communities
    .filter(
      (c: Config) =>
        !serverId ||
        server.communityChoices.length === 0 ||
        server.communityChoices.includes(c.community.alias)
    )
    .map((c: Config) => new CommunityConfig(c));
};

export const getCommunityChoices = (serverId?: string): CommunityChoice[] => {
  let server = serverCommunityFilter.find((s) => s.serverId === serverId);
  if (!server) {
    server = serverCommunityFilter.find((s) => s.serverId === "global");
  }

  return communities
    .filter(
      (c: Config) =>
        !serverId ||
        server.communityChoices.length === 0 ||
        server.communityChoices.includes(c.community.alias)
    )
    .map((c: Config) => {
      const token = new CommunityConfig(c).primaryToken;
      return {
        name: `${c.community.name} (${token.symbol})`,
        value: c.community.alias,
      };
    });
};

export const getCommunitiesWithMinterRole = async (
  serverId?: string
): Promise<CommunityChoice[]> => {
  let server = serverCommunityFilter.find((s) => s.serverId === serverId);
  if (!server) {
    server = serverCommunityFilter.find((s) => s.serverId === "global");
  }

  const choices: CommunityChoice[] = [];

  if (server.mintingChoices && server.mintingChoices.length > 0) {
    for (const community of getCommunities()) {
      const shouldInclude =
        !serverId ||
        server.communityChoices.length === 0 ||
        server.communityChoices.includes(community.community.alias) ||
        server.mintingChoices.includes(community.community.alias);

      if (!shouldInclude) continue;

      choices.push({
        name: `${community.community.name} (${community.primaryToken.symbol})`,
        value: community.community.alias,
      });
    }

    return choices;
  }

  for (const community of getCommunities()) {
    const shouldInclude =
      !serverId ||
      server.communityChoices.length === 0 ||
      server.communityChoices.includes(community.community.alias);

    if (!shouldInclude) continue;

    const privateKey = process.env.BOT_PRIVATE_KEY;
    if (!privateKey) {
      continue;
    }

    const signer = new Wallet(privateKey);

    const signerAccountAddress = await getAccountAddress(
      community,
      signer.address
    );
    if (!signerAccountAddress) {
      continue;
    }

    const provider = new JsonRpcProvider(community.primaryRPCUrl);

    let minterRole = false;
    try {
      minterRole = await hasRole(
        community.primaryToken.address,
        MINTER_ROLE,
        signerAccountAddress,
        provider
      );
    } catch (_) {}

    if (minterRole) {
      const token = community.primaryToken;
      choices.push({
        name: `${community.community.name} (${token.symbol})`,
        value: community.community.alias,
      });
    }
  }

  return choices;
};

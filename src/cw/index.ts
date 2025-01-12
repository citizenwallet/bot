import { CommunityConfig, type Config } from "@citizenwallet/sdk";
import communities from "./communities.json";

export const getCommunity = (alias: string): CommunityConfig => {
  const community = communities.find(
    (c: Config) => c.community.alias === alias
  );

  if (!community) throw new Error(`Community ${alias} not found`);

  return new CommunityConfig(community);
};

export const getCommunities = (): CommunityConfig[] => {
  return communities.map((c: Config) => new CommunityConfig(c));
};

export const getCommunityChoices = (): { name: string; value: string }[] => {
  return communities.map((c: Config) => ({
    name: c.community.name,
    value: c.community.alias,
  }));
};

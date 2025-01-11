import { CommunityConfig, type Config } from "@citizenwallet/sdk";
import { readFileSync } from "fs";

export const getCommunity = (alias: string): CommunityConfig => {
  const data = readFileSync("./communities.json", "utf8");

  const parsed: Config[] = JSON.parse(data);

  const community = parsed.find((c) => c.community.alias === alias);

  if (!community) throw new Error(`Community ${alias} not found`);

  return new CommunityConfig(community);
};

export const getCommunityChoices = (): { name: string; value: string }[] => {
  const data = readFileSync("./communities.json", "utf8");
  const parsed: Config[] = JSON.parse(data);
  return parsed.map((c) => ({
    name: c.community.name,
    value: c.community.alias,
  }));
};

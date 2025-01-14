import { CommunityConfig } from "@citizenwallet/sdk";
import { ChainToEip155ChainPrefix } from "./address";

export const addressWithPrefix = (chainId: string, address: string) => {
  return `${ChainToEip155ChainPrefix[chainId.toString()]}:${address}`;
};

export const generateSafeAccountUrl = (
  community: CommunityConfig,
  address: string,
  path = "/home"
) => {
  const accountConfig = community.primaryAccountConfig;

  const prefix = ChainToEip155ChainPrefix[accountConfig.chain_id.toString()];
  return `https://app.safe.global${path}?safe=${prefix}:${address}`;
};

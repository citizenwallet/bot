import { CommunityConfig } from "@citizenwallet/sdk";
import { toUtf8Bytes, Wallet, keccak256 } from "ethers";
import { getCommunities } from "./cw";
import { getAccountAddress } from "@citizenwallet/sdk";
interface CommunityWithContracts {
  community: CommunityConfig;
  contracts: string[];
}

const main = async () => {
  const communities = getCommunities();

  const privateKey = process.env.BOT_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("Private key is not set");
  }

  console.log("parsing", communities.length, "communities");

  const signer = new Wallet(privateKey);

  const cardManagerMap: Record<string, CommunityWithContracts> = {};
  for (const community of communities) {
    const signerAccountAddress = await getAccountAddress(
      community,
      signer.address
    );

    const cardConfig = community.primarySafeCardConfig;

    const instanceId = keccak256(toUtf8Bytes(cardConfig.instance_id));

    console.log("instanceId", instanceId);

    console.log("community", community.community.name);
    console.log("account address:", signerAccountAddress);
  }
};

main();

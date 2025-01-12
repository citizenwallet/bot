import { CommunityConfig } from "@citizenwallet/sdk";
import { Wallet } from "ethers";
import { getCommunities } from "./cw";
import {
  BundlerService,
  createInstanceCallData,
  getAccountAddress,
} from "@citizenwallet/sdk";

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

  const cardManagerMap: Record<string, CommunityWithContracts> = {};
  for (const community of communities) {
    const cardConfig = community.primarySafeCardConfig;
    if (!cardConfig) continue;

    const instance = `${cardConfig.chain_id}:${cardConfig.address}:${cardConfig.instance_id}`;

    if (!cardManagerMap[instance]) {
      const contracts: string[] = [];

      contracts.push(community.primaryToken.address);
      contracts.push(community.community.profile.address);

      cardManagerMap[instance] = {
        community,
        contracts,
      };
      continue;
    }

    cardManagerMap[instance].contracts.push(community.primaryToken.address);
    cardManagerMap[instance].contracts.push(
      community.community.profile.address
    );
  }

  const signer = new Wallet(privateKey);
  console.log("creating,", Object.values(cardManagerMap).length, "instances");
  for (const communityMap of Object.values(cardManagerMap)) {
    const signerAccountAddress = await getAccountAddress(
      communityMap.community,
      signer.address
    );
    if (!signerAccountAddress) {
      throw new Error("Could not find an account for you!");
    }

    const calldata = createInstanceCallData(
      communityMap.community,
      communityMap.contracts
    );

    const bundler = new BundlerService(communityMap.community);

    const cardConfig = communityMap.community.primarySafeCardConfig;

    const hash = await bundler.call(
      signer,
      cardConfig.address,
      signerAccountAddress,
      calldata
    );

    console.log("submitted:", hash);

    await bundler.awaitSuccess(hash);

    console.log("Instance created");
  }
};

main();

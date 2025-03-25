import {
  CommunityConfig,
  updateInstanceContractsCallData,
  createInstanceCallData,
} from "@citizenwallet/sdk";
import { Wallet, ZeroAddress } from "ethers";
import { getCommunities } from "./cw";
import {
  BundlerService,
  getAccountAddress,
  instanceOwner,
} from "@citizenwallet/sdk";

interface CommunityWithContracts {
  community: CommunityConfig;
  contracts: string[];
}

const main = async () => {
  const chainId = parseInt(process.argv[2] || "0");

  const communities = chainId
    ? getCommunities().filter(
        (c) => c.primarySafeCardConfig?.chain_id === chainId
      )
    : getCommunities();

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

      cardManagerMap[instance] = {
        community,
        contracts,
      };
    }

    cardManagerMap[instance].contracts.push(community.primaryToken.address);
    cardManagerMap[instance].contracts.push(
      community.community.profile.address
    );
  }

  console.log(cardManagerMap);

  const signer = new Wallet(privateKey);
  console.log("updating,", Object.values(cardManagerMap).length, "instances");
  for (const communityMap of Object.values(cardManagerMap)) {
    const signerAccountAddress = await getAccountAddress(
      communityMap.community,
      signer.address
    );
    if (!signerAccountAddress) {
      throw new Error("Could not find an account for you!");
    }

    const bundler = new BundlerService(communityMap.community);
    const cardConfig = communityMap.community.primarySafeCardConfig;

    console.log("contracts", communityMap.contracts);

    const owner = await instanceOwner(communityMap.community);
    if (owner === ZeroAddress) {
      const ccalldata = createInstanceCallData(
        communityMap.community,
        communityMap.contracts
      );

      const hash = await bundler.call(
        signer,
        cardConfig.address,
        signerAccountAddress,
        ccalldata
      );

      console.log("submitted:", hash);

      await bundler.awaitSuccess(hash);

      console.log("Instance created");

      continue;
    }

    const calldata = updateInstanceContractsCallData(
      communityMap.community,
      communityMap.contracts
    );

    const hash = await bundler.call(
      signer,
      cardConfig.address,
      signerAccountAddress,
      calldata
    );

    console.log("submitted:", hash);

    await bundler.awaitSuccess(hash);

    console.log("Instance updated");
  }
};

main();

import { Wallet } from "ethers";
import { getCommunity } from "./cw";
import {
  BundlerService,
  createInstanceCallData,
  getAccountAddress,
} from "@citizenwallet/sdk";

const main = async () => {
  const alias = process.argv[2];
  if (!alias) {
    throw new Error("You need to specify a community! e.g. gratitude");
  }

  const community = getCommunity(alias);

  const privateKey = process.env.BOT_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("Private key is not set");
  }

  const signer = new Wallet(privateKey);

  const signerAccountAddress = await getAccountAddress(
    community,
    signer.address
  );

  console.log("Signer account address", signerAccountAddress);

  const contracts: string[] = [];
  contracts.push(community.primaryToken.address);
  contracts.push(community.community.profile.address);

  const calldata = createInstanceCallData(community, contracts);

  const cardConfig = community.primarySafeCardConfig;

  const bundler = new BundlerService(community);

  const hash = await bundler.call(
    signer,
    cardConfig.address,
    signerAccountAddress,
    calldata
  );

  console.log("Hash", hash);
  await bundler.awaitSuccess(hash);

  console.log("Instance created");
};

main();

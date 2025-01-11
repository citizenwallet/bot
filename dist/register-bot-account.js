"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ethers_1 = require("ethers");
const cw_1 = require("./cw");
const sdk_1 = require("@citizenwallet/sdk");
const main = async () => {
    const alias = process.argv[2];
    if (!alias) {
        throw new Error("You need to specify a community! e.g. gratitude");
    }
    const community = (0, cw_1.getCommunity)(alias);
    const privateKey = process.env.BOT_PRIVATE_KEY;
    if (!privateKey) {
        throw new Error("Private key is not set");
    }
    const signer = new ethers_1.Wallet(privateKey);
    const signerAccountAddress = await (0, sdk_1.getAccountAddress)(community, signer.address);
    if (!signerAccountAddress) {
        throw new Error("Could not find an account for you!");
    }
    console.log("Signer account address", signerAccountAddress);
    const contracts = [];
    contracts.push(community.primaryToken.address);
    contracts.push(community.community.profile.address);
    const calldata = (0, sdk_1.createInstanceCallData)(community, contracts);
    const cardConfig = community.primarySafeCardConfig;
    const bundler = new sdk_1.BundlerService(community);
    const hash = await bundler.call(signer, cardConfig.address, signerAccountAddress, calldata);
    console.log("Hash", hash);
    await bundler.awaitSuccess(hash);
    console.log("Instance created");
};
main();
//# sourceMappingURL=register-bot-account.js.map
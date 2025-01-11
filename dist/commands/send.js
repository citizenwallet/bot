"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleSendCommand = void 0;
const sdk_1 = require("@citizenwallet/sdk");
const ethers_1 = require("ethers");
const address_1 = require("../utils/address");
const ethers_2 = require("ethers");
const cw_1 = require("../cw");
const handleSendCommand = async (client, interaction) => {
    console.log(interaction);
    const alias = interaction.options.getString("token");
    if (!alias) {
        await interaction.reply("You need to specify a token!");
        return;
    }
    const user = interaction.options.getString("user");
    if (!user) {
        await interaction.reply("You need to specify a user!");
        return;
    }
    const amount = interaction.options.getNumber("amount");
    if (!amount) {
        await interaction.reply("You need to specify an amount!");
        return;
    }
    const message = interaction.options.getString("message");
    const community = (0, cw_1.getCommunity)(alias);
    const token = community.primaryToken;
    const formattedAmount = (0, ethers_1.parseUnits)(amount.toFixed(2), token.decimals);
    const senderHashedUserId = (0, ethers_1.keccak256)((0, ethers_1.toUtf8Bytes)(interaction.user.id));
    const senderAddress = await (0, sdk_1.getCardAddress)(community, senderHashedUserId);
    if (!senderAddress) {
        await interaction.reply("Could not find an account for you!");
        return;
    }
    const balance = (await (0, sdk_1.getAccountBalance)(community, senderAddress)) ?? BigInt(0);
    if (!balance || balance === BigInt(0) || balance < formattedAmount) {
        await interaction.reply(`Insufficient balance: ${balance}`);
        return;
    }
    let receiverAddress = user;
    let profile = null;
    let receiverUserId = null;
    if ((0, address_1.isDiscordMention)(user)) {
        receiverAddress = user.replace(/<|>/g, "");
        const userId = (0, address_1.cleanUserId)(user);
        if (!userId) {
            await interaction.reply("Invalid user id");
            return;
        }
        const receiverHashedUserId = (0, ethers_1.keccak256)((0, ethers_1.toUtf8Bytes)(userId));
        const receiverCardAddress = await (0, sdk_1.getCardAddress)(community, receiverHashedUserId);
        if (!receiverCardAddress) {
            await interaction.reply("Could not find an account to send to!");
            return;
        }
        receiverAddress = receiverCardAddress;
        receiverUserId = userId;
    }
    else {
        // Check if receiverAddress is a valid Ethereum address
        if (!/^0x[a-fA-F0-9]{40}$/.test(receiverAddress)) {
            await interaction.reply("Invalid format: it's either a discord mention or an Ethereum address");
            return;
        }
        profile = await (0, sdk_1.getProfileFromAddress)(community, receiverAddress);
    }
    const privateKey = process.env.BOT_PRIVATE_KEY;
    if (!privateKey) {
        await interaction.reply("Private key is not set");
        return;
    }
    const signer = new ethers_2.Wallet(privateKey);
    const signerAccountAddress = await (0, sdk_1.getAccountAddress)(community, signer.address);
    if (!signerAccountAddress) {
        await interaction.reply("Could not find an account for you!");
        return;
    }
    const bundler = new sdk_1.BundlerService(community);
    const transferCalldata = (0, sdk_1.tokenTransferCallData)(receiverAddress, formattedAmount);
    const calldata = (0, sdk_1.callOnCardCallData)(community, senderHashedUserId, token.address, BigInt(0), transferCalldata);
    const cardConfig = community.primarySafeCardConfig;
    const userOpData = {
        topic: sdk_1.tokenTransferEventTopic,
        from: senderAddress,
        to: receiverAddress,
        value: formattedAmount.toString(),
    };
    let extraData;
    if (message) {
        extraData = {
            description: message,
        };
    }
    const hash = await bundler.call(signer, cardConfig.address, signerAccountAddress, calldata, userOpData, extraData);
    const explorer = community.explorer;
    if (receiverUserId) {
        try {
            const receiver = await client.users.fetch(receiverUserId);
            const dmChannel = await receiver.createDM();
            await dmChannel.send(`**${amount} ${token.symbol}** received from ${(0, address_1.createDiscordMention)(interaction.user.id)} ([View Transaction](${explorer.url}/tx/${hash}))`);
            if (message) {
                await dmChannel.send(`*${message}*`);
            }
        }
        catch (error) {
            console.error("Failed to send message to receiver", error);
        }
    }
    return interaction.reply(`Sent **${amount} ${token.symbol}** to ${profile?.name ?? profile?.username ?? user} 🚀 ([View Transaction](${explorer.url}/tx/${hash}))`);
};
exports.handleSendCommand = handleSendCommand;
//# sourceMappingURL=send.js.map
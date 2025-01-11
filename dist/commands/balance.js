"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleBalanceCommand = void 0;
const sdk_1 = require("@citizenwallet/sdk");
const ethers_1 = require("ethers");
const cw_1 = require("../cw");
const handleBalanceCommand = async (interaction) => {
    const alias = interaction.options.getString("token");
    if (!alias) {
        await interaction.reply("You need to specify a token!");
        return;
    }
    const community = (0, cw_1.getCommunity)(alias);
    console.log(community.primaryRPCUrl);
    const hashedUserId = (0, ethers_1.keccak256)((0, ethers_1.toUtf8Bytes)(interaction.user.id));
    console.log(hashedUserId);
    const address = await (0, sdk_1.getCardAddress)(community, hashedUserId);
    if (!address) {
        await interaction.reply("You don't have an account yet!");
        return;
    }
    const balance = (await (0, sdk_1.getAccountBalance)(community, address)) ?? BigInt(0);
    const token = community.primaryToken;
    const formattedBalance = (0, ethers_1.formatUnits)(balance, token.decimals);
    const explorer = community.explorer;
    await interaction.reply(`Balance: **${formattedBalance} ${token.symbol}** ([View on Explorer](${explorer.url}/token/${token.address}?a=${address}))`);
};
exports.handleBalanceCommand = handleBalanceCommand;
//# sourceMappingURL=balance.js.map
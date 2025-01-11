"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleAddressCommand = void 0;
const sdk_1 = require("@citizenwallet/sdk");
const ethers_1 = require("ethers");
const cw_1 = require("../cw");
const handleAddressCommand = async (interaction) => {
    const alias = interaction.options.getString("token");
    if (!alias) {
        await interaction.reply("You need to specify a token!");
        return;
    }
    const community = (0, cw_1.getCommunity)(alias);
    const hashedUserId = (0, ethers_1.keccak256)((0, ethers_1.toUtf8Bytes)(interaction.user.id));
    const address = await (0, sdk_1.getCardAddress)(community, hashedUserId);
    if (!address) {
        await interaction.reply("You don't have an account yet!");
        return;
    }
    const explorer = community.explorer;
    return interaction.reply(`Your address: ${address} ([View on Explorer](${explorer.url}/address/${address}))`);
};
exports.handleAddressCommand = handleAddressCommand;
//# sourceMappingURL=address.js.map
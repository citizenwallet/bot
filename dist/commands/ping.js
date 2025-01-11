"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handlePingCommand = void 0;
const handlePingCommand = async (interaction) => {
    console.log(interaction);
    await interaction.reply("Pong!");
};
exports.handlePingCommand = handlePingCommand;
//# sourceMappingURL=ping.js.map
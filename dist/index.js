"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const discord_js_1 = require("discord.js");
require("dotenv/config");
const balance_js_1 = require("./commands/balance.js");
const ping_js_1 = require("./commands/ping.js");
const address_js_1 = require("./commands/address.js");
const send_js_1 = require("./commands/send.js");
const register_commands_js_1 = require("./register-commands.js");
// Create a new client instance
const client = new discord_js_1.Client({
    intents: [
        discord_js_1.GatewayIntentBits.Guilds,
        discord_js_1.GatewayIntentBits.GuildMessages,
        discord_js_1.GatewayIntentBits.DirectMessages,
        discord_js_1.GatewayIntentBits.GuildMessages,
    ],
});
// When the client is ready, run this code (only once)
client.once(discord_js_1.Events.ClientReady, (readyClient) => {
    console.log(`Ready! Logged in as ${readyClient.user.tag}`);
    (0, register_commands_js_1.registerCommands)();
});
// Handle slash commands
client.on(discord_js_1.Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand())
        return;
    console.log(interaction);
    switch (interaction.commandName) {
        case "balance":
            await (0, balance_js_1.handleBalanceCommand)(interaction);
            break;
        case "address":
            await (0, address_js_1.handleAddressCommand)(interaction);
            break;
        case "send":
            await (0, send_js_1.handleSendCommand)(client, interaction);
            break;
        case "ping":
            await (0, ping_js_1.handlePingCommand)(interaction);
            break;
        default:
            await interaction.reply("Command not found");
            break;
    }
});
// Log in to Discord with your client's token
const token = process.env.DISCORD_TOKEN;
if (!token)
    throw new Error("DISCORD_TOKEN is not defined in .env file");
client.login(token);
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
app.get("/", (req, res) => {
    res.send("Citizen Wallet Discord Bot");
});
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
//# sourceMappingURL=index.js.map
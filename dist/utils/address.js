"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDiscordMention = exports.isDiscordMention = exports.cleanUserId = void 0;
const cleanUserId = (userId) => {
    return userId.replace(/[^0-9]/g, "");
};
exports.cleanUserId = cleanUserId;
const isDiscordMention = (userId) => {
    return /^<@\d+>$/.test(userId);
};
exports.isDiscordMention = isDiscordMention;
const createDiscordMention = (userId) => {
    return `<@${userId}>`;
};
exports.createDiscordMention = createDiscordMention;
//# sourceMappingURL=address.js.map
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCommunityChoices = exports.getCommunity = void 0;
const sdk_1 = require("@citizenwallet/sdk");
const communities_json_1 = __importDefault(require("./communities.json"));
const getCommunity = (alias) => {
    const community = communities_json_1.default.find((c) => c.community.alias === alias);
    if (!community)
        throw new Error(`Community ${alias} not found`);
    return new sdk_1.CommunityConfig(community);
};
exports.getCommunity = getCommunity;
const getCommunityChoices = () => {
    return communities_json_1.default.map((c) => ({
        name: c.community.name,
        value: c.community.alias,
    }));
};
exports.getCommunityChoices = getCommunityChoices;
//# sourceMappingURL=index.js.map
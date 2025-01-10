import {
  callOnCard,
  CommunityConfig,
  getAccountBalance,
  getCardAddress,
  getProfileFromAddress,
  getProfileFromUsername,
  tokenTransferCallData,
  type ProfileWithTokenId,
} from "@citizenwallet/sdk";
import { ChatInputCommandInteraction } from "discord.js";
import GratitudeCommunity from "../cw/gratitude.community.json" assert { type: "json" };
import { JsonRpcProvider, keccak256, parseUnits, toUtf8Bytes } from "ethers";
import { cleanUserId, isDiscordMention } from "../utils/address";
import { Wallet } from "ethers";

export const handleSendCommand = async (
  interaction: ChatInputCommandInteraction
) => {
  console.log(interaction);
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

  const community = new CommunityConfig(GratitudeCommunity);

  const senderHashedUserId = keccak256(toUtf8Bytes(interaction.user.id));

  const senderAddress = await getCardAddress(community, senderHashedUserId);
  if (!senderAddress) {
    await interaction.reply("Could not find an account for you!");
    return;
  }

  const balance =
    (await getAccountBalance(community, senderAddress)) ?? BigInt(0);
  if (!balance || balance === BigInt(0)) {
    await interaction.reply(`Insufficient balance: ${balance}`);
    return;
  }

  let receiverAddress: string = user;
  let profile: ProfileWithTokenId | null = null;
  if (isDiscordMention(user)) {
    receiverAddress = user.replace(/<|>/g, "");

    const userId = cleanUserId(user);
    if (!userId) {
      await interaction.reply("Invalid user id");
      return;
    }

    const receiverHashedUserId = keccak256(toUtf8Bytes(userId));

    const receiverCardAddress = await getCardAddress(
      community,
      receiverHashedUserId
    );
    if (!receiverCardAddress) {
      await interaction.reply("Could not find an account to send to!");
      return;
    }

    receiverAddress = receiverCardAddress;
  } else {
    // Check if receiverAddress is a valid Ethereum address
    if (!/^0x[a-fA-F0-9]{40}$/.test(receiverAddress)) {
      await interaction.reply(
        "Invalid format: it's either a discord mention or an Ethereum address"
      );
      return;
    }

    profile = await getProfileFromAddress(community, receiverAddress);
  }

  const token = community.primaryToken;

  const privateKey = process.env.BOT_PRIVATE_KEY;
  if (!privateKey) {
    await interaction.reply("Private key is not set");
    return;
  }

  const signer = new Wallet(privateKey);

  const provider = new JsonRpcProvider(process.env.RPC_URL);

  const formattedAmount = parseUnits(amount.toFixed(2), token.decimals);

  const calldata = tokenTransferCallData(receiverAddress, formattedAmount);

  const tx = await callOnCard(
    signer,
    community,
    senderHashedUserId,
    token.address,
    BigInt(0),
    calldata,
    provider
  );
  if (!tx) {
    await interaction.reply("Transaction failed");
    return;
  }

  console.log(tx);

  return interaction.reply(
    `Sent ${amount} ${token.symbol} to ${
      profile?.name ?? profile?.username ?? user
    } 🚀`
  );
};

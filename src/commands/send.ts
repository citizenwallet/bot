import {
  BundlerService,
  callOnCardCallData,
  getAccountAddress,
  getAccountBalance,
  getCardAddress,
  getProfileFromAddress,
  tokenTransferCallData,
  tokenTransferEventTopic,
  type ProfileWithTokenId,
  type UserOpData,
  type UserOpExtraData,
} from "@citizenwallet/sdk";
import { ChatInputCommandInteraction, Client } from "discord.js";
import { formatUnits, keccak256, parseUnits, toUtf8Bytes } from "ethers";
import {
  cleanUserId,
  createDiscordMention,
  isDiscordMention,
} from "../utils/address";
import { Wallet } from "ethers";
import { getCommunity } from "../cw";

export const handleSendCommand = async (
  client: Client,
  interaction: ChatInputCommandInteraction
) => {
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

  const community = getCommunity(alias);

  const token = community.primaryToken;

  const formattedAmount = parseUnits(amount.toFixed(2), token.decimals);

  const senderHashedUserId = keccak256(toUtf8Bytes(interaction.user.id));

  const senderAddress = await getCardAddress(community, senderHashedUserId);
  if (!senderAddress) {
    await interaction.reply({
      content: "Could not find an account for you!",
      ephemeral: true,
    });
    return;
  }

  const balance =
    (await getAccountBalance(community, senderAddress)) ?? BigInt(0);
  if (!balance || balance === BigInt(0)) {
    await interaction.reply({
      content: `Insufficient balance: ${balance}`,
      ephemeral: true,
    });
    return;
  }

  if (balance < formattedAmount) {
    const formattedBalance = formatUnits(balance, token.decimals);
    await interaction.reply({
      content: `Insufficient balance: ${formattedBalance}`,
      ephemeral: true,
    });
    return;
  }

  let receiverAddress: string = user;
  let profile: ProfileWithTokenId | null = null;
  let receiverUserId: string | null = null;
  if (isDiscordMention(user)) {
    receiverAddress = user.replace(/<|>/g, "");

    const userId = cleanUserId(user);
    if (!userId) {
      await interaction.reply({
        content: "Invalid user id",
        ephemeral: true,
      });
      return;
    }

    const receiverHashedUserId = keccak256(toUtf8Bytes(userId));

    const receiverCardAddress = await getCardAddress(
      community,
      receiverHashedUserId
    );
    if (!receiverCardAddress) {
      await interaction.reply({
        content: "Could not find an account to send to!",
        ephemeral: true,
      });
      return;
    }

    receiverAddress = receiverCardAddress;
    receiverUserId = userId;
  } else {
    // Check if receiverAddress is a valid Ethereum address
    if (!/^0x[a-fA-F0-9]{40}$/.test(receiverAddress)) {
      await interaction.reply({
        content:
          "Invalid format: it's either a discord mention or an Ethereum address",
        ephemeral: true,
      });
      return;
    }

    profile = await getProfileFromAddress(community, receiverAddress);
  }

  const privateKey = process.env.BOT_PRIVATE_KEY;
  if (!privateKey) {
    await interaction.reply({
      content: "Private key is not set",
      ephemeral: true,
    });
    return;
  }

  const signer = new Wallet(privateKey);

  const signerAccountAddress = await getAccountAddress(
    community,
    signer.address
  );
  if (!signerAccountAddress) {
    await interaction.reply({
      content: "Could not find an account for you!",
      ephemeral: true,
    });
    return;
  }

  const bundler = new BundlerService(community);

  const transferCalldata = tokenTransferCallData(
    receiverAddress,
    formattedAmount
  );

  const calldata = callOnCardCallData(
    community,
    senderHashedUserId,
    token.address,
    BigInt(0),
    transferCalldata
  );

  const cardConfig = community.primarySafeCardConfig;

  const userOpData: UserOpData = {
    topic: tokenTransferEventTopic,
    from: senderAddress,
    to: receiverAddress,
    value: formattedAmount.toString(),
  };

  let extraData: UserOpExtraData | undefined;
  if (message) {
    extraData = {
      description: message,
    };
  }

  const hash = await bundler.call(
    signer,
    cardConfig.address,
    signerAccountAddress,
    calldata,
    userOpData,
    extraData
  );

  const explorer = community.explorer;

  if (receiverUserId) {
    try {
      const receiver = await client.users.fetch(receiverUserId);

      const dmChannel = await receiver.createDM();

      await dmChannel.send(
        `**${amount} ${token.symbol}** received from ${createDiscordMention(
          interaction.user.id
        )} ([View Transaction](${explorer.url}/tx/${hash}))`
      );

      if (message) {
        await dmChannel.send(`*${message}*`);
      }
    } catch (error) {
      console.error("Failed to send message to receiver", error);
    }
  }

  return interaction.reply({
    content: `Sent **${amount} ${token.symbol}** to ${
      profile?.name ?? profile?.username ?? user
    } 🚀 ([View Transaction](${explorer.url}/tx/${hash}))`,
    ephemeral: true,
  });
};

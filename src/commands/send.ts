import {
  BundlerService,
  callOnCardCallData,
  getAccountAddress,
  getAccountBalance,
  getCardAddress,
  getENSAddress,
  getProfileFromAddress,
  tokenTransferCallData,
  tokenTransferEventTopic,
  type ProfileWithTokenId,
  type UserOpData,
  type UserOpExtraData,
} from "@citizenwallet/sdk";
import { ChatInputCommandInteraction, Client, TextChannel } from "discord.js";
import { formatUnits, keccak256, parseUnits, toUtf8Bytes } from "ethers";
import {
  cleanUserId,
  createDiscordMention,
  isDiscordMention,
  isDomainName,
} from "../utils/address";
import { Wallet } from "ethers";
import { getCommunity } from "../cw";
import { createProgressSteps } from "../utils/progress";
import { ContentResponse, generateContent } from "../utils/content";
import { SendTaskArgs } from "./do/tasks";
import { getAddressFromUserInputWithReplies } from "./conversion/address";

export const handleSendCommand = async (
  client: Client,
  interaction: ChatInputCommandInteraction
) => {
  await interaction.reply({
    content: createProgressSteps(0),
    ephemeral: true,
  });

  const alias = interaction.options.getString("token");
  if (!alias) {
    await interaction.editReply("You need to specify a token!");
    return;
  }

  const users = interaction.options.getString("user");
  if (!users) {
    await interaction.editReply("You need to specify a user!");
    return;
  }

  const usersArray = users.split(",");
  if (usersArray.length === 0) {
    await interaction.editReply("You need to specify at least one user!");
    return;
  }

  const amount = interaction.options.getNumber("amount");
  if (!amount) {
    await interaction.editReply("You need to specify an amount!");
    return;
  }

  const message = interaction.options.getString("message");

  await sendCommand(client, interaction, {
    name: "send",
    alias,
    users: usersArray,
    amount,
    message,
  });
};

export const sendCommand = async (
  client: Client,
  interaction: ChatInputCommandInteraction,
  sendTaskArgs: SendTaskArgs
) => {
  const users = sendTaskArgs.users;
  const amount = sendTaskArgs.amount;
  3;

  const message = sendTaskArgs.message;

  const community = getCommunity(sendTaskArgs.alias);

  const token = community.primaryToken;

  if (token.decimals === 0) {
    const strAmount = amount.toString();

    if (strAmount.includes(".") || strAmount.includes(",")) {
      await interaction.editReply({
        content: `Amount provided ${amount} is not a whole number. This token has no decimals, please enter a whole amount`,
      });
      return;
    }
  }

  const formattedAmount = parseUnits(amount.toFixed(2), token.decimals);

  const senderHashedUserId = keccak256(toUtf8Bytes(interaction.user.id));

  const senderAddress = await getCardAddress(community, senderHashedUserId);
  if (!senderAddress) {
    await interaction.editReply({
      content: "Could not find an account for you!",
    });
    return;
  }

  const balance =
    (await getAccountBalance(community, senderAddress)) ?? BigInt(0);
  if (!balance || balance === BigInt(0)) {
    await interaction.editReply({
      content: `Insufficient balance: ${balance}. Attempted to send ${formattedAmount} ${token.symbol} to ${users.length} users`,
    });
    return;
  }

  const totalAmount = formattedAmount * BigInt(users.length);

  if (balance < totalAmount) {
    const formattedBalance = formatUnits(balance, token.decimals);
    await interaction.editReply({
      content: `Insufficient balance: ${formattedBalance}, requested to send ${totalAmount} in total to ${users.length} users`,
    });
    return;
  }

  const content: ContentResponse = {
    header: "",
    content: [],
  };

  let userIndex = 0;
  for (let user of users) {
    user = user.trim();

    content.header = createProgressSteps(1, `${userIndex + 1}/${users.length}`);
    await interaction.editReply({
      content: generateContent(content),
    });

    const { address, profile, userId } =
      await getAddressFromUserInputWithReplies(
        user,
        community,
        content,
        interaction
      );

    content.header = createProgressSteps(2, `${userIndex + 1}/${users.length}`);
    await interaction.editReply({
      content: generateContent(content),
    });

    const privateKey = process.env.BOT_PRIVATE_KEY;
    if (!privateKey) {
      await interaction.editReply({
        content: "Private key is not set",
      });
      continue;
    }

    const signer = new Wallet(privateKey);

    const signerAccountAddress = await getAccountAddress(
      community,
      signer.address
    );
    if (!signerAccountAddress) {
      await interaction.editReply({
        content: "Could not find an account for you!",
      });
      continue;
    }

    const bundler = new BundlerService(community);

    const transferCalldata = tokenTransferCallData(address, formattedAmount);

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
      to: address,
      value: formattedAmount.toString(),
    };

    let extraData: UserOpExtraData | undefined;
    if (message) {
      extraData = {
        description: message,
      };
    }

    try {
      const hash = await bundler.call(
        signer,
        cardConfig.address,
        signerAccountAddress,
        calldata,
        BigInt(0),
        userOpData,
        extraData
      );

      content.header = createProgressSteps(
        3,
        `${userIndex + 1}/${users.length}`
      );
      await interaction.editReply({
        content: generateContent(content),
      });

      const explorer = community.explorer;

      if (userId) {
        try {
          const receiver = await client.users.fetch(userId);

          const dmChannel = await receiver.createDM();

          await dmChannel.send(
            `${createDiscordMention(interaction.user.id)} sent **${amount} ${
              token.symbol
            }** to your account ([View Transaction](${
              explorer.url
            }/tx/${hash}))`
          );

          if (message) {
            await dmChannel.send(`*${message}*`);
          }
        } catch (error) {
          console.error("Failed to send message to receiver", error);
        }
      }

      content.header = `✅ Sent ${userIndex + 1}/${users.length}`;
      content.content.push(
        `**${amount} ${token.symbol}** to ${
          profile?.name ?? profile?.username ?? user
        } ([View Transaction](${explorer.url}/tx/${hash}))`
      );

      await interaction.editReply({
        content: generateContent(content),
      });
    } catch (error) {
      console.error("Failed to send transaction", error);
      content.content.push("❌ Failed to send transaction");
      await interaction.editReply({
        content: generateContent(content),
      });
    }

    userIndex++;
  }
};

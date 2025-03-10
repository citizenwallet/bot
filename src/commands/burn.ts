import {
  BundlerService,
  getAccountAddress,
  getCardAddress,
  getENSAddress,
  getProfileFromAddress,
  type ProfileWithTokenId,
} from "@citizenwallet/sdk";
import { ChatInputCommandInteraction, Client } from "discord.js";
import { keccak256, toUtf8Bytes } from "ethers";
import {
  cleanUserId,
  createDiscordMention,
  isDiscordMention,
  isDomainName,
} from "../utils/address";
import { Wallet } from "ethers";
import { getCommunity } from "../cw";
import { createProgressSteps } from "../utils/progress";
import { getReceiverFromUserInputWithReplies } from "./conversion/receiver";
import { ContentResponse } from "src/utils/content";

export const handleBurnCommand = async (
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

  const user = interaction.options.getString("user");
  if (!user) {
    await interaction.editReply("You need to specify a user!");
    return;
  }

  const usersArray = user.split(",");
  if (usersArray.length > 1) {
    await interaction.editReply("You can only burn from one user at a time");
    return;
  }

  const amount = interaction.options.getNumber("amount");
  if (!amount) {
    await interaction.editReply("You need to specify an amount!");
    return;
  }

  const message = interaction.options.getString("message");

  const community = getCommunity(alias);

  const token = community.primaryToken;

  const content: ContentResponse = {
    header: "",
    content: [],
  };

  const { receiverAddress, profile, receiverUserId } =
    await getReceiverFromUserInputWithReplies(
      user,
      community,
      content,
      interaction
    );

  await interaction.editReply(createProgressSteps(1));

  const privateKey = process.env.BOT_PRIVATE_KEY;
  if (!privateKey) {
    await interaction.editReply({
      content: "Private key is not set",
    });
    return;
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
    return;
  }

  await interaction.editReply(createProgressSteps(2));

  const bundler = new BundlerService(community);

  try {
    const hash = await bundler.burnFromERC20Token(
      signer,
      token.address,
      signerAccountAddress,
      receiverAddress,
      amount.toString(),
      message
    );

    await interaction.editReply(createProgressSteps(3));

    const explorer = community.explorer;

    if (receiverUserId) {
      try {
        const receiver = await client.users.fetch(receiverUserId);

        const dmChannel = await receiver.createDM();

        await dmChannel.send(
          `${createDiscordMention(interaction.user.id)} burned **${amount} ${
            token.symbol
          }** from your account ([View Transaction](${
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

    return interaction.editReply({
      content: `✅ Burned **${amount} ${token.symbol}** from ${
        profile?.name ?? profile?.username ?? user
      } ([View Transaction](${explorer.url}/tx/${hash}))`,
    });
  } catch (error) {
    console.error("Failed to burn", error);
    await interaction.editReply({
      content: "❌ Failed to burn",
    });
  }
};

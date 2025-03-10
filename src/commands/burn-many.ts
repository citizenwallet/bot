import { BundlerService, getAccountAddress } from "@citizenwallet/sdk";
import { ChatInputCommandInteraction, Client } from "discord.js";
import { Wallet } from "ethers";
import { getCommunity } from "../cw";
import { createDiscordMention } from "../utils/address";
import { ContentResponse, generateContent } from "../utils/content";
import { createProgressSteps } from "../utils/progress";
import { getReceiverFromUserInputWithReplies } from "./conversion/receiver";

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

  const users = interaction.options.getString("user");
  if (!users) {
    await interaction.editReply("You need to specify a user!");
    return;
  }

  const usersArray = users.split(",").map((user) => user.trim());

  const amount = interaction.options.getNumber("amount");
  if (!amount) {
    await interaction.editReply("You need to specify an amount!");
    return;
  }

  const message = interaction.options.getString("message");

  const community = getCommunity(alias);
  const token = community.primaryToken;

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

  // signer setup done
  await interaction.editReply(createProgressSteps(1));

  const content: ContentResponse = {
    header: "",
    content: [],
  };

  for (let userIndex = 0; userIndex < usersArray.length; userIndex++) {
    const user = usersArray[userIndex];
    const { receiverAddress, profile, receiverUserId } =
      await getReceiverFromUserInputWithReplies(
        user,
        community,
        content,
        interaction
      );

    content.header = createProgressSteps(
      1,
      `${userIndex + 2}/${usersArray.length + 2}`
    );

    await interaction.editReply({
      content: generateContent(content),
    });

    if (!receiverAddress) {
      continue;
    }

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

      const explorer = community.explorer;

      if (receiverUserId) {
        // send a DM to the receiver
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
  }
};

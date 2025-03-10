import { BundlerService, getAccountAddress } from "@citizenwallet/sdk";
import { ChatInputCommandInteraction, Client } from "discord.js";
import { Wallet } from "ethers";
import { getCommunity } from "../cw";
import { createDiscordMention } from "../utils/address";
import { ContentResponse, generateContent } from "../utils/content";
import { createProgressSteps } from "../utils/progress";
import { getAddressFromUserInputWithReplies } from "./conversion/address";

export const handleMintCommand = async (
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

  const amount = interaction.options.getNumber("amount");
  if (!amount) {
    await interaction.editReply("You need to specify an amount!");
    return;
  }

  const message = interaction.options.getString("message");

  const community = getCommunity(alias);

  const token = community.primaryToken;

  const usersArray = users.split(",");

  const content: ContentResponse = {
    header: "",
    content: [],
  };

  let userIndex = 0;

  for (let user of usersArray) {
    user = user.trim();

    const {
      address: receiverAddress,
      userId: receiverUserId,
      profile,
    } = await getAddressFromUserInputWithReplies(
      user,
      community,
      content,
      interaction
    );

    content.header = createProgressSteps(
      1,
      `${userIndex + 1}/${usersArray.length}`
    );
    await interaction.editReply({
      content: generateContent(content),
    });

    const privateKey = process.env.BOT_PRIVATE_KEY;
    if (!privateKey) {
      content.content.push("Private key is not set");
      await interaction.editReply({
        content: generateContent(content),
      });
      continue;
    }

    const signer = new Wallet(privateKey);

    const signerAccountAddress = await getAccountAddress(
      community,
      signer.address
    );
    if (!signerAccountAddress) {
      content.content.push("Could not find an account for you!");
      await interaction.editReply({
        content: generateContent(content),
      });
      continue;
    }

    content.header = createProgressSteps(
      2,
      `${userIndex + 1}/${usersArray.length}`
    );
    await interaction.editReply({
      content: generateContent(content),
    });

    const bundler = new BundlerService(community);

    try {
      const hash = await bundler.mintERC20Token(
        signer,
        token.address,
        signerAccountAddress,
        receiverAddress,
        amount.toString(),
        message
      );

      content.header = createProgressSteps(
        3,
        `${userIndex + 1}/${usersArray.length}`
      );
      await interaction.editReply({
        content: generateContent(content),
      });

      const explorer = community.explorer;

      if (receiverUserId) {
        try {
          const receiver = await client.users.fetch(receiverUserId);

          const dmChannel = await receiver.createDM();

          await dmChannel.send(
            `${createDiscordMention(interaction.user.id)} minted **${amount} ${
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

      content.header = `✅ Minted ${userIndex + 1}/${usersArray.length}`;
      content.content.push(
        `**${amount} ${token.symbol}** to ${
          profile?.name ?? profile?.username ?? user
        } ([View Transaction](${explorer.url}/tx/${hash}))`
      );

      await interaction.editReply({
        content: generateContent(content),
      });
    } catch (error) {
      console.error("Failed to mint", error);
      content.content.push("❌ Failed to mint");
      await interaction.editReply({
        content: generateContent(content),
      });
    }

    userIndex++;
  }
};

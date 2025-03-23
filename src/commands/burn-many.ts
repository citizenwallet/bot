import { BundlerService, getAccountAddress } from "@citizenwallet/sdk";
import { ChatInputCommandInteraction, Client } from "discord.js";
import { ethers, Wallet } from "ethers";
import { getCommunity } from "../cw";
import { createDiscordMention } from "../utils/address";
import { ContentResponse, generateContent } from "../utils/content";
import { createProgressSteps } from "../utils/progress";
import { getAddressFromUserInputWithReplies } from "./conversion/address";

export const handleBurnManyCommand = async (
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

  const users = interaction.options.getString("users");
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
    const { address, profile, userId } =
      await getAddressFromUserInputWithReplies(
        user,
        community,
        content,
        interaction
      );

    content.header = createProgressSteps(
      2,
      `${userIndex + 1}/${usersArray.length}`
    );

    await interaction.editReply({
      content: generateContent(content),
    });

    if (!address) {
      continue;
    }

    const bundler = new BundlerService(community);
    //new MockBundlerService(community);

    try {
      const hash = await bundler.burnFromERC20Token(
        signer,
        token.address,
        signerAccountAddress,
        address,
        amount.toString(),
        message
      );

      const explorer = community.explorer;

      if (userId) {
        // send a DM to the receiver
        try {
          const receiver = await client.users.fetch(userId);

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
          console.error("Failed to send message to user", error);
        }
      }

      content.content.push(
        `✅ Burned **${amount} ${token.symbol}** from ${
          profile?.name ?? profile?.username ?? user
        } ([View Transaction](${explorer.url}/tx/${hash}))`
      );

      await interaction.editReply({
        content: generateContent(content),
      });
    } catch (error) {
      console.error("Failed to burn", error);
      content.content.push("❌ Failed to burn");
      await interaction.editReply({
        content: generateContent(content),
      });
    }
  }
  content.header = createProgressSteps(3);

  await interaction.editReply({
    content: generateContent(content),
  });

  content.header = "✅ Done";

  await interaction.editReply({
    content: generateContent(content),
  });
};

import {
  BundlerService,
  getAccountAddress,
  getCardAddress,
  getProfileFromAddress,
  type ProfileWithTokenId,
} from "@citizenwallet/sdk";
import { ChatInputCommandInteraction, Client } from "discord.js";
import { keccak256, toUtf8Bytes } from "ethers";
import {
  cleanUserId,
  createDiscordMention,
  isDiscordMention,
} from "../utils/address";
import { Wallet } from "ethers";
import { getCommunity } from "../cw";

export const handleBurnCommand = async (
  client: Client,
  interaction: ChatInputCommandInteraction
) => {
  await interaction.reply({ content: "⚙️ Burning...", ephemeral: true });

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

  const amount = interaction.options.getNumber("amount");
  if (!amount) {
    await interaction.editReply("You need to specify an amount!");
    return;
  }

  const message = interaction.options.getString("message");

  const community = getCommunity(alias);

  const token = community.primaryToken;

  let receiverAddress: string = user;
  let profile: ProfileWithTokenId | null = null;
  let receiverUserId: string | null = null;
  if (isDiscordMention(user)) {
    receiverAddress = user.replace(/<|>/g, "");

    const userId = cleanUserId(user);
    if (!userId) {
      await interaction.editReply({
        content: "Invalid user id",
      });
      return;
    }

    const receiverHashedUserId = keccak256(toUtf8Bytes(userId));

    const receiverCardAddress = await getCardAddress(
      community,
      receiverHashedUserId
    );
    if (!receiverCardAddress) {
      await interaction.editReply({
        content: "Could not find an account to send to!",
      });
      return;
    }

    receiverAddress = receiverCardAddress;
    receiverUserId = userId;
  } else {
    // Check if receiverAddress is a valid Ethereum address
    if (!/^0x[a-fA-F0-9]{40}$/.test(receiverAddress)) {
      await interaction.editReply({
        content:
          "Invalid format: it's either a discord mention or an Ethereum address",
      });
      return;
    }

    profile = await getProfileFromAddress(community, receiverAddress);
  }

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

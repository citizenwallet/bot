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
  } else if (isDomainName(user)) {
    const domain = user;

    const mainnnetRpcUrl = process.env.MAINNET_RPC_URL;
    if (!mainnnetRpcUrl) {
      await interaction.editReply({
        content: "Mainnet RPC URL is not set",
      });
      return;
    }

    const ensAddress = await getENSAddress(mainnnetRpcUrl, domain);
    if (!ensAddress) {
      await interaction.editReply({
        content: "Could not find an ENS name for the domain",
      });
      return;
    }

    receiverAddress = ensAddress;
  } else {
    // Check if receiverAddress is a valid Ethereum address
    if (!/^0x[a-fA-F0-9]{40}$/.test(receiverAddress)) {
      await interaction.editReply({
        content:
          "Invalid format: it's either a discord mention or an Ethereum address",
      });
      return;
    }

    const ipfsDomain = process.env.IPFS_DOMAIN;
    if (!ipfsDomain) {
      await interaction.editReply("Could not find an IPFS domain!");
      return;
    }

    profile = await getProfileFromAddress(
      ipfsDomain,
      community,
      receiverAddress
    );
  }

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
    const hash = await bundler.mintERC20Token(
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
          `${createDiscordMention(interaction.user.id)} minted **${amount} ${
            token.symbol
          }** to your account ([View Transaction](${explorer.url}/tx/${hash}))`
        );

        if (message) {
          await dmChannel.send(`*${message}*`);
        }
      } catch (error) {
        console.error("Failed to send message to receiver", error);
      }
    }

    return interaction.editReply({
      content: `✅ Minted **${amount} ${token.symbol}** to ${
        profile?.name ?? profile?.username ?? user
      } ([View Transaction](${explorer.url}/tx/${hash}))`,
    });
  } catch (error) {
    console.error("Failed to mint", error);
    await interaction.editReply({
      content: "❌ Failed to mint",
    });
  }
};

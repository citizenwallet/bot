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
import { ContentResponse, generateContent } from "../utils/content";

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

    let receiverAddress: string = user;
    let profile: ProfileWithTokenId | null = null;
    let receiverUserId: string | null = null;
    if (isDiscordMention(user)) {
      receiverAddress = user.replace(/<|>/g, "");

      const userId = cleanUserId(user);
      if (!userId) {
        content.content.push("Invalid user id");
        await interaction.editReply({
          content: generateContent(content),
        });
        continue;
      }

      const receiverHashedUserId = keccak256(toUtf8Bytes(userId));

      const receiverCardAddress = await getCardAddress(
        community,
        receiverHashedUserId
      );
      if (!receiverCardAddress) {
        content.content.push("Could not find an account to send to!");
        await interaction.editReply({
          content: generateContent(content),
        });
        continue;
      }

      receiverAddress = receiverCardAddress;
      receiverUserId = userId;
    } else if (isDomainName(user)) {
      const domain = user;

      const mainnnetRpcUrl = process.env.MAINNET_RPC_URL;
      if (!mainnnetRpcUrl) {
        content.content.push("Mainnet RPC URL is not set");
        await interaction.editReply({
          content: generateContent(content),
        });
        continue;
      }

      const ensAddress = await getENSAddress(mainnnetRpcUrl, domain);
      if (!ensAddress) {
        content.content.push("Could not find an ENS name for the domain");
        await interaction.editReply({
          content: generateContent(content),
        });
        continue;
      }

      receiverAddress = ensAddress;
    } else {
      // Check if receiverAddress is a valid Ethereum address
      if (!/^0x[a-fA-F0-9]{40}$/.test(receiverAddress)) {
        content.content.push(
          "Invalid format: it's either a discord mention or an Ethereum address"
        );
        await interaction.editReply({
          content: generateContent(content),
        });
        continue;
      }

      const ipfsDomain = process.env.IPFS_DOMAIN;
      if (!ipfsDomain) {
        content.content.push("Could not find an IPFS domain!");
        await interaction.editReply({
          content: generateContent(content),
        });
        continue;
      }

      profile = await getProfileFromAddress(
        ipfsDomain,
        community,
        receiverAddress
      );
    }

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

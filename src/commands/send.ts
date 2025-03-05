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

  const amount = interaction.options.getNumber("amount");
  if (!amount) {
    await interaction.editReply("You need to specify an amount!");
    return;
  }

  const message = interaction.options.getString("message");

  const community = getCommunity(alias);

  const token = community.primaryToken;

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
      content: `Insufficient balance: ${balance}`,
    });
    return;
  }

  const usersArray = users.split(",");

  const totalAmount = formattedAmount * BigInt(usersArray.length);

  if (balance < totalAmount) {
    const formattedBalance = formatUnits(balance, token.decimals);
    await interaction.editReply({
      content: `Insufficient balance: ${formattedBalance}, requested to send ${totalAmount} in total to ${usersArray.length} users`,
    });
    return;
  }

  const content: ContentResponse = {
    header: "",
    content: [],
  };

  let userIndex = 0;
  for (let user of usersArray) {
    user = user.trim();

    content.header = createProgressSteps(
      1,
      `${userIndex + 1}/${usersArray.length}`
    );
    await interaction.editReply({
      content: generateContent(content),
    });

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
      2,
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

    try {
      const hash = await bundler.call(
        signer,
        cardConfig.address,
        signerAccountAddress,
        calldata,
        userOpData,
        extraData
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

      // const channel = client.channels.cache.get(
      //   "1319275100737900544"
      // ) as TextChannel;

      // await channel.send(
      //   `✅ Sent **${amount} ${token.symbol}** to ${
      //     profile?.name ?? profile?.username ?? user
      //   } ([View Transaction](${explorer.url}/tx/${hash}))`
      // );

      content.header = `✅ Sent ${userIndex + 1}/${usersArray.length}`;
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

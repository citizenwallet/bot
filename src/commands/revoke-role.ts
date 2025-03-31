import {
  BundlerService,
  getAccountAddress,
  getAccountBalance,
  getCardAddress,
} from "@citizenwallet/sdk";
import { ChatInputCommandInteraction, Client } from "discord.js";
import { ethers, keccak256, toUtf8Bytes, Wallet } from "ethers";
import { getCommunity } from "../cw";
import { createDiscordMention } from "../utils/address";
import { ContentResponse, generateContent } from "../utils/content";
import { createProgressSteps } from "../utils/progress";
import { getAddressFromUserInputWithReplies } from "./conversion/address";

export const handleRevokeRoleCommand = async (
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

  const role = interaction.options.getString("role");
  if (!role) {
    await interaction.editReply("You need to specify a role!");
    return;
  }

  const message = interaction.options.getString("message");

  const community = getCommunity(alias);
  const token = community.primaryToken;

  const guild = await client.guilds.fetch({ guild: interaction.guildId });
  const users = await guild.members.fetch();

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

  for (const [userId, user] of users) {
    const hashedUserId = keccak256(toUtf8Bytes(userId));

    const cardAddress = await getCardAddress(community, hashedUserId);
    if (!cardAddress) {
      content.content.push("Could not find an account to send to!");
      await interaction.editReply({
        content: generateContent(content),
      });
      continue;
    }

    // check user status
    const burnStatus = await getBurnStatus(user, role);
    if (burnStatus.status === "burnt") {
      content.content.push(`${user} has already burned`);
      await interaction.editReply({
        content: generateContent(content),
      });
      continue;
    } else {
      const balance = await getAccountBalance(community, cardAddress);
      if (burnStatus.remainingBurns > balance) {
        content.content.push(`${user} has not enough`);
        await interaction.editReply({
          content: generateContent(content),
        });
        await guild.members.removeRole({
          user: user,
          role: role,
        });
      } else {
        const bundler = new BundlerService(community);

        try {
          const hash = await bundler.burnFromERC20Token(
            signer,
            token.address,
            signerAccountAddress,
            cardAddress,
            burnStatus.remainingBurns.toString(),
            message
          );
        } catch (e) {}
      }
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

const getBurnStatus = async (user: string, role: string) => {
  return {
    status: "burnt",
    remainingBurns: 0,
  };
};

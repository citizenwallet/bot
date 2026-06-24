import {
  BundlerService,
  getAccountAddress,
  getAccountBalance,
  getCardAddress,
} from "@citizenwallet/sdk";
import {
  APIRole,
  ChatInputCommandInteraction,
  Client,
  GuildMember,
  Role,
} from "discord.js";
import { keccak256, toUtf8Bytes, Wallet } from "ethers";
import { getCommunity } from "../cw";
import { ContentResponse, generateContent } from "../utils/content";
import { createProgressSteps } from "../utils/progress";

export const handleBurnOrRevokeRoleCommand = async (
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

  const amount = interaction.options.getNumber("amount");
  if (!amount) {
    await interaction.editReply("You need to specify an amount!");
    return;
  }

  const role = interaction.options.getRole("role");
  if (!role) {
    await interaction.editReply("You need to specify a role!");
    return;
  }

  const message = interaction.options.getString("message");

  const community = getCommunity(alias);
  const token = community.primaryToken;
  const guild = await client.guilds.fetch(interaction.guildId);

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

  const content: ContentResponse = {
    header: createProgressSteps(1),
    content: [],
  };
  await interaction.editReply({
    content: generateContent(content),
  });

  const users = guild.members.cache.filter((member) => {
    // check whether member is not a bot and has the given role
    return !member.user.bot && member.roles.cache.has(role.id);
  });

  for (const [userId, user] of users) {
    const hashedUserId = keccak256(toUtf8Bytes(userId));

    const cardAddress = await getCardAddress(community, hashedUserId);
    if (!cardAddress) {
      content.content.push(
        `Could not find an account to send to for user ${user.user.displayName}!`
      );
      await interaction.editReply({
        content: generateContent(content),
      });
      continue;
    }

    content.header = createProgressSteps(2);
    await interaction.editReply({
      content: generateContent(content),
    });

    // check user status
    const burnStatus = { status: "new", remainingBurns: amount }; //await getBurnStatus(user, role);

    if (burnStatus.status === "burnt") {
      content.content.push(`${user} has already burned`);
      await interaction.editReply({
        content: generateContent(content),
      });
    } else {
      const balance = await getAccountBalance(community, cardAddress);

      content.content.push(
        `Handling user: ${user}, balance: ${balance} ${token.symbol}`
      );
      await interaction.editReply({
        content: generateContent(content),
      });

      if (burnStatus.remainingBurns > balance) {
        await guild.members.removeRole({
          user: user,
          role: role.id,
        });
        content.content.push(
          `${user} has not enough ${token.symbol}, removed role ${role.name}.`
        );
        await interaction.editReply({
          content: generateContent(content),
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
          content.content.push(
            `Burnt ${burnStatus.remainingBurns.toString()} ${
              token.symbol
            } for ${user}: ${hash}`
          );
          await interaction.editReply({
            content: generateContent(content),
          });
        } catch (e) {
          content.content.push(
            `Failed to burnt ${burnStatus.remainingBurns.toString()} ${
              token.symbol
            } for ${user} (${e.message})`
          );
          await interaction.editReply({
            content: generateContent(content),
          });
        }
      }
    }

    content.header = createProgressSteps(3);

    await interaction.editReply({
      content: generateContent(content),
    });
  }

  content.header = "✅ Done";

  await interaction.editReply({
    content: generateContent(content),
  });
};

const getBurnStatus = async (
  user: GuildMember,
  role: NonNullable<Role | APIRole>
) => {
  return {
    status: "partial",
    remainingBurns: 2,
  };
};

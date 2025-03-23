import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  Client,
  ComponentType,
  PermissionFlagsBits,
} from "discord.js";
import { getCommunities, getCommunity } from "../../cw";
import { createProgressSteps } from "../../utils/progress";
import { parseDoTask } from "../../openai";
import {
  ErrorTaskArgs,
  MissingInformationTaskArgs,
  SendTaskArgs,
  AddressTaskArgs,
  BalanceTaskArgs,
  ShareAddressTaskArgs,
  ShareBalanceTaskArgs,
  MintTaskArgs,
  BurnTaskArgs,
} from "./tasks";
import { sendCommand } from "../send";
import { addressCommand } from "../address";
import { balanceCommand } from "../balance";
import { shareAddressCommand } from "../shareAddress";
import { shareBalanceCommand } from "../shareBalance";
import { mintCommand } from "../mint";
import { burnCommand } from "../burn";

export const handleDoCommand = async (
  client: Client,
  interaction: ChatInputCommandInteraction
) => {
  await interaction.reply({
    content: createProgressSteps(0),
    ephemeral: true,
  });

  const task = interaction.options.getString("task");
  if (!task) {
    await interaction.editReply("You need to specify a task!");
    return;
  }

  const serverId = interaction.guildId;
  if (!serverId) {
    await interaction.editReply({
      content: "This command can only be used in a server.",
    });
    return;
  }

  const communities = getCommunities(serverId);

  const response = await parseDoTask(task, communities);

  // without confirmation
  switch (response.name) {
    case "address":
      await addressCommand(interaction, response as AddressTaskArgs);
      return;
    case "balance":
      await balanceCommand(interaction, response as BalanceTaskArgs);
      return;
    case "shareAddress":
      await shareAddressCommand(interaction, response as ShareAddressTaskArgs);
      return;
    case "shareBalance":
      await shareBalanceCommand(interaction, response as ShareBalanceTaskArgs);
      return;
    case "missingInformation":
      const missingInformationResponse = response as MissingInformationTaskArgs;
      await interaction.editReply({
        content: missingInformationResponse.missingInformation,
      });
      return;
    case "error":
      const errorResponse = response as ErrorTaskArgs;
      await interaction.editReply({
        content: errorResponse.error,
      });
      return;
  }

  // with confirmation
  switch (response.name) {
    case "send": {
      const sendResponse = response as SendTaskArgs;

      const community = getCommunity(sendResponse.alias);

      let message = `🚀 Send **${sendResponse.amount}${
        community.primaryToken.symbol
      }** to ${constructCommaSeparatedUsers(sendResponse.users)}`;
      if (sendResponse.message) {
        message += ` with the message: ${sendResponse.message}`;
      }
      message += "?";

      await confirmAction(client, interaction, message, (client, interaction) =>
        sendCommand(client, interaction, response as SendTaskArgs)
      );

      return;
    }
    case "mint": {
      // Check if a member has the MANAGE_GUILD permission
      if (
        typeof interaction.member.permissions === "string" ||
        !interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)
      ) {
        await interaction.editReply({
          content: "Only server admins can perform this action.",
        });
        return;
      }

      const mintResponse = response as MintTaskArgs;

      const community = getCommunity(mintResponse.alias);

      let message = `🔨 Mint **${mintResponse.amount}${
        community.primaryToken.symbol
      }** to ${constructCommaSeparatedUsers(mintResponse.users)}`;
      if (mintResponse.message) {
        message += ` with the message: ${mintResponse.message}`;
      }
      message += "?";

      await confirmAction(client, interaction, message, (client, interaction) =>
        mintCommand(client, interaction, mintResponse)
      );
      return;
    }
    case "burn": {
      // Check if a member has the MANAGE_GUILD permission
      if (
        typeof interaction.member.permissions === "string" ||
        !interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)
      ) {
        await interaction.editReply({
          content: "Only server admins can perform this action.",
        });
        return;
      }

      const burnResponse = response as BurnTaskArgs;

      const community = getCommunity(burnResponse.alias);

      let message = `🔥 Burn **${burnResponse.amount}${community.primaryToken.symbol}** from ${burnResponse.user}`;
      if (burnResponse.message) {
        message += ` with the message: ${burnResponse.message}`;
      }
      message += "?";

      await confirmAction(client, interaction, message, (client, interaction) =>
        burnCommand(client, interaction, burnResponse)
      );
      return;
    }
    default:
      await interaction.editReply({
        content: "Unable to determine which task to perform.",
      });
      return;
  }
};

const constructCommaSeparatedUsers = (users: string[]) => {
  return users.reduce((acc, user, index) => {
    if (index === users.length - 1 && index > 0) {
      return `${acc} and ${user}`;
    }
    return `${acc}${index === 0 ? "" : ","} ${user}`;
  }, "");
};

const confirmAction = async (
  client: Client,
  interaction: ChatInputCommandInteraction,
  confirmationMessage: string,
  action: (
    client: Client,
    interaction: ChatInputCommandInteraction
  ) => Promise<void>
) => {
  // display a cancel button
  const cancelButton = new ButtonBuilder()
    .setCustomId("cancel")
    .setLabel("Cancel")
    .setStyle(ButtonStyle.Secondary);

  // display confirmation button
  const confirmButton = new ButtonBuilder()
    .setCustomId("confirm")
    .setLabel("Confirm")
    .setStyle(ButtonStyle.Success);

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    cancelButton,
    confirmButton
  );

  await interaction.editReply({
    content: confirmationMessage,
    components: [row],
  });

  const collector = interaction.channel?.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: 15000,
    filter: (i) => i.user.id === interaction.user.id, // Only let the command user interact
  });

  collector.on("collect", async (i) => {
    if (i.customId === "cancel") {
      interaction.editReply({
        content: "Action cancelled.",
        components: [],
      });
      collector.stop("cancel");
      return;
    }

    if (i.customId === "confirm") {
      interaction.editReply({
        content: "Executing...",
        components: [],
      });

      await action(client, interaction);
      collector.stop("success");
      return;
    }
  });

  collector.on("end", (collected, reason) => {
    if (collected.size === 0) {
      interaction.followUp({
        content: "⏰ No response received within 15 seconds. Ignoring...",
        ephemeral: true,
      });
      return;
    }
  });
};

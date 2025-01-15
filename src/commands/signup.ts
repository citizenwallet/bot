import {
  ChatInputCommandInteraction,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
} from "discord.js";

export const handleSignupCommand = async (
  interaction: ChatInputCommandInteraction
) => {
  // Create the modal
  const modal = new ModalBuilder()
    .setCustomId("signupModal")
    .setTitle("Signup Request");

  // Create the text input components
  const emailInput = new TextInputBuilder()
    .setCustomId("emailInput")
    .setLabel("Email")
    .setPlaceholder("Enter your email")
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  // Split community info into separate fields
  const communityNameInput = new TextInputBuilder()
    .setCustomId("communityNameInput")
    .setLabel("Community Name")
    .setPlaceholder("Enter your community name")
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const communityDescriptionInput = new TextInputBuilder()
    .setCustomId("communityDescriptionInput")
    .setLabel("Community Description")
    .setPlaceholder("Describe your community")
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const websiteInput = new TextInputBuilder()
    .setCustomId("websiteInput")
    .setLabel("Token Website Link")
    .setPlaceholder("Enter your website URL")
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const tokenSetupInfoInput = new TextInputBuilder()
    .setCustomId("tokenSetupInfoInput")
    .setLabel("Your Token Information")
    .setPlaceholder(
      "name: My Token, symbol: MTK, address: 0x1234567890, chain: Polygon"
    )
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true);

  // Update action rows with new components
  const firstActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(
    emailInput
  );
  const secondActionRow =
    new ActionRowBuilder<TextInputBuilder>().addComponents(communityNameInput);
  const thirdActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(
    communityDescriptionInput
  );
  const fourthActionRow =
    new ActionRowBuilder<TextInputBuilder>().addComponents(websiteInput);
  const fifthActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(
    tokenSetupInfoInput
  );

  modal.addComponents(
    firstActionRow,
    secondActionRow,
    thirdActionRow,
    fourthActionRow,
    fifthActionRow
  );

  // Show the modal
  await interaction.showModal(modal);
};

import { Client, ModalSubmitInteraction } from "discord.js";
import { signupWebhookNotify } from "../discord/webhooks";

export const handleSignupModal = async (
  client: Client,
  interaction: ModalSubmitInteraction
) => {
  await interaction.reply({
    content: "⚙️ Submitting...",
    ephemeral: true,
  });

  const email = interaction.fields.getTextInputValue("emailInput");
  const communityName =
    interaction.fields.getTextInputValue("communityNameInput");
  const communityDescription = interaction.fields.getTextInputValue(
    "communityDescriptionInput"
  );
  const website = interaction.fields.getTextInputValue("websiteInput");
  const tokenSetupInformation = interaction.fields.getTextInputValue(
    "tokenSetupInfoInput"
  );

  const success = await signupWebhookNotify({
    serverId: interaction.guildId,
    serverName: interaction.guild.name,
    email,
    communityInformation: `Community Name: ${communityName}\nCommunity Description: ${communityDescription}\nWebsite: <${website}>`,
    tokenSetupInformation,
  });

  if (success) {
    await interaction.editReply({
      content: "✅ Signup request sent successfully",
    });

    const receiver = await client.users.fetch(interaction.user.id);
    const dmChannel = await receiver.createDM();

    await dmChannel.send(
      `Your signup request has been sent successfully. The team will get back to you soon.\n\nJoin the [Citizen Wallet Discord Server](${process.env.DISCORD_INVITE_LINK}) to stay updated.`
    );
  } else {
    await interaction.editReply({
      content: "❌ Failed to send signup request",
    });
  }
};

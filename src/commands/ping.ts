import { ChatInputCommandInteraction } from "discord.js";

export const handlePingCommand = async (
  interaction: ChatInputCommandInteraction
) => {
  console.log(interaction);
  await interaction.reply("Pong!");
};

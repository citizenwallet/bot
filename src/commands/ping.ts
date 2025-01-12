import { ChatInputCommandInteraction } from "discord.js";

export const handlePingCommand = async (
  interaction: ChatInputCommandInteraction
) => {
  await interaction.reply("Pong!");
};

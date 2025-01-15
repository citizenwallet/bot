import { AutocompleteInteraction } from "discord.js";
import { getCommunityChoices } from "../cw";

export const handleTokenAutocomplete = async (
  interaction: AutocompleteInteraction
) => {
  const serverId = interaction.guildId;
  if (!serverId) return;

  console.log(serverId);

  const communities = getCommunityChoices();

  const inputCurrentValue = interaction.options.getFocused();
  const searchTerms = inputCurrentValue.toLowerCase().split(" ");
  const filtered = communities.filter((choice) =>
    searchTerms.every((term) => choice.name.toLowerCase().includes(term))
  );

  await interaction.respond(filtered);
};

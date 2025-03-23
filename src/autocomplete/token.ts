import { AutocompleteInteraction } from "discord.js";
import { getCommunityChoices, getCommunitiesWithMinterRole } from "../cw";

export const handleTokenAutocomplete = async (
  interaction: AutocompleteInteraction
) => {
  const serverId = interaction.guildId;
  if (!serverId) return;

  const commandName = interaction.commandName;
  const requiresMintRole = ["mint", "burn", "burn-many"].includes(commandName);

  const communities = requiresMintRole
    ? await getCommunitiesWithMinterRole(serverId)
    : getCommunityChoices(serverId);

  const inputCurrentValue = interaction.options.getFocused();
  const searchTerms = inputCurrentValue.toLowerCase().split(" ");
  const filtered = communities.filter((choice) =>
    searchTerms.every((term) => choice.name.toLowerCase().includes(term))
  );

  await interaction.respond(filtered);
};

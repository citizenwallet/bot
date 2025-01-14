import {
  addOwnerCallData,
  BundlerService,
  getAccountAddress,
  getCardAddress,
} from "@citizenwallet/sdk";
import { ChatInputCommandInteraction, Client } from "discord.js";
import { keccak256, toUtf8Bytes } from "ethers";
import { Wallet } from "ethers";
import { getCommunities } from "../cw";
import { addressWithPrefix, generateSafeAccountUrl } from "../utils/safe";
import { ContentResponse, generateContent } from "../utils/content";

export const handleAddOwnerCommand = async (
  client: Client,
  interaction: ChatInputCommandInteraction
) => {
  await interaction.reply({ content: "⚙️ Adding owner...", ephemeral: true });

  const owner = interaction.options.getString("owner");
  if (!owner) {
    await interaction.editReply("You need to specify an owner!");
    return;
  }

  const communities = getCommunities();

  const updatedAccounts: string[] = [];

  const content: ContentResponse = {
    header: "",
    content: [],
  };
  for (const community of communities) {
    content.header = `⚙️ Adding owner to ${community.community.name}...`;
    await interaction.editReply({
      content: generateContent(content),
    });

    const senderHashedUserId = keccak256(toUtf8Bytes(interaction.user.id));

    const senderAddress = await getCardAddress(community, senderHashedUserId);
    if (!senderAddress) {
      await interaction.editReply({
        content: "Could not find an account for you!",
      });
      return;
    }

    const prefixedAddress = addressWithPrefix(
      community.primaryAccountConfig.chain_id.toString(),
      senderAddress
    );
    console.log("processing for prefixedAddress", prefixedAddress);

    if (updatedAccounts.includes(prefixedAddress)) {
      console.log("Already added owner to", community.community.name);
      console.log("Skipping", prefixedAddress);
      content.content.push(
        `✅ Added owner to ${
          community.community.name
        }: ([View on Safe](<${generateSafeAccountUrl(
          community,
          senderAddress,
          "/settings/setup"
        )}>))`
      );

      await interaction.editReply({
        content: generateContent(content),
      });

      continue;
    }

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

    const bundler = new BundlerService(community);

    const calldata = addOwnerCallData(community, senderHashedUserId, owner);

    const cardConfig = community.primarySafeCardConfig;

    console.log("adding owner for", community.community.name);
    console.log("address", prefixedAddress);
    try {
      const hash = await bundler.call(
        signer,
        cardConfig.address,
        signerAccountAddress,
        calldata
      );

      await bundler.awaitSuccess(hash);

      updatedAccounts.push(prefixedAddress);

      content.content.push(
        `✅ Added owner to ${
          community.community.name
        }: ([View on Safe](<${generateSafeAccountUrl(
          community,
          senderAddress,
          "/settings/setup"
        )}>))`
      );

      await interaction.editReply({
        content: generateContent(content),
      });
    } catch (error) {
      console.error("Failed to add owner to your Safe", error);
      content.content.push(
        `❌ Failed to add owner to ${
          community.community.name
        }: ([View on Safe](<${generateSafeAccountUrl(
          community,
          senderAddress,
          "/settings/setup"
        )}>))`
      );

      await interaction.editReply({
        content: generateContent(content),
      });
    }
  }

  content.header = "✅ Done!";
  await interaction.editReply({
    content: generateContent(content),
  });
};

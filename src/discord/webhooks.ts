export interface SignupInformation {
  serverId: string;
  serverName: string;
  email: string;
  communityInformation: string;
  tokenSetupInformation: string;
}

export const signupWebhookNotify = async (
  information: SignupInformation
): Promise<boolean> => {
  const webhookUrl = process.env.SIGNUP_DISCORD_WEBHOOK_URL;
  if (!webhookUrl) return false;

  let content = `**${information.serverName}** (${information.serverId}) has requested access to the Discord Wallet.\n`;

  if (information.email) {
    content += `\nEmail: ${information.email}`;
  }

  if (information.communityInformation) {
    content += `\nCommunity: ${information.communityInformation}`;
  }

  if (information.tokenSetupInformation) {
    content += `\nToken Setup Information: ${information.tokenSetupInformation}`;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content,
      }),
    });

    if (response.status < 200 || response.status >= 300) {
      console.error(response);
      return false;
    }

    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
};

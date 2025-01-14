export const cleanUserId = (userId: string) => {
  return userId.replace(/[^0-9]/g, "");
};

export const isDiscordMention = (userId: string) => {
  return /^<@\d+>$/.test(userId);
};

export const createDiscordMention = (userId: string) => {
  return `<@${userId}>`;
};

export const ChainToEip155ChainPrefix: { [key: string]: string } = {
  "1": "eth",
  "100": "gno",
  "137": "pol",
  "1101": "zkevm",
  "42161": "arb1",
  "42220": "celo",
  "8453": "base",
  "10": "oeth",
};

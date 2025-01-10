export const cleanUserId = (userId: string) => {
  return userId.replace(/[^0-9]/g, "");
};

export const isDiscordMention = (userId: string) => {
  return /^<@\d+>$/.test(userId);
};

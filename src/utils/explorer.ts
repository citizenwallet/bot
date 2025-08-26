export const getExplorerBaseUrl = (chainId: number) => {
  switch (chainId) {
    case 1:
      return "https://etherscan.io";
    case 100:
      return "https://gnosisscan.io";
    case 137:
      return "https://polygonscan.com";
    case 42161:
      return "https://arbiscan.io";
    case 42220:
      return "https://celoscan.io";
    case 8453:
      return "https://basescan.org";
    case 10:
      return "https://optimistic.etherscan.io";
    case 80094:
      return "https://berascan.com";
    default:
      return "https://etherscan.io";
  }
};

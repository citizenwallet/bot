import { CommunityConfig } from "@citizenwallet/sdk";
import { ethers } from "ethers";

export class MockBundlerService {
  constructor(community: CommunityConfig) {}

  async burnFromERC20Token(
    signer: ethers.Signer,
    tokenAddress: string,
    sender: string,
    from: string,
    amount: string,
    description?: string
  ): Promise<string> {
    return Promise.resolve("0x1234");
  }
}

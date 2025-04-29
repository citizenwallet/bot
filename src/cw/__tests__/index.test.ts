import { getLiveUpdateCommunities } from "../index";
import { CommunityConfig } from "@citizenwallet/sdk";
import * as communitiesModule from "../index";

// Add Jest type definitions
declare const jest: any;
declare const describe: any;
declare const it: any;
declare const expect: any;
declare const beforeEach: any;

describe("getLiveUpdateCommunities", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should correctly map server IDs to channel IDs for live updates", () => {
    const result = getLiveUpdateCommunities();

    console.log(result);

    // Check that the result has the expected communities
    expect(result).toHaveProperty("ctzn");
    expect(result).toHaveProperty("gratitude");

    // Check the serverChannelIds for 'ctzn' community
    expect(result["ctzn"].serverChannelIds).toEqual({
      "1125394118827331634": "1354113011492851805",
    });

    // Check the serverChannelIds for 'gratitude' community
    expect(result["gratitude"].serverChannelIds).toEqual({
      "1125394118827331634": "1356149878803271821",
    });

    // Verify that communities without live updates are not included
    expect(result).not.toHaveProperty("bread");
  });
});

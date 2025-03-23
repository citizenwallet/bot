export interface GenericTaskArgs {
  name: string;
}

export interface SendTaskArgs {
  name: string;
  alias: string;
  users: string[];
  amount: number;
  message: string;
}

export interface AddressTaskArgs {
  name: string;
  alias: string[];
}

export interface BalanceTaskArgs {
  name: string;
  alias: string[];
}

export interface ShareAddressTaskArgs {
  name: string;
  alias: string;
}

export interface ShareBalanceTaskArgs {
  name: string;
  alias: string;
}

export interface MintTaskArgs {
  name: string;
  alias: string;
  users: string[];
  amount: number;
  message: string;
}

export interface BurnTaskArgs {
  name: string;
  alias: string;
  user: string;
  amount: number;
  message: string;
}

export interface HelpTaskArgs {
  name: string;
}

export interface MissingInformationTaskArgs {
  name: string;
  missingInformation: string;
}

export interface ErrorTaskArgs {
  name: string;
  error: string;
}

export interface DoTask {
  name:
    | "send"
    | "address"
    | "balance"
    | "shareAddress"
    | "shareBalance"
    | "mint"
    | "burn"
    | "help"
    | "error"
    | "missingInformation";
  description: string;
  purpose: string;
  args:
    | SendTaskArgs
    | AddressTaskArgs
    | BalanceTaskArgs
    | ShareAddressTaskArgs
    | ShareBalanceTaskArgs
    | MintTaskArgs
    | BurnTaskArgs
    | HelpTaskArgs
    | ErrorTaskArgs
    | MissingInformationTaskArgs;
}

export const ExampleSendTask: DoTask = {
  name: "send",
  description: "Send a token to another user",
  purpose:
    "Send a token to another user, the token is resolved via the alias. Message is optional (empty string).",
  args: {
    name: "send",
    alias: "alias1",
    users: ["@JohnDoe"],
    amount: 100,
    message: "{any message the user would like to include goes here}",
  },
};

export const ExampleAddressTask: DoTask = {
  name: "address",
  description: "Reveal your address for the communities you specify",
  purpose:
    "Reveal the user's address for the communities they specify (these will go in the alias field). If they are not specific about which community, put all the community aliases in the alias field.",
  args: {
    name: "address",
    alias: ["alias1", "alias2"],
  },
};

export const ExampleBalanceTask: DoTask = {
  name: "balance",
  description: "Reveal your balance privately for the communities you specify",
  purpose:
    "Reveal the user's balance for the communities they specify (these will go in the alias field). If they are not specific about which community, put all the community aliases in the alias field.",
  args: {
    name: "balance",
    alias: ["alias1", "alias2"],
  },
};

export const ExampleShareAddressTask: DoTask = {
  name: "shareAddress",
  description: "Share your address for the community you specify",
  purpose:
    "Share the user's address for the community they have specified (this will go in the alias field).",
  args: {
    name: "shareAddress",
    alias: "alias1",
  },
};

export const ExampleShareBalanceTask: DoTask = {
  name: "shareBalance",
  description: "Share your balance for the community you specify",
  purpose:
    "Share the user's balance for the community they have specified (this will go in the alias field). Try to determine which community alias the user is referring to from the ones provided below.",
  args: {
    name: "shareBalance",
    alias: "alias1",
  },
};

export const ExampleMintTask: DoTask = {
  name: "mint",
  description: "Mint a token to another user",
  purpose:
    "Mint a token to another user, the token is resolved via the alias. Message is optional (empty string).",
  args: {
    name: "mint",
    alias: "alias1",
    users: ["@JohnDoe"],
    amount: 100,
    message: "{any message the user would like to include goes here}",
  },
};

export const ExampleBurnTask: DoTask = {
  name: "burn",
  description: "Burn a token from another account",
  purpose:
    "Burn a token from another account, the token is resolved via the alias. Message is optional (empty string).",
  args: {
    name: "burn",
    alias: "alias1",
    user: "@JohnDoe",
    amount: 100,
    message: "{any message the user would like to include goes here}",
  },
};

export const ExampleHelpTask: DoTask = {
  name: "help",
  description: "Get help",
  purpose:
    "If the user is trying to ask for help with commands or trying to list the available commands.",
  args: {
    name: "help",
  },
};

export const ExampleMissingInformationTask: DoTask = {
  name: "missingInformation",
  description: "Handle a missing information",
  purpose: "Handle a missing information",
  args: {
    name: "missingInformation",
    missingInformation: "{tell the user what information is missing}",
  },
};

export const ExampleErrorTask: DoTask = {
  name: "error",
  description: "Handle an error",
  purpose: "Handle an error",
  args: {
    name: "error",
    error:
      "I am only able to perform the following: send, address, balance, shareAddress, shareBalance, mint, burn",
  },
};

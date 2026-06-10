export type AccountProvider = "local-mock";

export type AccountProfile = {
  id: string;
  displayName: string;
  email: string;
  provider: AccountProvider;
  createdAt: string;
  lastSignedInAt: string;
};

export type AccountState = {
  version: 1;
  profile: AccountProfile | null;
  mode: "guest" | "signed-in";
};

export type CreateAccountInput = {
  displayName: string;
  email: string;
};

export type CurrencyCode = "MXN";

export type Group = {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  memberIds: string[];
};

export type Member = {
  id: string;
  name: string;
  avatarColor: string;
  joinedAt: string;
};

export type Expense = {
  id: string;
  groupId: string;
  title: string;
  amountCents: number;
  currency: CurrencyCode;
  payerId: string;
  participantIds: string[];
  note?: string;
  createdAt: string;
};

export type Settlement = {
  id: string;
  groupId: string;
  fromMemberId: string;
  toMemberId: string;
  amountCents: number;
  currency: CurrencyCode;
  status: "paid";
  createdAt: string;
};

export type AppData = {
  version: 1;
  groups: Group[];
  members: Member[];
  expenses: Expense[];
  settlements: Settlement[];
  selectedGroupId: string;
};

export type SplitShare = {
  memberId: string;
  amountCents: number;
};

export type MemberBalance = {
  member: Member;
  paidCents: number;
  owedCents: number;
  settledCents: number;
  netCents: number;
};

export type SettlementSuggestion = {
  fromMemberId: string;
  toMemberId: string;
  amountCents: number;
  currency: CurrencyCode;
};

export type ActivityItem = {
  id: string;
  groupId: string;
  type: "expense" | "settlement";
  title: string;
  subtitle: string;
  amountCents: number;
  currency: CurrencyCode;
  createdAt: string;
};

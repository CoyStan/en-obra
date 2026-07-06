export type CurrencyCode = "MXN";

export type GroupMemberRole = "owner" | "member";
export type GroupMemberStatus = "active" | "invited" | "left";
export type GroupJoinSource = "seed" | "created" | "manual" | "invite";

export type User = {
  id: string;
  displayName: string;
  phoneOrEmail?: string;
  avatarColor: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
};

export type Group = {
  id: string;
  name: string;
  description: string;
  currencyCode?: CurrencyCode;
  createdByUserId?: string;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
  memberIds: string[];
};

export type Member = {
  id: string;
  userId?: string;
  name: string;
  avatarColor: string;
  role?: GroupMemberRole;
  status?: GroupMemberStatus;
  joinSource?: GroupJoinSource;
  joinedAt: string;
  leftAt?: string;
};

export type GroupMember = {
  id: string;
  groupId: string;
  userId: string;
  displayNameSnapshot: string;
  role: GroupMemberRole;
  status: GroupMemberStatus;
  joinSource: GroupJoinSource;
  invitedByUserId?: string;
  inviteId?: string;
  joinedAt: string;
  leftAt?: string;
};

export type GroupInvite = {
  id: string;
  groupId: string;
  code: string;
  label: string;
  status: "active" | "revoked" | "expired";
  createdByUserId: string;
  createdAt: string;
  expiresAt?: string;
  lastUsedAt?: string;
};

export type Expense = {
  id: string;
  groupId: string;
  title: string;
  amountCents: number;
  currency: CurrencyCode;
  payerId: string;
  paidByMemberId?: string;
  createdByUserId?: string;
  categoryId?: string;
  participantIds: string[];
  note?: string;
  expenseDate?: string;
  createdAt: string;
  updatedAt?: string;
  deletedAt?: string;
};

export type ExpenseParticipant = {
  id: string;
  expenseId: string;
  memberId: string;
  shareMethod: "equal";
  shareCents: number;
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
  recordedByUserId?: string;
  recordedAt?: string;
  note?: string;
  createdAt: string;
};

export type AppData = {
  version: 1 | 2;
  users?: User[];
  groups: Group[];
  groupInvites?: GroupInvite[];
  groupMembers?: GroupMember[];
  members: Member[];
  expenses: Expense[];
  expenseParticipants?: ExpenseParticipant[];
  settlements: Settlement[];
  activityEvents?: ActivityEvent[];
  syncOutbox?: SyncOutboxItem[];
  selectedUserId?: string;
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
  type: "expense" | "settlement" | "member" | "group";
  title: string;
  subtitle: string;
  actorName?: string;
  categoryId?: string;
  label?: string;
  amountCents: number;
  currency: CurrencyCode;
  createdAt: string;
};

export type ActivityEvent = {
  id: string;
  groupId: string;
  actorUserId: string;
  eventType:
    | "expense_created"
    | "settlement_recorded"
    | "member_added"
    | "member_joined"
    | "group_created"
    | "group_invite_created";
  entityType: "expense" | "settlement" | "member" | "group" | "group_invite";
  entityId: string;
  summary: string;
  createdAt: string;
};

export type SyncOutboxItem = {
  id: string;
  operation: "create" | "update" | "delete" | "snapshot";
  entityType:
    | "user"
    | "group"
    | "group_member"
    | "group_invite"
    | "expense"
    | "expense_participant"
    | "settlement"
    | "activity_event";
  entityId: string;
  payloadJson: string;
  status: "pending" | "sent" | "failed";
  attemptCount: number;
  createdAt: string;
  lastAttemptAt?: string;
};

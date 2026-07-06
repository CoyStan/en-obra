import { splitEqual } from "./money";
import type { AppData, GroupInvite, GroupMember, Member, User } from "./types";

function userIdForMember(memberId: string) {
  return `user-${memberId.replace(/^member-/, "")}`;
}

function legacyUsers(members: Member[]): User[] {
  return members.map((member) => ({
    id: member.userId ?? userIdForMember(member.id),
    displayName: member.name,
    phoneOrEmail: `${member.id}@demo.local`,
    avatarColor: member.avatarColor,
    createdAt: member.joinedAt,
    updatedAt: member.joinedAt,
  }));
}

function legacyGroupMembers(data: AppData, users: User[]): GroupMember[] {
  const membersById = new Map(data.members.map((member) => [member.id, member]));
  const userByMemberId = new Map(
    data.members.map((member) => [member.id, member.userId ?? userIdForMember(member.id)]),
  );
  const validUsers = new Set(users.map((user) => user.id));

  return data.groups.flatMap((group) =>
    group.memberIds
      .map((memberId, index) => {
        const member = membersById.get(memberId);
        const userId = userByMemberId.get(memberId);
        if (!member || !userId || !validUsers.has(userId)) {
          return null;
        }
        const groupMember: GroupMember = {
          id: member.id,
          groupId: group.id,
          userId,
          displayNameSnapshot: member.name,
          role: index === 0 ? "owner" as const : "member" as const,
          status: member.leftAt ? "left" as const : "active" as const,
          joinSource: "seed" as const,
          joinedAt: member.joinedAt,
          leftAt: member.leftAt,
        };
        return groupMember;
      })
      .filter((member): member is GroupMember => Boolean(member)),
  );
}

function normalizeGroupMember(member: GroupMember): GroupMember {
  return {
    ...member,
    status: member.leftAt ? "left" : member.status ?? "active",
    joinSource: member.joinSource ?? "seed",
  };
}

function legacyGroupInvites(data: AppData, users: User[]): GroupInvite[] {
  return data.groups.map((group) => ({
    id: `invite-${group.id}`,
    groupId: group.id,
    code: group.id.replace(/^group-/, "CC-").toUpperCase(),
    label: "Invitación local demo",
    status: "active",
    createdByUserId: group.createdByUserId ?? users[0]?.id ?? "user-local-demo",
    createdAt: group.createdAt,
  }));
}

export function normalizeAppData(data: AppData): AppData {
  const users = data.users?.length ? data.users : legacyUsers(data.members);
  const groupMembers = data.groupMembers?.length
    ? data.groupMembers.map(normalizeGroupMember)
    : legacyGroupMembers(data, users);
  const groupInvites = data.groupInvites?.length ? data.groupInvites : legacyGroupInvites(data, users);
  const expenseParticipants = data.expenseParticipants?.length
    ? data.expenseParticipants
    : data.expenses.flatMap((expense) =>
        splitEqual(expense.amountCents, expense.participantIds).map((share) => ({
          id: `participant-${expense.id}-${share.memberId}`,
          expenseId: expense.id,
          memberId: share.memberId,
          shareMethod: "equal" as const,
          shareCents: share.amountCents,
          shareUnits: 1,
          createdAt: expense.createdAt,
        })),
      );

  return {
    ...data,
    version: 2,
    users,
    groupInvites,
    groupMembers,
    expenseParticipants,
    activityEvents: data.activityEvents ?? [],
    syncOutbox: data.syncOutbox ?? [],
    selectedUserId: data.selectedUserId ?? users[0]?.id,
    groups: data.groups.map((group) => ({
      ...group,
      currencyCode: group.currencyCode ?? "MXN",
      createdByUserId: group.createdByUserId ?? users[0]?.id,
    })),
    expenses: data.expenses.map((expense) => ({
      ...expense,
      paidByMemberId: expense.paidByMemberId ?? expense.payerId,
      createdByUserId: expense.createdByUserId ?? users[0]?.id,
      expenseDate: expense.expenseDate ?? expense.createdAt.slice(0, 10),
      updatedAt: expense.updatedAt ?? expense.createdAt,
    })),
    settlements: data.settlements.map((settlement) => ({
      ...settlement,
      recordedByUserId: settlement.recordedByUserId ?? users[0]?.id,
      recordedAt: settlement.recordedAt ?? settlement.createdAt,
    })),
  };
}

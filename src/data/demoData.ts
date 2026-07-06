import { resolveSplit, splitEqual } from "../domain/splits";
import type {
  ActivityEvent,
  AppData,
  Expense,
  GroupInvite,
  GroupMember,
  Member,
  Settlement,
  User,
} from "../domain/types";

const now = "2026-06-10T12:00:00Z";

const users: User[] = [
  { id: "user-ana", displayName: "Ana", phoneOrEmail: "ana@demo.local", avatarColor: "#0E7C66", createdAt: "2026-05-28T14:00:00Z", updatedAt: now },
  { id: "user-luis", displayName: "Luis", phoneOrEmail: "luis@demo.local", avatarColor: "#2A4FD4", createdAt: "2026-05-28T14:00:00Z", updatedAt: now },
  { id: "user-maru", displayName: "Maru", phoneOrEmail: "maru@demo.local", avatarColor: "#B85A3D", createdAt: "2026-05-28T14:00:00Z", updatedAt: now },
  { id: "user-diego", displayName: "Diego", phoneOrEmail: "diego@demo.local", avatarColor: "#536D83", createdAt: "2026-05-28T14:00:00Z", updatedAt: now },
  { id: "user-sofia", displayName: "Sofía", phoneOrEmail: "sofia@demo.local", avatarColor: "#0A5A4A", createdAt: "2026-05-28T14:00:00Z", updatedAt: now },
  { id: "user-fer", displayName: "Fer", phoneOrEmail: "fer@demo.local", avatarColor: "#6B5FA8", createdAt: "2026-06-01T12:00:00Z", updatedAt: now },
  { id: "user-paola", displayName: "Paola", phoneOrEmail: "paola@demo.local", avatarColor: "#8A5D12", createdAt: "2026-06-01T12:00:00Z", updatedAt: now },
  { id: "user-rene", displayName: "René", phoneOrEmail: "rene@demo.local", avatarColor: "#445666", createdAt: "2026-06-02T12:00:00Z", updatedAt: now },
];

const userById = new Map(users.map((user) => [user.id, user]));

const groupMembers: GroupMember[] = [
  { id: "member-oaxaca-ana", groupId: "group-oaxaca", userId: "user-ana", displayNameSnapshot: "Ana", role: "owner", status: "active", joinSource: "seed", joinedAt: "2026-05-28T14:00:00Z" },
  { id: "member-oaxaca-luis", groupId: "group-oaxaca", userId: "user-luis", displayNameSnapshot: "Luis", role: "member", status: "active", joinSource: "invite", invitedByUserId: "user-ana", inviteId: "invite-oaxaca", joinedAt: "2026-05-28T14:05:00Z" },
  { id: "member-oaxaca-maru", groupId: "group-oaxaca", userId: "user-maru", displayNameSnapshot: "Maru", role: "member", status: "active", joinSource: "invite", invitedByUserId: "user-ana", inviteId: "invite-oaxaca", joinedAt: "2026-05-28T14:07:00Z" },
  { id: "member-oaxaca-diego", groupId: "group-oaxaca", userId: "user-diego", displayNameSnapshot: "Diego", role: "member", status: "active", joinSource: "invite", invitedByUserId: "user-ana", inviteId: "invite-oaxaca", joinedAt: "2026-05-28T14:09:00Z" },
  { id: "member-oaxaca-sofia", groupId: "group-oaxaca", userId: "user-sofia", displayNameSnapshot: "Sofía", role: "member", status: "active", joinSource: "invite", invitedByUserId: "user-ana", inviteId: "invite-oaxaca", joinedAt: "2026-05-28T14:11:00Z" },
  { id: "member-roma-ana", groupId: "group-roma", userId: "user-ana", displayNameSnapshot: "Ana", role: "owner", status: "active", joinSource: "created", joinedAt: "2026-06-01T12:00:00Z" },
  { id: "member-roma-fer", groupId: "group-roma", userId: "user-fer", displayNameSnapshot: "Fer", role: "member", status: "active", joinSource: "invite", invitedByUserId: "user-ana", inviteId: "invite-roma", joinedAt: "2026-06-01T12:15:00Z" },
  { id: "member-roma-paola", groupId: "group-roma", userId: "user-paola", displayNameSnapshot: "Paola", role: "member", status: "active", joinSource: "invite", invitedByUserId: "user-ana", inviteId: "invite-roma", joinedAt: "2026-06-01T12:18:00Z" },
  { id: "member-asada-luis", groupId: "group-asada", userId: "user-luis", displayNameSnapshot: "Luis", role: "owner", status: "active", joinSource: "created", joinedAt: "2026-06-02T12:00:00Z" },
  { id: "member-asada-diego", groupId: "group-asada", userId: "user-diego", displayNameSnapshot: "Diego", role: "member", status: "active", joinSource: "invite", invitedByUserId: "user-luis", inviteId: "invite-asada", joinedAt: "2026-06-02T12:20:00Z" },
  { id: "member-asada-rene", groupId: "group-asada", userId: "user-rene", displayNameSnapshot: "René", role: "member", status: "active", joinSource: "invite", invitedByUserId: "user-luis", inviteId: "invite-asada", joinedAt: "2026-06-02T12:22:00Z" },
  { id: "member-asada-sofia", groupId: "group-asada", userId: "user-sofia", displayNameSnapshot: "Sofía", role: "member", status: "active", joinSource: "invite", invitedByUserId: "user-luis", inviteId: "invite-asada", joinedAt: "2026-06-02T12:24:00Z" },
];

const members: Member[] = groupMembers.map((member) => ({
  id: member.id,
  userId: member.userId,
  name: member.displayNameSnapshot,
  avatarColor: userById.get(member.userId)?.avatarColor ?? "#0E7C66",
  role: member.role,
  status: member.status,
  joinSource: member.joinSource,
  joinedAt: member.joinedAt,
  leftAt: member.leftAt,
}));

const groupInvites: GroupInvite[] = [
  {
    id: "invite-oaxaca",
    groupId: "group-oaxaca",
    code: "CC-OAXACA-2026",
    label: "Liga local para el viaje",
    status: "active",
    createdByUserId: "user-ana",
    createdAt: "2026-05-28T14:02:00Z",
    lastUsedAt: "2026-05-28T14:11:00Z",
  },
  {
    id: "invite-roma",
    groupId: "group-roma",
    code: "CC-ROMA-NORTE",
    label: "Liga local del depa",
    status: "active",
    createdByUserId: "user-ana",
    createdAt: "2026-06-01T12:05:00Z",
    lastUsedAt: "2026-06-01T12:18:00Z",
  },
  {
    id: "invite-asada",
    groupId: "group-asada",
    code: "CC-ASADA-MTY",
    label: "Liga local de la asada",
    status: "active",
    createdByUserId: "user-luis",
    createdAt: "2026-06-02T12:10:00Z",
    lastUsedAt: "2026-06-02T12:24:00Z",
  },
];

const expenses: Expense[] = [
  {
    id: "expense-oaxaca-hotel",
    groupId: "group-oaxaca",
    title: "Hospedaje Centro",
    amountCents: 620000,
    currency: "MXN",
    payerId: "member-oaxaca-ana",
    paidByMemberId: "member-oaxaca-ana",
    createdByUserId: "user-ana",
    categoryId: "travel",
    participantIds: ["member-oaxaca-ana", "member-oaxaca-luis", "member-oaxaca-maru", "member-oaxaca-diego", "member-oaxaca-sofia"],
    note: "Dos noches, cinco personas.",
    expenseDate: "2026-06-06",
    createdAt: "2026-06-06T20:30:00Z",
    updatedAt: "2026-06-06T20:30:00Z",
  },
  {
    id: "expense-oaxaca-tlayudas",
    groupId: "group-oaxaca",
    title: "Cena de tlayudas",
    amountCents: 148050,
    currency: "MXN",
    payerId: "member-oaxaca-luis",
    paidByMemberId: "member-oaxaca-luis",
    createdByUserId: "user-luis",
    categoryId: "food",
    participantIds: ["member-oaxaca-ana", "member-oaxaca-luis", "member-oaxaca-maru", "member-oaxaca-diego", "member-oaxaca-sofia"],
    note: "Incluye aguas y propina.",
    expenseDate: "2026-06-07",
    createdAt: "2026-06-07T03:10:00Z",
    updatedAt: "2026-06-07T03:10:00Z",
  },
  {
    id: "expense-oaxaca-taxi",
    groupId: "group-oaxaca",
    title: "Taxi aeropuerto",
    amountCents: 76000,
    currency: "MXN",
    payerId: "member-oaxaca-maru",
    paidByMemberId: "member-oaxaca-maru",
    createdByUserId: "user-maru",
    categoryId: "transport",
    participantIds: ["member-oaxaca-ana", "member-oaxaca-luis", "member-oaxaca-maru", "member-oaxaca-diego", "member-oaxaca-sofia"],
    expenseDate: "2026-06-08",
    createdAt: "2026-06-08T18:45:00Z",
    updatedAt: "2026-06-08T18:45:00Z",
  },
  {
    id: "expense-roma-super",
    groupId: "group-roma",
    title: "Súper semanal",
    amountCents: 182450,
    currency: "MXN",
    payerId: "member-roma-fer",
    paidByMemberId: "member-roma-fer",
    createdByUserId: "user-fer",
    categoryId: "groceries",
    participantIds: ["member-roma-ana", "member-roma-fer", "member-roma-paola"],
    expenseDate: "2026-06-07",
    createdAt: "2026-06-07T18:00:00Z",
    updatedAt: "2026-06-07T18:00:00Z",
  },
  {
    id: "expense-asada-carne",
    groupId: "group-asada",
    title: "Carne y carbón",
    amountCents: 235000,
    currency: "MXN",
    payerId: "member-asada-rene",
    paidByMemberId: "member-asada-rene",
    createdByUserId: "user-rene",
    categoryId: "food",
    participantIds: ["member-asada-luis", "member-asada-diego", "member-asada-rene", "member-asada-sofia"],
    expenseDate: "2026-06-09",
    createdAt: "2026-06-09T03:20:00Z",
    updatedAt: "2026-06-09T03:20:00Z",
  },
];

const settlements: Settlement[] = [
  {
    id: "settlement-oaxaca-sofia-luis",
    groupId: "group-oaxaca",
    fromMemberId: "member-oaxaca-sofia",
    toMemberId: "member-oaxaca-luis",
    amountCents: 28000,
    currency: "MXN",
    status: "paid",
    recordedByUserId: "user-sofia",
    recordedAt: "2026-06-08T21:30:00Z",
    createdAt: "2026-06-08T21:30:00Z",
    note: "Registro local de pago externo.",
  },
];

function sharesForExpense(expense: Expense) {
  if (expense.id === "expense-roma-super") {
    const split = resolveSplit(expense.amountCents, {
      method: "exact",
      shares: [
        { memberId: "member-roma-ana", amountCents: 60000 },
        { memberId: "member-roma-fer", amountCents: 72450 },
        { memberId: "member-roma-paola", amountCents: 50000 },
      ],
    });
    if (split.ok) {
      return split.shares;
    }
  }

  if (expense.id === "expense-asada-carne") {
    const split = resolveSplit(expense.amountCents, {
      method: "shares",
      shares: [
        { memberId: "member-asada-luis", units: 2 },
        { memberId: "member-asada-diego", units: 1 },
        { memberId: "member-asada-rene", units: 2 },
        { memberId: "member-asada-sofia", units: 1 },
      ],
    });
    if (split.ok) {
      return split.shares;
    }
  }

  return splitEqual(expense.amountCents, expense.participantIds).map((share) => ({
    ...share,
    method: "equal" as const,
    units: undefined,
  }));
}

const activityEvents: ActivityEvent[] = [
  ...groupInvites.map((invite) => ({
    id: `activity-${invite.id}`,
    groupId: invite.groupId,
    actorUserId: invite.createdByUserId,
    eventType: "group_invite_created" as const,
    entityType: "group_invite" as const,
    entityId: invite.id,
    summary: `Se creó ${invite.label}`,
    createdAt: invite.createdAt,
  })),
  ...groupMembers
    .filter((member) => member.joinSource === "invite")
    .map((member) => ({
      id: `activity-joined-${member.id}`,
      groupId: member.groupId,
      actorUserId: member.userId,
      eventType: "member_joined" as const,
      entityType: "member" as const,
      entityId: member.id,
      summary: `${member.displayNameSnapshot} se unió al grupo`,
      createdAt: member.joinedAt,
    })),
  ...expenses.map((expense) => ({
    id: `activity-${expense.id}`,
    groupId: expense.groupId,
    actorUserId: expense.createdByUserId ?? "user-ana",
    eventType: "expense_created" as const,
    entityType: "expense" as const,
    entityId: expense.id,
    summary: `Se agregó ${expense.title}`,
    createdAt: expense.createdAt,
  })),
  ...settlements.map((settlement) => ({
    id: `activity-${settlement.id}`,
    groupId: settlement.groupId,
    actorUserId: settlement.recordedByUserId ?? "user-ana",
    eventType: "settlement_recorded" as const,
    entityType: "settlement" as const,
    entityId: settlement.id,
    summary: "Se marcó un arreglo local como pagado",
    createdAt: settlement.recordedAt ?? settlement.createdAt,
  })),
];

export const demoData: AppData = {
  version: 2,
  selectedUserId: "user-ana",
  selectedGroupId: "group-oaxaca",
  users,
  members,
  groupInvites,
  groupMembers,
  groups: [
    {
      id: "group-oaxaca",
      name: "Viaje a Oaxaca",
      description: "Comidas, taxis y hospedaje del puente.",
      currencyCode: "MXN",
      createdByUserId: "user-ana",
      createdAt: "2026-05-28T14:00:00Z",
      updatedAt: "2026-06-08T20:30:00Z",
      memberIds: ["member-oaxaca-ana", "member-oaxaca-luis", "member-oaxaca-maru", "member-oaxaca-diego", "member-oaxaca-sofia"],
    },
    {
      id: "group-roma",
      name: "Depa Roma Norte",
      description: "Gastos compartidos del departamento.",
      currencyCode: "MXN",
      createdByUserId: "user-ana",
      createdAt: "2026-06-01T12:00:00Z",
      updatedAt: "2026-06-07T18:00:00Z",
      memberIds: ["member-roma-ana", "member-roma-fer", "member-roma-paola"],
    },
    {
      id: "group-asada",
      name: "Asada Monterrey",
      description: "Carne, hielo, botanas y rides.",
      currencyCode: "MXN",
      createdByUserId: "user-luis",
      createdAt: "2026-06-02T12:00:00Z",
      updatedAt: "2026-06-09T03:20:00Z",
      memberIds: ["member-asada-luis", "member-asada-diego", "member-asada-rene", "member-asada-sofia"],
    },
  ],
  expenses,
  expenseParticipants: expenses.flatMap((expense) =>
    sharesForExpense(expense).map((share) => ({
      id: `participant-${expense.id}-${share.memberId}`,
      expenseId: expense.id,
      memberId: share.memberId,
      shareMethod: share.method,
      shareCents: share.amountCents,
      shareUnits: share.units,
      createdAt: expense.createdAt,
    })),
  ),
  settlements,
  activityEvents,
  syncOutbox: [],
};

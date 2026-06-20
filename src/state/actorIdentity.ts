import type { AppData } from "../domain/types";

export function resolveActorUserId(data: Pick<AppData, "selectedUserId" | "users">, requestedUserId?: string) {
  if (requestedUserId && data.users?.some((user) => user.id === requestedUserId)) {
    return requestedUserId;
  }

  return data.selectedUserId ?? data.users?.[0]?.id ?? "user-local-demo";
}

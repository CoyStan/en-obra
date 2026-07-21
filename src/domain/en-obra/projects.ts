import { todayIsoDate } from "./dates";
import { normalizePhoneToE164 } from "./phone";
import type { Project, ProjectLifecycle } from "./types";

export type NewProjectInput = {
  name: string;
  clientName: string;
  clientPhone?: string;
  address?: string;
  service?: string;
};

export type ProjectUpdateInput = {
  name: string;
  clientName: string;
  clientPhone?: string;
  address?: string;
  service?: string;
};

export function createProjectRecord(input: NewProjectInput, id: string, now: Date): Project {
  return {
    id,
    name: input.name.trim(),
    clientName: input.clientName.trim(),
    clientPhone: normalizePhoneToE164(input.clientPhone ?? ""),
    address: input.address?.trim() ?? "",
    service: input.service?.trim() || "Trabajo en curso",
    startedOn: todayIsoDate(now),
    lifecycle: "active",
  };
}

export function updateProjectRecord(project: Project, input: ProjectUpdateInput): Project {
  const name = input.name.trim();
  const clientName = input.clientName.trim();
  if (!name || !clientName) {
    return project;
  }
  return {
    ...project,
    name,
    clientName,
    clientPhone: normalizePhoneToE164(input.clientPhone ?? ""),
    address: input.address?.trim() ?? "",
    service: input.service?.trim() || project.service,
  };
}

export function setProjectLifecycle(
  project: Project,
  lifecycle: ProjectLifecycle,
  now: string,
): Project {
  if (project.lifecycle === lifecycle) {
    return project;
  }
  return {
    ...project,
    lifecycle,
    completedAt: lifecycle === "completed" ? now : lifecycle === "archived" ? project.completedAt ?? now : undefined,
    archivedAt: lifecycle === "archived" ? now : undefined,
  };
}

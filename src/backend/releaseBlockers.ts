export type ReleaseBlockerCategory =
  | "founder-access-decision"
  | "founder-storage-decision"
  | "legal-privacy"
  | "play-console"
  | "remote-deletion"
  | "storage-operations"
  | "secrets-security"
  | "build-signing"
  | "unknown";

export type ReleaseBlockerOwner =
  | "founder"
  | "legal"
  | "release"
  | "security"
  | "engineering"
  | "unknown";

export type ClassifiedReleaseBlocker = {
  id: string;
  category: ReleaseBlockerCategory;
  owner: ReleaseBlockerOwner;
  blocksInternalTestingUpload: boolean;
  blocksProductionBackend: boolean;
};

export type ReleaseBlockerGroup = {
  category: ReleaseBlockerCategory;
  owner: ReleaseBlockerOwner;
  blockers: string[];
};

export type ReleaseBlockerClassificationReport = {
  blockers: ClassifiedReleaseBlocker[];
  groups: ReleaseBlockerGroup[];
  unknownBlockers: string[];
  hasUnknownBlockers: boolean;
};

const categoryRules: {
  category: ReleaseBlockerCategory;
  owner: ReleaseBlockerOwner;
  patterns: RegExp[];
  blocksInternalTestingUpload: boolean;
  blocksProductionBackend: boolean;
}[] = [
  {
    category: "founder-access-decision",
    owner: "founder",
    patterns: [/production-auth/, /auth\/access/, /access\/provider/, /auth\/storage provider/, /account-deletion-request/, /verified-session/],
    blocksInternalTestingUpload: false,
    blocksProductionBackend: true,
  },
  {
    category: "founder-storage-decision",
    owner: "founder",
    patterns: [/production-storage/, /storage\/backend/, /storage\/provider/, /auth\/storage provider/, /remote-persistence/],
    blocksInternalTestingUpload: false,
    blocksProductionBackend: true,
  },
  {
    category: "legal-privacy",
    owner: "legal",
    patterns: [/legal/, /privacy policy/, /privacy-policy/, /Data Safety answers/i, /Play Console wording/],
    blocksInternalTestingUpload: true,
    blocksProductionBackend: true,
  },
  {
    category: "play-console",
    owner: "release",
    patterns: [/Play Console/, /internal testing/i, /uploaded AAB/i],
    blocksInternalTestingUpload: true,
    blocksProductionBackend: false,
  },
  {
    category: "build-signing",
    owner: "release",
    patterns: [/signing/, /signed Android App Bundle/, /credentials/],
    blocksInternalTestingUpload: true,
    blocksProductionBackend: false,
  },
  {
    category: "remote-deletion",
    owner: "security",
    patterns: [/remote-deletion/, /remote-delete/, /deletion URL/i, /public-deletion-url/, /deletion-fulfillment/],
    blocksInternalTestingUpload: true,
    blocksProductionBackend: true,
  },
  {
    category: "storage-operations",
    owner: "engineering",
    patterns: [/server-side-backups/, /backup-restore/, /regional-data-decision/, /retention-policy/],
    blocksInternalTestingUpload: false,
    blocksProductionBackend: true,
  },
  {
    category: "secrets-security",
    owner: "security",
    patterns: [/secrets/, /secret/, /api-key/, /private-key/, /service-account/, /endpoint/, /security-review/],
    blocksInternalTestingUpload: false,
    blocksProductionBackend: true,
  },
];

function classifyOne(id: string): ClassifiedReleaseBlocker {
  const rule = categoryRules.find((candidate) => candidate.patterns.some((pattern) => pattern.test(id)));

  if (!rule) {
    return {
      id,
      category: "unknown",
      owner: "unknown",
      blocksInternalTestingUpload: true,
      blocksProductionBackend: true,
    };
  }

  return {
    id,
    category: rule.category,
    owner: rule.owner,
    blocksInternalTestingUpload: rule.blocksInternalTestingUpload,
    blocksProductionBackend: rule.blocksProductionBackend,
  };
}

export function classifyReleaseBlockers(blockers: string[]): ReleaseBlockerClassificationReport {
  const classified = Array.from(new Set(blockers)).sort().map(classifyOne);
  const grouped = new Map<string, ReleaseBlockerGroup>();

  for (const blocker of classified) {
    const key = `${blocker.category}:${blocker.owner}`;
    const group = grouped.get(key) ?? {
      category: blocker.category,
      owner: blocker.owner,
      blockers: [],
    };
    group.blockers.push(blocker.id);
    grouped.set(key, group);
  }

  const groups = [...grouped.values()]
    .map((group) => ({ ...group, blockers: group.blockers.sort() }))
    .sort((a, b) => a.category.localeCompare(b.category));
  const unknownBlockers = classified
    .filter((blocker) => blocker.category === "unknown")
    .map((blocker) => blocker.id);

  return {
    blockers: classified,
    groups,
    unknownBlockers,
    hasUnknownBlockers: unknownBlockers.length > 0,
  };
}

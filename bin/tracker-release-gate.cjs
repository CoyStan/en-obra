const blockers = [
  "authenticated provider workspaces and cloud sync",
  "revocable read-only client update links",
  "offline delivery-proof uploads to the provider's Drive",
  "subscription billing and server-side entitlement validation",
  "physical Android, TalkBack, offline, and sleep/resume validation",
  "published privacy, support, deletion, and Play Data Safety details",
];

process.stderr.write("Cuenta Obra is a verified prototype, not a release-ready Android product.\n");
for (const blocker of blockers) {
  process.stderr.write(`- ${blocker}\n`);
}
process.exitCode = 1;

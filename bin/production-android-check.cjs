#!/usr/bin/env node
"use strict";

const blockers = [
  "Play Console publisher account and app listing are not configured in-repo",
  "Privacy policy, terms, support contacts, and public policy URLs are still drafts",
  "Android package com.cuentasclaras.app must be confirmed with the founder before Play production",
  "Authenticated provider workspaces and cloud sync are not implemented",
  "Revocable read-only client update links are not implemented",
  "Offline delivery-proof uploads to the provider's Drive are not implemented",
  "Subscription billing and server-side entitlement validation are not implemented",
  "Physical Android, TalkBack, offline, and sleep/resume validation on target devices",
  "Published Google Play Data Safety form aligned with the shipped build",
  "Confirm Play listing copy, privacy/support URLs, and publisher identity before production",
];

process.stderr.write("En Obra is a verified local pilot, not a production Play release.\n");
process.stderr.write("Remaining production blockers:\n");
for (const blocker of blockers) {
  process.stderr.write(`- ${blocker}\n`);
}
process.stderr.write("\nRun npm run pilot:android:check for local pilot readiness.\n");
process.exit(1);

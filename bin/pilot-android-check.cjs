#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");

const repoRoot = path.resolve(__dirname, "..");
const failures = [];

function readJson(relativePath) {
  const fullPath = path.join(repoRoot, relativePath);
  return JSON.parse(fs.readFileSync(fullPath, "utf8"));
}

function fail(message) {
  failures.push(message);
}

function assertEqual(label, actual, expected) {
  if (actual !== expected) {
    fail(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

function assertIncludes(label, haystack, needle) {
  if (!haystack.includes(needle)) {
    fail(`${label}: expected to include ${JSON.stringify(needle)}`);
  }
}

function assertExists(relativePath) {
  const fullPath = path.join(repoRoot, relativePath);
  if (!fs.existsSync(fullPath)) {
    fail(`missing required file: ${relativePath}`);
  }
}

const pkg = readJson("package.json");
const app = readJson("app.json").expo;

assertEqual("package name", pkg.name, "en-obra");
assertIncludes("start script", pkg.scripts.start, "expo start");
if (pkg.scripts.start.includes("dashboard")) {
  fail("start script must not launch dashboard; use dev:dashboard instead");
}

assertEqual("app name", app.name, "En Obra");
assertEqual("app slug", app.slug, "en-obra");
assertEqual("app scheme", app.scheme, "enobra");
assertEqual("android package", app.android.package, "com.cuentasclaras.app");

assertExists("src/persistence/keys.ts");
assertExists("src/persistence/enObraRepository.ts");
assertExists("src/domain/en-obra/types.ts");

const keysSource = fs.readFileSync(path.join(repoRoot, "src/persistence/keys.ts"), "utf8");
for (const key of [
  "EN_OBRA_STORAGE_KEY",
  "EN_OBRA_RECOVERY_KEY",
  "LEGACY_TRACKER_V1_KEY",
  "EN_OBRA_DEMO_STORAGE_KEY",
]) {
  if (!keysSource.includes(key)) {
    fail(`src/persistence/keys.ts must define ${key}`);
  }
}

const appSource = fs.readFileSync(path.join(repoRoot, "App.tsx"), "utf8");
if (appSource.includes("MainScreen")) {
  fail("App.tsx must not import MainScreen");
}
if (!appSource.includes("TrackerScreen")) {
  fail("App.tsx must mount TrackerScreen");
}

const eas = readJson("eas.json");
if (!eas.build?.["pilot-apk"]) {
  fail("eas.json must define pilot-apk profile");
}
if (!eas.build?.["play-aab"]) {
  fail("eas.json must define play-aab profile");
}

if (failures.length > 0) {
  process.stderr.write("En Obra pilot Android check failed:\n");
  for (const item of failures) {
    process.stderr.write(`- ${item}\n`);
  }
  process.exit(1);
}

process.stdout.write("En Obra pilot Android check passed (local-only pilot honesty checks).\n");

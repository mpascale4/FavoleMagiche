#!/usr/bin/env node

/**
 * Script per chiudere una feature e incrementare automaticamente la versione
 *
 * Uso:
 *   npm run feature:finish -- <nome-feature>
 *   oppure
 *   node scripts/finish-feature.cjs <nome-feature>
 *
 * Esempio:
 *   npm run feature:finish -- aggiungi-schermata-impostazioni
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const args = process.argv.slice(2);
const featureName = args[0];

if (!featureName) {
  console.error("❌ Errore: devi specificare il nome della feature");
  console.error("\nEsempio: npm run feature:finish -- aggiungi-nuova-schermata");
  process.exit(1);
}

function nowParts() {
  const now = new Date();
  return {
    releaseDate: now.toISOString().split("T")[0],
    releaseTime: now.toTimeString().slice(0, 5)
  };
}

function ensureArray(value) {
  return Array.isArray(value) ? value : [];
}

try {
  // 1. Verifica che siamo su un branch feature
  let currentBranch;
  try {
    currentBranch = execSync("git rev-parse --abbrev-ref HEAD", {
      encoding: "utf-8"
    }).trim();
  } catch (e) {
    console.error("❌ Errore: non siamo in un repository git");
    process.exit(1);
  }

  if (!currentBranch.startsWith("feature/")) {
    console.error(`❌ Errore: siamo sul branch "${currentBranch}", non su una feature branch`);
    process.exit(1);
  }

  // 2. Incrementa la versione patch
  const versionPath = path.join(__dirname, "..", "version.json");
  const publicVersionPath = path.join(__dirname, "..", "public", "version.json");

  let versionData = JSON.parse(fs.readFileSync(versionPath, "utf8"));
  const oldVersion = versionData.version;

  // Parse versione (semantic versioning)
  const parts = oldVersion.split(".");
  const major = parseInt(parts[0], 10);
  const minor = parseInt(parts[1], 10);
  const patch = parseInt(parts[2], 10);

  const newPatch = patch + 1;
  const newVersion = `${major}.${minor}.${newPatch}`;

  const { releaseDate, releaseTime } = nowParts();

  const fallbackChanges = [
    {
      type: "improvement",
      title: "Version bump automatico",
      description: `Feature ${featureName} chiusa con incremento versione.`
    }
  ];

  const changesForHistory = ensureArray(versionData.recentChanges).length > 0
    ? versionData.recentChanges
    : fallbackChanges;

  versionData.version = newVersion;
  versionData.releaseDate = releaseDate;
  versionData.releaseTime = releaseTime;
  versionData.recentChanges = changesForHistory;

  const historyEntry = {
    version: newVersion,
    releaseDate,
    releaseTime,
    changes: changesForHistory
  };

  const existingHistory = ensureArray(versionData.versionHistory).filter((h) => h.version !== newVersion);
  versionData.versionHistory = [historyEntry, ...existingHistory].slice(0, 10);

  fs.writeFileSync(versionPath, JSON.stringify(versionData, null, 2));
  fs.writeFileSync(publicVersionPath, JSON.stringify(versionData, null, 2));

  console.log(`✅ Versione incrementata: ${oldVersion} → ${newVersion}`);

  // 3. Commit il file di versione
  execSync("git add version.json public/version.json", { stdio: "inherit" });
  execSync(`git commit -m "chore: version bump to ${newVersion}"`, { stdio: "inherit" });
  console.log("📝 Versione committata");

  // 4. Chiudi la feature
  console.log("\n⏳ Chiusura feature con Git Flow...");
  execSync(`git flow feature finish ${featureName}`, { stdio: "inherit" });

  console.log("\n" + "=".repeat(60));
  console.log("✨ Feature chiusa con successo!");
  console.log(`📌 Versione: ${newVersion}`);
  console.log(`📅 Data: ${releaseDate}`);
  console.log(`⏰ Ora: ${releaseTime}`);
  console.log("\n🚀 Comandi suggeriti per il push:");
  console.log("   git push origin develop");
  console.log("   git push origin --tags");

} catch (error) {
  console.error("\n❌ Errore durante la chiusura della feature:");
  console.error(error.message);
  process.exit(1);
}

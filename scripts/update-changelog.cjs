#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const readline = require("readline");

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

function ask(prompt) {
  return new Promise((resolve) => rl.question(prompt, resolve));
}

function ensureArray(v) {
  return Array.isArray(v) ? v : [];
}

(async () => {
  try {
    const root = path.join(__dirname, "..");
    const versionPath = path.join(root, "version.json");
    const publicVersionPath = path.join(root, "public", "version.json");
    const changelogPath = path.join(root, "CHANGELOG.md");

    const versionData = JSON.parse(fs.readFileSync(versionPath, "utf8"));
    const changelog = fs.readFileSync(changelogPath, "utf8");

    console.log(`Versione attuale: ${versionData.version}`);

    const inputVersion = (await ask("Nuova versione (invio = mantiene corrente): ")).trim();
    const newVersion = inputVersion || versionData.version;

    const countRaw = (await ask("Quante modifiche inserire? (1-10): ")).trim();
    const count = Math.min(10, Math.max(1, parseInt(countRaw || "1", 10)));

    const changes = [];
    for (let i = 0; i < count; i++) {
      const title = (await ask(`Titolo modifica ${i + 1}: `)).trim() || `Modifica ${i + 1}`;
      const description = (await ask("Descrizione: ")).trim() || "Aggiornamento";
      const typeInput = (await ask("Tipo [feature/fix/improvement] (default=improvement): ")).trim();
      const type = ["feature", "fix", "improvement"].includes(typeInput) ? typeInput : "improvement";
      changes.push({ type, title, description });
    }

    const now = new Date();
    const releaseDate = now.toISOString().split("T")[0];
    const releaseTime = now.toTimeString().slice(0, 5);

    versionData.version = newVersion;
    versionData.releaseDate = releaseDate;
    versionData.releaseTime = releaseTime;
    versionData.recentChanges = changes;

    const historyEntry = {
      version: newVersion,
      releaseDate,
      releaseTime,
      changes
    };

    const existing = ensureArray(versionData.versionHistory).filter((h) => h.version !== newVersion);
    versionData.versionHistory = [historyEntry, ...existing].slice(0, 10);

    fs.writeFileSync(versionPath, JSON.stringify(versionData, null, 2));
    fs.writeFileSync(publicVersionPath, JSON.stringify(versionData, null, 2));

    const grouped = { Aggiunte: [], Correzioni: [], Miglioramenti: [] };
    changes.forEach((c) => {
      if (c.type === "feature") grouped.Aggiunte.push(c);
      else if (c.type === "fix") grouped.Correzioni.push(c);
      else grouped.Miglioramenti.push(c);
    });

    let entry = `## [${newVersion}] - ${releaseDate} ${releaseTime}\n\n`;
    if (grouped.Aggiunte.length > 0) {
      entry += "### ✨ Aggiunte\n";
      grouped.Aggiunte.forEach((c) => (entry += `- ${c.title}: ${c.description}\n`));
      entry += "\n";
    }
    if (grouped.Correzioni.length > 0) {
      entry += "### 🔧 Correzioni\n";
      grouped.Correzioni.forEach((c) => (entry += `- ${c.title}: ${c.description}\n`));
      entry += "\n";
    }
    if (grouped.Miglioramenti.length > 0) {
      entry += "### 📈 Miglioramenti\n";
      grouped.Miglioramenti.forEach((c) => (entry += `- ${c.title}: ${c.description}\n`));
      entry += "\n";
    }
    entry += "---\n\n";

    const firstVersionHeader = changelog.indexOf("## [");
    const nextChangelog =
      firstVersionHeader >= 0
        ? changelog.slice(0, firstVersionHeader) + entry + changelog.slice(firstVersionHeader)
        : `${changelog}\n\n${entry}`;

    fs.writeFileSync(changelogPath, nextChangelog);

    console.log("✅ CHANGELOG.md aggiornato");
    console.log("✅ version.json aggiornato");
    console.log("✅ public/version.json aggiornato");
    console.log("Comandi suggeriti:");
    console.log("  git add CHANGELOG.md version.json public/version.json");
    console.log(`  git commit -m \"chore: aggiorna changelog v${newVersion}\"`);
  } catch (error) {
    console.error("Errore update changelog:", error.message);
    process.exitCode = 1;
  } finally {
    rl.close();
  }
})();


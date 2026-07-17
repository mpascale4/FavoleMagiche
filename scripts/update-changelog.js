i#!/usr/bin/env node

/**
 * Script per aggiornare CHANGELOG.md e version.json
 *
 * Uso: node scripts/update-changelog.js
 *      oppure: npm run update:changelog
 */

const fs = require("fs");
const path = require("path");
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function main() {
  console.log("\n📝 Aggiorna CHANGELOG.md e version.json\n");

  // Leggi versione attuale
  const versionPath = path.join(__dirname, "..", "version.json");
  const changelogPath = path.join(__dirname, "..", "CHANGELOG.md");

  let versionData = JSON.parse(fs.readFileSync(versionPath, "utf8"));
  let changelog = fs.readFileSync(changelogPath, "utf8");

  const currentVersion = versionData.version;
  console.log(`Versione attuale: ${currentVersion}`);

  // Chiedi nuova versione
  const newVersion = await question("Nuova versione (lascia vuoto per skippy): ");
  if (!newVersion) {
    console.log("Operazione annullata.\n");
    rl.close();
    return;
  }

  // Chiedi numero modifiche
  const numChanges = parseInt(await question("Quante modifiche? (1-5): ") || "1");

  const changes = [];
  for (let i = 0; i < numChanges; i++) {
    const title = await question(`Titolo modifica ${i + 1}: `);
    const description = await question(`Descrizione: `);
    const type = await question(`Tipo [feature/fix/improvement]: `);

    changes.push({
      type: type || "feature",
      title,
      description
    });
  }

  // Aggiorna version.json
  const today = new Date().toISOString().split("T")[0];
  versionData.version = newVersion;
  versionData.releaseDate = today;
  versionData.recentChanges = changes;

  fs.writeFileSync(versionPath, JSON.stringify(versionData, null, 2));
  console.log("✅ version.json aggiornato\n");

  // Aggiorna CHANGELOG.md
  const typeEmoji = {
    feature: "✨",
    fix: "🔧",
    improvement: "📈"
  };

  let changelogEntry = `## [${newVersion}] - ${today}\n\n`;

  const grouped = {};
  changes.forEach((change) => {
    const sectionName =
      change.type === "feature"
        ? "Aggiunte"
        : change.type === "fix"
        ? "Correzioni"
        : "Miglioramenti";

    if (!grouped[sectionName]) grouped[sectionName] = [];
    grouped[sectionName].push(change);
  });

  Object.entries(grouped).forEach(([section, items]) => {
    changelogEntry += `### ${section}\n`;
    items.forEach((item) => {
      changelogEntry += `- ${item.title}: ${item.description}\n`;
    });
    changelogEntry += "\n";
  });

  changelogEntry += `---\n\n`;

  // Inserisci all'inizio dopo l'header
  const headerEnd = changelog.indexOf("## [");
  const newChangelog =
    changelog.substring(0, headerEnd) +
    changelogEntry +
    changelog.substring(headerEnd);

  fs.writeFileSync(changelogPath, newChangelog);
  console.log("✅ CHANGELOG.md aggiornato\n");

  console.log(`
🎉 Pronto per il commit!

Comandi suggeriti:
  git add CHANGELOG.md version.json
  git commit -m "chore: aggiorna changelog v${newVersion}"
  git tag v${newVersion}
  git push origin develop
  git push origin --tags
`);

  rl.close();
}

main().catch(console.error);

r
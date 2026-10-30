import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const STORIES_DIR = path.join(ROOT, "pages", "the-blog", "ministories");

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function slugFromFilename(filename) {
  return path.basename(filename, ".json").toLowerCase();
}

function renderStory(story, filename) {
  const title = escapeHtml(story.title || "");
  const date = escapeHtml(story.date || "");
  const author = escapeHtml(story.author || "");
  const heroId = `hero-${slugFromFilename(filename)}`;
  const content = String(story.content || "").trim();

  return `<div class="hero-image partial" id="${heroId}">
    <div class="hero-text" data-text="${title}">${title}</div>
</div>
<section class="style2 array-2 centered">
    <article class="column">
        <h1>${date}</h1>
        <article class="writing">
${content ? content.split(/\r?\n/).map(line => line.trim()).filter(Boolean).map(line => `            ${line}`).join("\n") + "\n" : ""}            <p>by ${author}</p>
        </article>
    </article>
</section>
<section class="style2 spacer"></section>
<section class="style4 spacer"></section>
`;
}

async function main() {
  const entries = await fs.readdir(STORIES_DIR, { withFileTypes: true });

  const jsonFiles = entries.filter(
    entry => entry.isFile() && entry.name.endsWith(".json")
  );

  for (const entry of jsonFiles) {
    const jsonPath = path.join(STORIES_DIR, entry.name);
    const htmlPath = path.join(
      STORIES_DIR,
      `${path.basename(entry.name, ".json")}.html`
    );

    const story = JSON.parse(await fs.readFile(jsonPath, "utf8"));

    const html = renderStory(story, entry.name);

    await fs.writeFile(htmlPath, html, "utf8");

    console.log(`Generated ${path.relative(ROOT, htmlPath)}`);
  }

  console.log(`Finished generating ${jsonFiles.length} story page(s).`);
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});

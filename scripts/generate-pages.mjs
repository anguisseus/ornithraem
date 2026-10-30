
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

function createExcerpt(html, maxLength = 240) {
  const plainText = String(html || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();

  if (plainText.length <= maxLength) {
    return plainText;
  }

  return plainText.slice(0, maxLength).trimEnd() + "...";
}

function parseStoryDate(value = "") {
  const normalized = String(value).replace(
    /(\d+)(st|nd|rd|th)/gi,
    "$1"
  );

  const timestamp = Date.parse(normalized);

  return Number.isNaN(timestamp) ? 0 : timestamp;
}

async function main() {
  const entries = await fs.readdir(STORIES_DIR, {
    withFileTypes: true
  });

  const jsonFiles = entries
    .filter(entry => entry.isFile() && entry.name.endsWith(".json"))
    .sort((a, b) => a.name.localeCompare(b.name));

  const storyIndex = [];

  for (const entry of jsonFiles) {
    const jsonPath = path.join(STORIES_DIR, entry.name);

    const htmlPath = path.join(
      STORIES_DIR,
      `${path.basename(entry.name, ".json")}.html`
    );

    const story = JSON.parse(
      await fs.readFile(jsonPath, "utf8")
    );

    const html = renderStory(story, entry.name);

    await fs.writeFile(htmlPath, html, "utf8");

    console.log(`Generated ${path.relative(ROOT, htmlPath)}`);

    storyIndex.push({
      slug: slugFromFilename(entry.name),
      title: story.title || "",
      date: story.date || "",
      excerpt: createExcerpt(story.content || "")
    });
  }

  // sort stories by date
  // NEWEST
  storyIndex.sort(
    (a, b) => parseStoryDate(b.date) - parseStoryDate(a.date)
  );

  // generates index used by ministories.js
  const indexPath = path.join(STORIES_DIR, "stories.json");

  await fs.writeFile(
    indexPath,
    JSON.stringify(storyIndex, null, 2),
    "utf8"
  );

  console.log(`Generated ${path.relative(ROOT, indexPath)}`);
  console.log(`Finished generating ${jsonFiles.length} story page(s).`);
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});


import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const STORIES_DIR = path.join(ROOT, "pages", "the-blog", "ministories");
const STATIC_DIR = path.join(ROOT, "static");

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

function getHeroFilename(value = "") {
    const filename = String(value).trim();

    if (!filename) return "";

    // accept fielname ONLY
    if (
        filename !== path.basename(filename) ||
        !/^[a-zA-Z0-9._-]+$/.test(filename) ||
        filename === "." ||
        filename === ".."
    ) {
        throw new Error(`Invalid hero image filename: ${filename}`);
    }

    return filename;
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

function renderHeroStyles(stories) {
    const rules = stories
        .filter(story => story.heroImage)
        .map(story => {
            const imagePath = `../assets/ministories/${story.heroImage}`;

            return `#hero-${story.slug}::before {
    background-image:
        linear-gradient(rgba(1, 1, 1, 0.4), rgba(1, 1, 1, 0.8)),
        url('${imagePath}');
}`;
        });

    return `/* Automatically generated. Do not edit manually. */

${rules.join("\n\n")}
`;
}

async function main() {
    const entries = await fs.readdir(STORIES_DIR, {
        withFileTypes: true
    });

    const jsonFiles = entries
        .filter(entry =>
            entry.isFile() &&
            entry.name.endsWith(".json") &&
            entry.name !== "ministories.json"
        )
        .sort((a, b) => a.name.localeCompare(b.name));

    const storyIndex = [];
    const heroStories = [];

    for (const entry of jsonFiles) {
        const jsonPath = path.join(STORIES_DIR, entry.name);

        const htmlPath = path.join(
            STORIES_DIR,
            `${path.basename(entry.name, ".json")}.html`
        );

        const story = JSON.parse(
            await fs.readFile(jsonPath, "utf8")
        );

        const slug = slugFromFilename(entry.name);
        const heroImage = getHeroFilename(story.hero_image || "");

        const html = renderStory(story, entry.name);

        await fs.writeFile(htmlPath, html, "utf8");

        console.log(`Generated ${path.relative(ROOT, htmlPath)}`);

        storyIndex.push({
            slug,
            title: story.title || "",
            date: story.date || "",
            excerpt: createExcerpt(story.content || "")
        });

        if (heroImage) {
            heroStories.push({ slug, heroImage });
        }
    }

    // sorts NEWEST
    storyIndex.sort(
        (a, b) => parseStoryDate(b.date) - parseStoryDate(a.date)
    );

    // generates the story listing index
    const indexPath = path.join(STORIES_DIR, "ministories.json");

    await fs.writeFile(
        indexPath,
        JSON.stringify(storyIndex, null, 2),
        "utf8"
    );

    console.log(`Generated ${path.relative(ROOT, indexPath)}`);

    // generates the story hero image css
    await fs.mkdir(STATIC_DIR, { recursive: true });

    const cssPath = path.join(STATIC_DIR, "ministories-heroes.css");

    await fs.writeFile(
        cssPath,
        renderHeroStyles(heroStories),
        "utf8"
    );

    console.log(`Generated ${path.relative(ROOT, cssPath)}`);
    console.log(`Finished generating ${jsonFiles.length} story page(s).`);
}

main().catch(error => {
    console.error(error);
    process.exitCode = 1;
});

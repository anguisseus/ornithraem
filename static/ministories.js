function getStoriesBasePath() {
    const segments = window.location.pathname.split('/').filter(Boolean);

    if (window.location.hostname.includes('github.io') && segments.length > 0) {
        return `/${segments[0]}/`;
    }

    return '/';
}

async function renderMiniStories() {
    const container = document.getElementById('dynamic-ministories-list');

    if (!container || container.dataset.loaded === 'true') return;

    container.dataset.loaded = 'true';

    const basePath = getStoriesBasePath();
    const indexUrl = `${basePath}pages/the-blog/ministories/ministories.json`;

    try {
        const response = await fetch(indexUrl);

        if (!response.ok) {
            throw new Error(`Could not load stories: ${response.status}`);
        }

        const stories = await response.json();

        container.replaceChildren();

        const column = document.createElement('article');
        column.className = 'column';

        stories.forEach(story => {
            const article = document.createElement('article');

            const heading = document.createElement('h2');
            const titleLink = document.createElement('a');
            titleLink.href = `#the-blog/ministories/${story.slug}`;
            titleLink.textContent = story.title;

            heading.appendChild(titleLink);

            const date = document.createElement('small');
            date.textContent = story.date;

            const excerpt = document.createElement('p');
            const italic = document.createElement('i');
            italic.textContent = story.excerpt;

            excerpt.appendChild(italic);

            const divider = document.createElement('hr');

            const continueLink = document.createElement('a');
            continueLink.className = 'card-link';
            continueLink.href = `#the-blog/ministories/${story.slug}`;
            continueLink.innerHTML =
                '<i class="fa-solid fa-arrow-up-right-from-square"></i> Continue reading...';

            article.append(
                heading,
                date,
                excerpt,
                divider,
                continueLink
            );

            column.appendChild(article);
        });

        container.appendChild(column);

    } catch (error) {
        console.error('Mini Stories:', error);
        container.dataset.loaded = 'false';
        container.textContent = 'Unable to load stories. Please try again later.';
    }
}

const miniStoriesObserver = new MutationObserver(() => {
    renderMiniStories();
});

miniStoriesObserver.observe(document.body, {
    childList: true,
    subtree: true
});

renderMiniStories();

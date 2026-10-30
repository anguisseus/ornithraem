
// GALLERY MANAGER

// { filename: 'Untitled195_20250930210826.png', category: '', date: 'September 30, 2025' },
// const ARTWORK_DATABASE = [
//     { filename: 'Untitled100_20250811204457.png', category: '', date: 'August 11, 2025' },
//     { filename: 'Untitled183_20250913193510.png', category: '', date: 'September 13, 2025' },
    

//     { filename: 'Untitled195_20250930210440.png', category: '', date: 'September 30, 2025' },
//     { filename: 'Untitled186_20250920113851.png', category: '', date: 'September 20, 2025' },
//     { filename: 'Untitled195_20250930210704.png', category: '', date: 'September 30, 2025' },
//     { filename: 'Untitled179_20250911210321.png', category: '', date: 'September 11, 2025' },
//     { filename: 'Untitled178_20250909162312.png', category: '', date: 'September 9, 2025' },
//     { filename: 'Untitled176_20250905153947.png', category: '', date: 'September 5, 2025' },
//     { filename: 'Untitled175_20250903162834.png', category: '', date: 'September 3, 2025' },
//     { filename: 'Untitled160_20250823022616.png', category: '', date: 'August 23, 2025' },
//     { filename: 'Untitled172_20250830133646.png', category: '', date: 'August 30, 2025' },
//     { filename: 'Untitled170_20250829151146.png', category: '', date: 'August 29, 2025' },
//     { filename: 'Untitled158_20250822114836.png', category: '', date: 'August 22, 2025' },
//     { filename: 'Untitled149_20250821210525.png', category: '', date: 'August 21, 2025' },
//     { filename: 'Untitled147_20250821103124.png', category: '', date: 'August 21, 2025' },
//     { filename: 'Untitled141_20250820100243.png', category: '', date: 'August 20, 2025' },
//     { filename: 'Untitled124_20250720153029.png', category: '', date: 'July 20, 2025' },
//     { filename: 'Untitled122_20250718172953.png', category: '', date: 'July 18, 2025' },
//     { filename: 'Untitled121_20250718000722.png', category: '', date: 'July 18, 2025' },
//     { filename: 'Untitled67_20250329203209.png', category: '', date: 'March 29, 2025' },
//     { filename: 'Untitled195_20250930210943.png', category: '', date: 'September 30, 2025' },
//     { filename: 'Untitled195_20250930211046.png', category: '', date: 'September 30, 2025' },
//     { filename: 'Untitled195.png', category: '', date: '2025' },
//     { filename: 'Untitled195_20250930211529.png', category: '', date: 'September 30, 2025' },
//     { filename: 'Untitled5_20241229130326.png', category: '', date: 'December 29, 2024' },
//     { filename: 'Untitled63_20250305201535.png', category: '', date: 'March 5, 2025' },
// ];

// FOR GITHUB PAGES
function getBasePath() {
    const pathSegments = window.location.pathname.split('/').filter(Boolean);
    if (window.location.hostname.includes('github.io') && pathSegments.length > 0) {
        return `/${pathSegments[0]}/`;
    }
    return '/';
}


// ARTWORK GALLERY MANAGER

let artworkLoadPromise = null;

// lightbox overlay spawns in DOM
function initLightbox() {
    if (document.getElementById('simple-lightbox')) return;

    const lightbox = document.createElement('div');
    lightbox.id = 'simple-lightbox';
    lightbox.style.cssText = `
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(17, 17, 17, 0.95);
        z-index: 99999;
        justify-content: center;
        align-items: center;
        flex-direction: column;
        cursor: pointer;
        padding: 30px;
        opacity: 0;
        transition: opacity 0.25s ease;
    `;

    lightbox.innerHTML = `
        <img id="lightbox-img" style="max-width: 90vw; max-height: 75vh; object-fit: contain; border-radius: 4px; box-shadow: 0 10px 30px rgba(0,0,0,0.8);" />
        <div id="lightbox-caption" style="color: #f9f9f9; margin-top: 15px; font-size: 22px; text-align: center; display: none;"></div>
    `;

    lightbox.addEventListener('click', () => {
        lightbox.style.opacity = '0';
        setTimeout(() => {
            lightbox.style.display = 'none';
        }, 250);
    });

    document.body.appendChild(lightbox);
}

function openLightbox(imgSrc, title) {
    initLightbox();
    const lightbox = document.getElementById('simple-lightbox');
    const img = document.getElementById('lightbox-img');
    const caption = document.getElementById('lightbox-caption');

    img.src = imgSrc;
    caption.textContent = title;

    lightbox.style.display = 'flex';
    requestAnimationFrame(() => {
        lightbox.style.opacity = '1';
    });
}

function getArtworkImagePath(filename, basePath) {
    const value = String(filename || '').trim();

    if (!value) return '';

    // CMS image field stores a media path such as /assets/artwork/image.png
    // SO GITHUB PAGES DOESNT MESS UP:
    const relativePath = value.replace(/^\/+/, '');

    if (!relativePath.startsWith('assets/artwork/')) {
        console.warn('Artwork image is outside assets/artwork:', value);
        return '';
    }

    return `${basePath}${relativePath}`;
}


async function renderArtworkGallery() {
    const grid = document.getElementById('dynamic-artwork-grid');
    if (!grid || grid.dataset.loaded === 'true') return; // prevent duplicate

    if (artworkLoadPromise) return artworkLoadPromise;

    artworkLoadPromise = (async () => {
        const basePath = getBasePath();
        const databaseUrl = `${basePath}assets/data/artwork.json`;

        try {
            const response = await fetch(databaseUrl);

            if (!response.ok) {
                throw new Error(`Could not load artwork database: ${response.status}`);
            }

            const artworkDatabase = await response.json();

            if (!Array.isArray(artworkDatabase)) {
                throw new Error('Artwork database must contain a JSON array.');
            }

            grid.replaceChildren();

            // newest first without modifying og JSON array
            artworkDatabase.slice().reverse().forEach(art => {
                if (!art.filename) return;

                const fullAssetPath = getArtworkImagePath(art.filename, basePath);
                if (!fullAssetPath) return;

                const baseName = art.filename
                    .split('/')
                    .pop()
                    .replace(/\.[^/.]+$/, '');

                const formattedTitle = baseName
                    .split('-')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ');

                let metaText = '';

                if (art.category && art.date) {
                    metaText = `${art.category} • ${art.date}`;
                } else if (art.category) {
                    metaText = art.category;
                } else if (art.date) {
                    metaText = art.date;
                }

                const figure = document.createElement('figure');
                figure.className = 'artwork-item';
                figure.dataset.full = fullAssetPath;
                figure.dataset.title = formattedTitle;
                figure.style.cursor = 'pointer';

                const imageWrapper = document.createElement('div');
                imageWrapper.className = 'artwork-image-wrapper';

                const image = document.createElement('img');
                image.src = fullAssetPath;
                image.alt = formattedTitle;
                image.loading = 'lazy';

                imageWrapper.appendChild(image);

                const figcaption = document.createElement('figcaption');

                const heading = document.createElement('h4');
                heading.style.display = 'none';
                heading.textContent = formattedTitle;

                figcaption.appendChild(heading);

                if (metaText) {
                    const metadata = document.createElement('small');
                    metadata.textContent = metaText;
                    figcaption.appendChild(metadata);
                }

                figure.append(imageWrapper, figcaption);

                figure.addEventListener('click', () => {
                    openLightbox(fullAssetPath, formattedTitle);
                });

                grid.appendChild(figure);
            });

            grid.dataset.loaded = 'true';

        } catch (error) {
            console.error('Artwork Gallery:', error);
            grid.textContent = 'Unable to load artwork. Please try again later.';
            artworkLoadPromise = null;
        }
    })();

    return artworkLoadPromise;
}

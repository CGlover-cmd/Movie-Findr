// ui.js

/**
 * Updates a poster on the setup screen.
 */
export function updateSetupPoster(elementId, movie) {
    const container = document.getElementById(elementId);
    container.innerHTML = `<img src="${movie.posterPath}" alt="${movie.title}" class="poster-rounded" title="${movie.title}">`;
}

/**
 * Transitions the UI from the setup screen to the active game board.
 * FIX #5: Also populates the goal poster thumbnail in the sticky header
 * so the player can always see what movie they're navigating toward.
 */
export function showGameBoard(targetMovie) {
    document.getElementById('setup-screen').classList.replace('active', 'hidden');
    document.getElementById('game-board').classList.replace('hidden', 'active');

    // Set the goal title text
    document.getElementById('target-title-display').textContent = targetMovie.title;

    // FIX #5: Set the goal poster thumbnail src and make it visible
    const goalPoster = document.getElementById('goal-poster-thumbnail');
    goalPoster.src = targetMovie.posterPath;
    goalPoster.alt = `${targetMovie.title} poster`;
    goalPoster.style.display = 'block';
}

/**
 * Creates a horizontal scrolling row for the vertical tree.
 * Each item gets a wrapper div containing the image tile and,
 * for person tiles, a name label beneath the face.
 *
 * FIX #4: The .person-name <p> element is explicitly created and appended
 * here. CSS ensures it is never clipped or hidden by parent overflow rules.
 */
export function createHorizontalRow(items, type, clickCallback) {
    const row = document.createElement('div');
    row.className = 'horizontal-row';

    items.forEach(item => {
        // Wrapper holds image + optional name label as a single clickable unit
        const wrapper = document.createElement('div');
        wrapper.className = 'tile-wrapper';

        // Image element — movie poster (rect) or actor headshot (circle)
        const tileImg = document.createElement('img');
        tileImg.className = type === 'movie' ? 'tile movie-tile' : 'tile person-tile';
        tileImg.src  = type === 'movie' ? item.posterPath : item.profilePath;
        tileImg.alt  = type === 'movie' ? item.title      : item.name;
        tileImg.title = type === 'movie' ? item.title     : item.name;

        wrapper.appendChild(tileImg);

        // FIX #4: Name label — only for person tiles, always rendered as a
        // block-level <p> so it cannot collapse to zero height.
        if (type === 'person') {
            const nameLabel = document.createElement('p');
            nameLabel.className = 'person-name';
            nameLabel.textContent = item.name;
            wrapper.appendChild(nameLabel);
        }

        // Click handler lives on the wrapper so the whole block (image + name) is tappable
        wrapper.addEventListener('click', () => {
            if (wrapper.classList.contains('dimmed')) return;
            dimSiblings(row, wrapper);
            clickCallback(item);
        });

        row.appendChild(wrapper);
    });

    document.getElementById('vertical-tree').appendChild(row);
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
}

/**
 * Dims all unselected tile wrappers in a row after a selection is made.
 */
function dimSiblings(rowElement, selectedWrapper) {
    const wrappers = rowElement.querySelectorAll('.tile-wrapper');
    wrappers.forEach(w => {
        if (w !== selectedWrapper) {
            w.classList.add('dimmed');
        }
    });
}

/**
 * Updates the sticky header stats.
 */
export function updateStats(steps, timer) {
    document.getElementById('step-display').textContent = steps;
    
    const minutes = String(Math.floor(timer / 60)).padStart(2, '0');
    const seconds = String(timer % 60).padStart(2, '0');
    document.getElementById('timer-display').textContent = `${minutes}:${seconds}`;
}

/**
 * Triggers the win visual effects.
 */
export function triggerWinVisuals() {
    const header = document.getElementById('game-header');
    header.classList.add('win-flash');
    
    // Trigger canvas-confetti if it's loaded in the HTML
    if (typeof confetti === 'function') {
        confetti({
            particleCount: 150,
            spread: 80,
            origin: { y: 0.1 }
        });
    }
}

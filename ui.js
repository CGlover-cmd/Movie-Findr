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
 */
export function showGameBoard(targetMovie) {
    document.getElementById('setup-screen').classList.replace('active', 'hidden');
    document.getElementById('game-board').classList.replace('hidden', 'active');
    document.getElementById('target-title-display').textContent = targetMovie.title;
}

/**
 * Creates a horizontal scrolling row for the vertical tree.
 */
export function createHorizontalRow(items, type, clickCallback) {
    const row = document.createElement('div');
    row.className = 'horizontal-row';

    items.forEach(item => {
        // Create a wrapper to hold both the image and the text
        const wrapper = document.createElement('div');
        wrapper.className = 'tile-wrapper';

        // Create the image element
        const tileImg = document.createElement('img');
        tileImg.className = type === 'movie' ? 'tile movie-tile' : 'tile person-tile';
        tileImg.src = type === 'movie' ? item.posterPath : item.profilePath;
        tileImg.alt = type === 'movie' ? item.title : item.name;
        tileImg.title = type === 'movie' ? item.title : item.name;

        wrapper.appendChild(tileImg);

        // If it's a person, add their name below the image
        if (type === 'person') {
            const nameLabel = document.createElement('p');
            nameLabel.className = 'person-name';
            nameLabel.textContent = item.name;
            wrapper.appendChild(nameLabel);
        }

        // Move the click event to the wrapper so the whole block is clickable
        wrapper.addEventListener('click', (event) => {
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
 * Dims all unselected elements in a row.
 */
function dimSiblings(rowElement, selectedTile) {
    // We now look for our new 'tile-wrapper' instead of just 'tile'
    const tiles = rowElement.querySelectorAll('.tile-wrapper');
    tiles.forEach(t => {
        if (t !== selectedTile) {
            t.classList.add('dimmed');
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

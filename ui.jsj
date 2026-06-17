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
        const tile = document.createElement('img');
        tile.className = type === 'movie' ? 'tile movie-tile' : 'tile person-tile';
        tile.src = type === 'movie' ? item.posterPath : item.profilePath;
        tile.alt = type === 'movie' ? item.title : item.name;
        tile.title = type === 'movie' ? item.title : item.name;

        tile.addEventListener('click', (event) => {
            // Prevent clicking if already dimmed
            if (tile.classList.contains('dimmed')) return;
            
            dimSiblings(row, tile);
            clickCallback(item);
        });

        row.appendChild(tile);
    });

    document.getElementById('vertical-tree').appendChild(row);
    // Auto-scroll to the bottom as the tree grows
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
}

/**
 * Dims all unselected elements in a row.
 */
function dimSiblings(rowElement, selectedTile) {
    const tiles = rowElement.querySelectorAll('.tile');
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

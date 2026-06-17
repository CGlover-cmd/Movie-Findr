// game.js
import { getRandomMovies, getMovieCast, getPersonMovies, getGenreList } from './api.js';
import * as UI from './ui.js';

// ─────────────────────────────────────────────────────────────────────────────
// GAME STATE
// ─────────────────────────────────────────────────────────────────────────────

let gameState = 'setup'; // 'setup' | 'playing' | 'won'
let startMovie  = null;
let targetMovie = null;
let steps  = 0;
let timer  = 0;
let timerInterval = null;

// ─────────────────────────────────────────────────────────────────────────────
// FILTER STATE
// Mirrors the values the user has set in the filter panel.
// null / empty means "no filter applied" for that field.
// ─────────────────────────────────────────────────────────────────────────────

let activeFilters = {
    yearMin:   null,
    yearMax:   null,
    genreIds:  [],       // array of TMDb genre IDs (numbers)
    language:  '',
    minRating: 0,
    sortBy:    'popularity.desc'
};

// Tracks which genre pills are currently selected (Set of genre ID numbers)
const selectedGenreIds = new Set();

// ─────────────────────────────────────────────────────────────────────────────
// FILTER PANEL — INITIALISE GENRES
// Fetch the TMDb genre list and render pill buttons dynamically so we never
// have a hardcoded list that can go stale.
// ─────────────────────────────────────────────────────────────────────────────

async function initGenrePills() {
    const genres = await getGenreList();
    const container = document.getElementById('genre-pill-container');
    container.innerHTML = ''; // clear "Loading…" placeholder

    genres.forEach(genre => {
        const pill = document.createElement('button');
        pill.className   = 'genre-pill';
        pill.textContent = genre.name;
        pill.dataset.id  = genre.id;

        pill.addEventListener('click', () => {
            const id = Number(genre.id);
            if (selectedGenreIds.has(id)) {
                selectedGenreIds.delete(id);
                pill.classList.remove('active');
            } else {
                selectedGenreIds.add(id);
                pill.classList.add('active');
            }
        });

        container.appendChild(pill);
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// FILTER PANEL — TOGGLE OPEN / CLOSE
// ─────────────────────────────────────────────────────────────────────────────

document.getElementById('filter-toggle-btn').addEventListener('click', () => {
    const panel = document.getElementById('filter-panel');
    panel.classList.toggle('hidden');
});

// ─────────────────────────────────────────────────────────────────────────────
// FILTER PANEL — RATING SLIDER LIVE LABEL
// ─────────────────────────────────────────────────────────────────────────────

document.getElementById('filter-rating').addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    document.getElementById('rating-value-display').textContent =
        val === 0 ? 'Any' : `${val.toFixed(1)}+`;
});

// ─────────────────────────────────────────────────────────────────────────────
// FILTER PANEL — APPLY
// Reads all control values, writes them into activeFilters, refreshes movies.
// ─────────────────────────────────────────────────────────────────────────────

document.getElementById('filter-apply-btn').addEventListener('click', async () => {
    const yearMin   = parseInt(document.getElementById('filter-year-min').value)  || null;
    const yearMax   = parseInt(document.getElementById('filter-year-max').value)  || null;
    const language  = document.getElementById('filter-language').value;
    const minRating = parseFloat(document.getElementById('filter-rating').value)  || 0;
    const sortBy    = document.getElementById('filter-sort').value;

    activeFilters = {
        yearMin,
        yearMax,
        genreIds:  [...selectedGenreIds],
        language,
        minRating,
        sortBy
    };

    // Show the active-filter dot on the toggle button
    updateFilterBadge();

    // Collapse the panel and re-fetch both movies with the new filters
    document.getElementById('filter-panel').classList.add('hidden');
    await reloadSetupMovies();
});

// ─────────────────────────────────────────────────────────────────────────────
// FILTER PANEL — CLEAR
// Resets every control and the activeFilters object, then re-fetches.
// ─────────────────────────────────────────────────────────────────────────────

document.getElementById('filter-clear-btn').addEventListener('click', async () => {
    // Reset all controls
    document.getElementById('filter-year-min').value = '';
    document.getElementById('filter-year-max').value = '';
    document.getElementById('filter-language').value = '';
    document.getElementById('filter-rating').value   = 0;
    document.getElementById('filter-sort').value     = 'popularity.desc';
    document.getElementById('rating-value-display').textContent = 'Any';

    // Deselect all genre pills
    selectedGenreIds.clear();
    document.querySelectorAll('.genre-pill.active').forEach(p => p.classList.remove('active'));

    // Reset state
    activeFilters = {
        yearMin: null, yearMax: null, genreIds: [],
        language: '', minRating: 0, sortBy: 'popularity.desc'
    };

    updateFilterBadge();
    await reloadSetupMovies();
});

// ─────────────────────────────────────────────────────────────────────────────
// FILTER BADGE — shows a dot on the toggle button when filters are active
// ─────────────────────────────────────────────────────────────────────────────

function updateFilterBadge() {
    const badge = document.getElementById('filter-active-badge');
    const isActive = (
        activeFilters.yearMin ||
        activeFilters.yearMax ||
        activeFilters.genreIds.length > 0 ||
        activeFilters.language ||
        activeFilters.minRating > 0 ||
        activeFilters.sortBy !== 'popularity.desc'
    );
    badge.classList.toggle('hidden', !isActive);
}

// ─────────────────────────────────────────────────────────────────────────────
// SETUP — fetch and display both poster slots using activeFilters
// ─────────────────────────────────────────────────────────────────────────────

async function reloadSetupMovies() {
    const startBtn = document.getElementById('start-game-btn');
    startBtn.textContent = 'Loading Movies…';
    startBtn.disabled = true;

    const movies = await getRandomMovies(2, activeFilters);
    if (movies.length < 2) {
        startBtn.textContent = 'No results — try different filters';
        return;
    }

    startMovie  = movies[0];
    targetMovie = movies[1];

    UI.updateSetupPoster('start-movie-display',  startMovie);
    UI.updateSetupPoster('target-movie-display', targetMovie);

    startBtn.textContent = 'Start Game';
    startBtn.disabled = false;
}

// ─────────────────────────────────────────────────────────────────────────────
// REDRAW BUTTONS — respect active filters
// ─────────────────────────────────────────────────────────────────────────────

document.getElementById('redraw-start-btn').addEventListener('click', async () => {
    const newMovies = await getRandomMovies(1, activeFilters);
    if (newMovies.length) {
        startMovie = newMovies[0];
        UI.updateSetupPoster('start-movie-display', startMovie);
    }
});

document.getElementById('redraw-target-btn').addEventListener('click', async () => {
    const newMovies = await getRandomMovies(1, activeFilters);
    if (newMovies.length) {
        targetMovie = newMovies[0];
        UI.updateSetupPoster('target-movie-display', targetMovie);
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// GAME LOOP
// ─────────────────────────────────────────────────────────────────────────────

document.getElementById('start-game-btn').addEventListener('click', startGame);

async function startGame() {
    gameState = 'playing';
    UI.showGameBoard(targetMovie);

    timerInterval = setInterval(() => {
        timer++;
        UI.updateStats(steps, timer);
    }, 1000);

    // Render the starting movie tile (not clickable — it's the root node)
    UI.createHorizontalRow([startMovie], 'movie', () => {});

    // Automatically load and display the starting movie's cast
    await handleMovieSelection(startMovie);
}

async function handleMovieSelection(movie) {
    if (gameState !== 'playing') return;

    if (movie.id === targetMovie.id) {
        handleWin();
        return;
    }

    const cast = await getMovieCast(movie.id);
    UI.createHorizontalRow(cast, 'person', handlePersonSelection);
}

async function handlePersonSelection(person) {
    if (gameState !== 'playing') return;

    steps++;
    UI.updateStats(steps, timer);

    const movies = await getPersonMovies(person.id);
    UI.createHorizontalRow(movies, 'movie', handleMovieSelection);
}

// ─────────────────────────────────────────────────────────────────────────────
// WIN
// ─────────────────────────────────────────────────────────────────────────────

function handleWin() {
    gameState = 'won';
    clearInterval(timerInterval);
    UI.triggerWinVisuals();
}

// ─────────────────────────────────────────────────────────────────────────────
// BOOT
// ─────────────────────────────────────────────────────────────────────────────

// Fetch genre pills in parallel with the first movie load
initGenrePills();
reloadSetupMovies();

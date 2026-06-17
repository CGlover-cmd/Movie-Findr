// game.js
import { getRandomMovies, getMovieCast, getPersonMovies } from './api.js';
import * as UI from './ui.js';

// --- Game State ---
let gameState = 'setup'; // 'setup', 'playing', 'won'
let startMovie = null;
let targetMovie = null;
let steps = 0;
let timer = 0;
let timerInterval = null;

// --- Setup Phase ---
async function initializeSetup() {
    const movies = await getRandomMovies(2);
    if (movies.length < 2) {
        alert("Failed to load initial movies from TMDb.");
        return;
    }

    startMovie = movies[0];
    targetMovie = movies[1];

    UI.updateSetupPoster('start-movie-display', startMovie);
    UI.updateSetupPoster('target-movie-display', targetMovie);
    
    const startBtn = document.getElementById('start-game-btn');
    startBtn.textContent = "Start Game";
    startBtn.disabled = false;
}

// Handle Redraw Buttons
document.getElementById('redraw-start-btn').addEventListener('click', async () => {
    const newMovies = await getRandomMovies(1);
    startMovie = newMovies[0];
    UI.updateSetupPoster('start-movie-display', startMovie);
});

document.getElementById('redraw-target-btn').addEventListener('click', async () => {
    const newMovies = await getRandomMovies(1);
    targetMovie = newMovies[0];
    UI.updateSetupPoster('target-movie-display', targetMovie);
});

// --- Game Loop Phase ---
document.getElementById('start-game-btn').addEventListener('click', startGame);

async function startGame() {
    gameState = 'playing';
    UI.showGameBoard(targetMovie);
    
    // Start Timer
    timerInterval = setInterval(() => {
        timer++;
        UI.updateStats(steps, timer);
    }, 1000);

    // Initialize the first row (Starting Movie)
    UI.createHorizontalRow([startMovie], 'movie', () => {}); // No click action on the root movie
    
    // Automatically fetch and display the cast for the starting movie
    await handleMovieSelection(startMovie);
}

async function handleMovieSelection(movie) {
    if (gameState !== 'playing') return;

    // Check Win Condition
    if (movie.id === targetMovie.id) {
        handleWin();
        return;
    }

    // Fetch and render Cast Row
    const cast = await getMovieCast(movie.id);
    UI.createHorizontalRow(cast, 'person', handlePersonSelection);
}

async function handlePersonSelection(person) {
    if (gameState !== 'playing') return;

    steps++;
    UI.updateStats(steps, timer);

    // Fetch and render Movie Row
    const movies = await getPersonMovies(person.id);
    UI.createHorizontalRow(movies, 'movie', handleMovieSelection);
}

// --- Win Phase ---
function handleWin() {
    gameState = 'won';
    clearInterval(timerInterval);
    UI.triggerWinVisuals();
}

// Boot up the setup screen on load
initializeSetup();

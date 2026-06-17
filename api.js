// api.js

// TODO: Paste your Google Cloud Endpoint URL inside the quotes below
const PROXY_URL = 'https://tmdbproxy-56683831058.us-central1.run.app/';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w200'; 

/**
 * Helper function to handle standard fetch requests to your Google Cloud Middleman
 */
async function fetchFromProxy(endpoint) {
    try {
        // We pass the desired TMDb path to Google as a query parameter
        const response = await fetch(`${PROXY_URL}?endpoint=${encodeURIComponent(endpoint)}`);
        if (!response.ok) {
            throw new Error(`Proxy Error: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Failed to fetch data:", error);
        return null;
    }
}

/**
 * Returns the full image URL or a placeholder if no image exists
 */
export function getImageUrl(path) {
    if (!path) return 'https://via.placeholder.com/200x300?text=No+Image';
    return `${IMAGE_BASE_URL}${path}`;
}

/**
 * Fetches a random page of popular movies.
 * FIX #3: Pages 1–5 correspond to the top ~100 most recognized films on TMDb,
 * keeping the starting/target movies familiar to most players.
 * (Previously was pages 1–50, pulling in many obscure/unknown titles.)
 */
export async function getRandomMovies(count = 2) {
    const randomPage = Math.floor(Math.random() * 5) + 1;
    const data = await fetchFromProxy(`/movie/popular?page=${randomPage}`);
    
    if (!data || !data.results) return [];

    const shuffled = data.results.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count).map(movie => ({
        id: movie.id,
        title: movie.title,
        posterPath: getImageUrl(movie.poster_path)
    }));
}

/**
 * Fetches the cast for a specific movie ID.
 * Returns up to 20 billed cast members (up from 15) to give players
 * more connection options per film.
 */
export async function getMovieCast(movieId) {
    const data = await fetchFromProxy(`/movie/${movieId}/credits`);
    if (!data || !data.cast) return [];

    return data.cast.slice(0, 20).map(person => ({
        id: person.id,
        name: person.name,
        character: person.character,
        profilePath: getImageUrl(person.profile_path)
    }));
}

/**
 * Fetches the FULL filmography for a specific person ID.
 * FIX #2: Merges both the 'cast' array (acting roles) and the 'crew' array
 * (directing, producing, writing, etc.) from TMDb, then deduplicates
 * by movie ID so the same film doesn't appear twice. Sorted by
 * popularity descending so the most recognizable titles appear first.
 * (Previously only read data.cast and capped at 15 items.)
 */
export async function getPersonMovies(personId) {
    const data = await fetchFromProxy(`/person/${personId}/movie_credits`);
    if (!data) return [];

    // Combine acting credits and crew credits into one pool
    const castCredits = data.cast || [];
    const crewCredits = data.crew || [];
    const allCredits = [...castCredits, ...crewCredits];

    // Deduplicate by movie ID — a person can appear as both actor and director
    const seen = new Set();
    const uniqueMovies = allCredits.filter(movie => {
        if (seen.has(movie.id)) return false;
        seen.add(movie.id);
        return true;
    });

    // Sort by TMDb popularity score so well-known films bubble to the top
    uniqueMovies.sort((a, b) => b.popularity - a.popularity);

    return uniqueMovies.map(movie => ({
        id: movie.id,
        title: movie.title,
        posterPath: getImageUrl(movie.poster_path)
    }));
}

// api.js

// TODO: Replace with your actual TMDb API Key
const API_KEY = 'YOUR_TMDB_API_KEY_HERE';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w200'; // w200 is a good optimized size for tiles

/**
 * Helper function to handle standard fetch requests to TMDb
 */
async function fetchFromTMDb(endpoint, params = '') {
    try {
        const response = await fetch(`${BASE_URL}${endpoint}?api_key=${API_KEY}&language=en-US${params}`);
        if (!response.ok) {
            throw new Error(`TMDb API Error: ${response.status}`);
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
    if (!path) return 'https://via.placeholder.com/200x300?text=No+Image'; // Fallback image
    return `${IMAGE_BASE_URL}${path}`;
}

/**
 * Fetches a random page of popular movies to simulate our "Top 1000" list
 */
export async function getRandomMovies(count = 2) {
    // TMDb allows page 1-500. Let's pick a random page from the top 50 to ensure recognizable movies.
    const randomPage = Math.floor(Math.random() * 50) + 1;
    const data = await fetchFromTMDb('/movie/popular', `&page=${randomPage}`);
    
    if (!data || !data.results) return [];

    // Shuffle the results and grab the requested amount
    const shuffled = data.results.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count).map(movie => ({
        id: movie.id,
        title: movie.title,
        posterPath: getImageUrl(movie.poster_path)
    }));
}

/**
 * Fetches the cast and crew for a specific movie ID
 */
export async function getMovieCast(movieId) {
    const data = await fetchFromTMDb(`/movie/${movieId}/credits`);
    if (!data || !data.cast) return [];

    // Return the top 15 billed actors to keep the UI clean
    return data.cast.slice(0, 15).map(person => ({
        id: person.id,
        name: person.name,
        character: person.character,
        profilePath: getImageUrl(person.profile_path)
    }));
}

/**
 * Fetches the filmography (movies) for a specific person ID
 */
export async function getPersonMovies(personId) {
    const data = await fetchFromTMDb(`/person/${personId}/movie_credits`);
    if (!data || !data.cast) return [];

    // Sort by popularity to show their most known movies first, limit to 15
    const sortedMovies = data.cast.sort((a, b) => b.popularity - a.popularity);
    
    return sortedMovies.slice(0, 15).map(movie => ({
        id: movie.id,
        title: movie.title,
        posterPath: getImageUrl(movie.poster_path)
    }));
}

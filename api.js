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
 * Fetches a random page of popular movies
 */
export async function getRandomMovies(count = 2) {
    const randomPage = Math.floor(Math.random() * 50) + 1;
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
 * Fetches the cast for a specific movie ID
 */
export async function getMovieCast(movieId) {
    const data = await fetchFromProxy(`/movie/${movieId}/credits`);
    if (!data || !data.cast) return [];

    return data.cast.slice(0, 15).map(person => ({
        id: person.id,
        name: person.name,
        character: person.character,
        profilePath: getImageUrl(person.profile_path)
    }));
}

/**
 * Fetches the filmography for a specific person ID
 */
export async function getPersonMovies(personId) {
    const data = await fetchFromProxy(`/person/${personId}/movie_credits`);
    if (!data || !data.cast) return [];

    const sortedMovies = data.cast.sort((a, b) => b.popularity - a.popularity);
    
    return sortedMovies.slice(0, 15).map(movie => ({
        id: movie.id,
        title: movie.title,
        posterPath: getImageUrl(movie.poster_path)
    }));
}

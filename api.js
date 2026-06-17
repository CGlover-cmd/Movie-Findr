// api.js

const PROXY_URL = 'https://tmdbproxy-56683831058.us-central1.run.app/';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w200';

// ─────────────────────────────────────────────────────────────────────────────
// CORE FETCH HELPER
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Sends a request through the Google Cloud proxy.
 * The proxy forwards the `endpoint` query param to TMDb and returns raw JSON.
 */
async function fetchFromProxy(endpoint) {
    try {
        const response = await fetch(`${PROXY_URL}?endpoint=${encodeURIComponent(endpoint)}`);
        if (!response.ok) throw new Error(`Proxy Error: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error('Failed to fetch data:', error);
        return null;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// IMAGE HELPER
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns the full TMDb image URL, or a grey placeholder if no path exists.
 */
export function getImageUrl(path) {
    if (!path) return 'https://via.placeholder.com/200x300?text=No+Image';
    return `${IMAGE_BASE_URL}${path}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// GENRE LIST
// Fetched once on load and used to build the genre pill buttons in the UI.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetches the full list of TMDb movie genres.
 * Returns an array of { id, name } objects.
 */
export async function getGenreList() {
    const data = await fetchFromProxy('/genre/movie/list');
    if (!data || !data.genres) return [];
    return data.genres; // e.g. [{ id: 28, name: "Action" }, ...]
}

// ─────────────────────────────────────────────────────────────────────────────
// FILTER-AWARE MOVIE FETCH
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Builds a TMDb query string from the active filter state object.
 *
 * Filter object shape (all fields optional):
 * {
 *   yearMin:    number | null,   // primary_release_date.gte  (YYYY-01-01)
 *   yearMax:    number | null,   // primary_release_date.lte  (YYYY-12-31)
 *   genreIds:   number[],        // with_genres (comma-joined)
 *   language:   string,          // with_original_language (ISO 639-1 code)
 *   minRating:  number,          // vote_average.gte
 *   sortBy:     string,          // sort_by (TMDb sort key)
 * }
 *
 * When no filters are set the function falls back to /movie/popular (pages 1–5)
 * so the experience is unchanged for users who skip the filter panel.
 * When any filter IS set, we use /discover/movie which supports all parameters.
 */
function buildDiscoverParams(filters, page) {
    const params = new URLSearchParams();

    params.set('page', page);
    params.set('sort_by', filters.sortBy || 'popularity.desc');

    // Require at least 100 votes so low-count films don't skew rating filters
    params.set('vote_count.gte', '100');

    if (filters.yearMin) params.set('primary_release_date.gte', `${filters.yearMin}-01-01`);
    if (filters.yearMax) params.set('primary_release_date.lte', `${filters.yearMax}-12-31`);
    if (filters.genreIds && filters.genreIds.length > 0) params.set('with_genres', filters.genreIds.join(','));
    if (filters.language)  params.set('with_original_language', filters.language);
    if (filters.minRating && filters.minRating > 0) params.set('vote_average.gte', filters.minRating);

    return params.toString();
}

/**
 * Returns true if the filters object contains at least one active filter,
 * meaning we should use /discover/movie instead of /movie/popular.
 */
function hasActiveFilters(filters) {
    if (!filters) return false;
    return (
        filters.yearMin ||
        filters.yearMax ||
        (filters.genreIds && filters.genreIds.length > 0) ||
        filters.language ||
        (filters.minRating && filters.minRating > 0) ||
        (filters.sortBy && filters.sortBy !== 'popularity.desc')
    );
}

/**
 * Fetches `count` random movies, respecting any active filters.
 *
 * Without filters:  picks a random page from /movie/popular (pages 1–5).
 * With filters:     uses /discover/movie with a random page (1–10) so
 *                   results vary across sessions within the filtered pool.
 *
 * @param {number} count   - How many movies to return (usually 1 or 2).
 * @param {object} filters - Active filter state from game.js (may be null).
 */
export async function getRandomMovies(count = 2, filters = null) {
    let data;

    if (hasActiveFilters(filters)) {
        // ── Filtered path: use /discover/movie ───────────────────────────
        // Randomise across up to 10 pages of results so repeated redraws
        // don't always return the same films.
        const randomPage = Math.floor(Math.random() * 10) + 1;
        const queryString = buildDiscoverParams(filters, randomPage);
        data = await fetchFromProxy(`/discover/movie?${queryString}`);
    } else {
        // ── Default path: top popular movies, pages 1–5 ──────────────────
        const randomPage = Math.floor(Math.random() * 5) + 1;
        data = await fetchFromProxy(`/movie/popular?page=${randomPage}`);
    }

    if (!data || !data.results) return [];

    const shuffled = data.results.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count).map(movie => ({
        id: movie.id,
        title: movie.title,
        posterPath: getImageUrl(movie.poster_path)
    }));
}

// ─────────────────────────────────────────────────────────────────────────────
// CAST & FILMOGRAPHY
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetches up to 20 billed cast members for a given movie ID.
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
 * Fetches the full filmography for a person — acting AND crew credits merged,
 * deduplicated by movie ID, sorted by popularity descending.
 */
export async function getPersonMovies(personId) {
    const data = await fetchFromProxy(`/person/${personId}/movie_credits`);
    if (!data) return [];

    const castCredits = data.cast || [];
    const crewCredits = data.crew || [];
    const allCredits  = [...castCredits, ...crewCredits];

    // Deduplicate — a person can appear as both actor and director
    const seen = new Set();
    const uniqueMovies = allCredits.filter(movie => {
        if (seen.has(movie.id)) return false;
        seen.add(movie.id);
        return true;
    });

    uniqueMovies.sort((a, b) => b.popularity - a.popularity);

    return uniqueMovies.map(movie => ({
        id: movie.id,
        title: movie.title,
        posterPath: getImageUrl(movie.poster_path)
    }));
}

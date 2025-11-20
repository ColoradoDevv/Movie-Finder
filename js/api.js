import { apiKey, apiUrl } from './config.js';

let isLoading = false;

export async function fetchFromAPI(endpoint) {
    if (isLoading) return null;
    isLoading = true;

    const separator = endpoint.includes('?') ? '&' : '?';
    const url = `${apiUrl}/${endpoint}${separator}api_key=${apiKey}&language=es-ES`;
    
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Error: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error('Error API:', error);
        return null;
    } finally {
        isLoading = false;
    }
}

export async function loadGenres() {
    return await fetchFromAPI('genre/movie/list');
}

export async function getMovies(endpoint, page = 1) {
    const pageQuery = `${endpoint}${endpoint.includes('?') ? '&' : '?'}page=${page}`;
    return await fetchFromAPI(pageQuery);
}

export async function getMovieDetails(movieId) {
    return await fetchFromAPI(`movie/${movieId}?append_to_response=credits,videos,watch/providers,keywords,reviews,similar`);
}
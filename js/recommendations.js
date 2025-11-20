import { fetchFromAPI } from './api.js';
import { displayRecommendedMovie } from './ui.js';
import { showLoader, hideLoader } from './utils.js';

export let currentRecommendedMovie = null;

export async function getRandomMovie() {
    const genreId = document.getElementById('recommendation-genre').value;
    const endpoint = genreId ? `discover/movie?with_genres=${genreId}&sort_by=vote_average.desc&vote_count.gte=100` : 'movie/top_rated';
    
    showLoader();
    const data = await fetchFromAPI(endpoint);
    hideLoader();

    if (data && data.results && data.results.length > 0) {
        // Se elige un índice aleatorio de las primeras páginas (20 resultados)
        const randomIndex = Math.floor(Math.random() * Math.min(20, data.results.length));
        currentRecommendedMovie = data.results[randomIndex];
        displayRecommendedMovie(currentRecommendedMovie);
    }
}
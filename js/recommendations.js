import { fetchFromAPI } from './api.js';
import { displayRecommendedMovie } from './ui.js';
import { showLoader, hideLoader } from './utils.js';

export let currentRecommendedMovie = null;

export async function getRandomMovie() {
    const genreId = document.getElementById('recommendation-genre').value;
    
    // CORREGIDO: sort_by en lugar de sortby, y parámetros válidos
    const endpoint = genreId 
        ? `discover/movie?with_genres=${genreId}&sort_by=vote_average.desc&vote_count.gte=500`
        : 'movie/top_rated';
    
    showLoader();
    const data = await fetchFromAPI(endpoint);
    hideLoader();

    if (data && data.results && data.results.length > 0) {
        // Elige un índice aleatorio
        const randomIndex = Math.floor(Math.random() * Math.min(20, data.results.length));
        currentRecommendedMovie = data.results[randomIndex];
        displayRecommendedMovie(currentRecommendedMovie);
    } else {
        alert('No se pudo obtener una recomendación. Intenta de nuevo.');
    }
}
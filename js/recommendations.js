import { fetchFromAPI } from './api.js';
import { displayRecommendedMovie } from './ui.js';
import { showLoader, hideLoader } from './utils.js';
import { recommendationsLogger } from './logger.js';

export let currentRecommendedMovie = null;

// Historial de películas recomendadas (máximo 50) - AHORA PERSISTENTE
const MAX_HISTORY = 50;
const STORAGE_KEY = 'moviefinder_recommendation_history';

recommendationsLogger.info('🎲 Módulo de recomendaciones inicializado');
recommendationsLogger.debug(`Historial máximo: ${MAX_HISTORY} películas`);

/**
 * Obtiene el historial de recomendaciones desde localStorage
 */
function getRecommendationHistory() {
    try {
        const history = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        recommendationsLogger.debug(`📖 Historial cargado: ${history.length} películas`);
        return history;
    } catch (error) {
        recommendationsLogger.error('Error al cargar historial:', error);
        return [];
    }
}

/**
 * Guarda el historial de recomendaciones en localStorage
 */
function saveRecommendationHistory(history) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
        recommendationsLogger.debug(`💾 Historial guardado: ${history.length} películas`);
    } catch (error) {
        recommendationsLogger.error('Error al guardar historial:', error);
    }
}

/**
 * Obtiene una película aleatoria basada en criterios de calidad
 */
export async function getRandomMovie() {
    const genreId = document.getElementById('recommendation-genre').value;
    const genreName = genreId 
        ? document.getElementById('recommendation-genre').selectedOptions[0].text
        : 'Cualquier género';
    
    recommendationsLogger.info(`🎬 Solicitando recomendación de: ${genreName}`);
    
    // Usar múltiples páginas aleatorias para mayor variedad
    const randomPage = Math.floor(Math.random() * 5) + 1;
    recommendationsLogger.debug(`Página aleatoria seleccionada: ${randomPage}`);
    
    const endpoint = genreId 
        ? `discover/movie?with_genres=${genreId}&sort_by=vote_average.desc&vote_count.gte=500&page=${randomPage}`
        : `movie/top_rated?page=${randomPage}`;
    
    showLoader();
    const data = await fetchFromAPI(endpoint);
    hideLoader();

    if (!data || !data.results || data.results.length === 0) {
        recommendationsLogger.error('No se pudieron obtener películas para recomendar');
        alert('No se pudo obtener una recomendación. Intenta de nuevo.');
        return;
    }

    recommendationsLogger.info(`📊 ${data.results.length} candidatos disponibles`);
    
    // Obtener historial persistente
    let recommendedHistory = getRecommendationHistory();
    recommendationsLogger.debug(`Historial actual: ${recommendedHistory.length} películas`);

    // Filtrar películas que ya fueron recomendadas recientemente
    const availableMovies = data.results.filter(
        movie => !recommendedHistory.includes(movie.id)
    );

    const moviesToChooseFrom = availableMovies.length > 0 ? availableMovies : data.results;
    
    if (availableMovies.length === 0) {
        recommendationsLogger.warn('⚠️ Todas las películas ya fueron mostradas, limpiando historial');
        recommendedHistory = [];
        saveRecommendationHistory([]);
    } else {
        recommendationsLogger.debug(`${availableMovies.length} películas no vistas disponibles`);
    }
    
    // Seleccionar película aleatoria
    const randomIndex = Math.floor(Math.random() * moviesToChooseFrom.length);
    currentRecommendedMovie = moviesToChooseFrom[randomIndex];

    recommendationsLogger.success(`✓ Película seleccionada: "${currentRecommendedMovie.title}"`);
    recommendationsLogger.debug('Detalles de la recomendación:', {
        id: currentRecommendedMovie.id,
        título: currentRecommendedMovie.title,
        puntuación: currentRecommendedMovie.vote_average,
        año: currentRecommendedMovie.release_date
    });

    // Agregar al historial
    recommendedHistory.push(currentRecommendedMovie.id);
    
    // Mantener solo las últimas MAX_HISTORY películas
    if (recommendedHistory.length > MAX_HISTORY) {
        const removed = recommendedHistory.shift();
        recommendationsLogger.debug(`Película ID ${removed} removida del historial (límite alcanzado)`);
    }

    // Guardar historial persistente
    saveRecommendationHistory(recommendedHistory);
    recommendationsLogger.info(`📝 Historial actualizado y guardado: ${recommendedHistory.length}/${MAX_HISTORY}`);

    displayRecommendedMovie(currentRecommendedMovie);
}

/**
 * Resetea el historial de recomendaciones
 */
export function resetRecommendationHistory() {
    const previousCount = getRecommendationHistory().length;
    saveRecommendationHistory([]);
    recommendationsLogger.info(`🔄 Historial reseteado (${previousCount} películas eliminadas)`);
}

// Inicialización: Log del estado inicial
const initialHistory = getRecommendationHistory();
recommendationsLogger.info(`📊 Estado inicial: ${initialHistory.length} películas en historial`);
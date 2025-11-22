import { imageBaseUrl } from './config.js';
import { isFavorite, isWatched } from './storage.js';
import { formatDate, resultsGrid } from './utils.js';
import { uiLogger } from './logger.js';

uiLogger.info('🎨 Módulo UI inicializado');

export function createMovieCard(movie) {
    if (!movie || !movie.id) {
        uiLogger.error('Datos de película inválidos:', movie);
        return null;
    }

    uiLogger.debug(`Creando tarjeta para: "${movie.title}" (ID: ${movie.id})`);

    const card = document.createElement('div');
    card.className = 'movie-card';
    card.dataset.movieId = movie.id;

    // Iconos SVG para favoritos y vistas
    const favoriteIcon = `<svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
    </svg>`;
    
    const watchedIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" width="12" height="12">
        <polyline points="20 6 9 17 4 12"></polyline>
    </svg>`;

    const favoriteMark = isFavorite(movie.id) ? `<span class="movie-status" style="color: #e50914;">${favoriteIcon}</span>` : '';
    const watchedMark = isWatched(movie.id) ? `<span class="movie-status" style="color: #46d369;">${watchedIcon}</span>` : '';
    
    // Validación de vote_average
    const voteAverage = (movie.vote_average && movie.vote_average > 0) 
        ? movie.vote_average.toFixed(1) 
        : 'N/A';

    // Validación de imagen
    const posterUrl = movie.poster_path 
        ? imageBaseUrl + movie.poster_path 
        : 'https://via.placeholder.com/500x750/1f1f1f/808080?text=Sin+Poster';

    card.innerHTML = `
        ${favoriteMark}${watchedMark}
        <img src="${posterUrl}" alt="${movie.title || 'Película sin título'}" loading="lazy">
        <div class="movie-info">
            <h3>${movie.title || 'Sin título'}</h3>
            <p>${voteAverage} · ${formatDate(movie.release_date)}</p>
        </div>
    `;
    
    uiLogger.debug(`✓ Tarjeta creada: "${movie.title}"`);
    return card;
}

export function displayMovies(movies) {
    if (!Array.isArray(movies) || movies.length === 0) {
        uiLogger.warn('No hay películas para mostrar');
        return;
    }

    uiLogger.info(`📋 Renderizando ${movies.length} películas...`);
    uiLogger.time('Renderizado de películas');

    const fragment = document.createDocumentFragment();
    let successCount = 0;
    let errorCount = 0;
    
    movies.forEach(movie => {
        const card = createMovieCard(movie);
        if (card) {
            fragment.appendChild(card);
            successCount++;
        } else {
            errorCount++;
        }
    });
    
    resultsGrid.appendChild(fragment);
    
    uiLogger.timeEnd('Renderizado de películas');
    uiLogger.success(`✓ ${successCount} tarjetas renderizadas exitosamente`);
    
    if (errorCount > 0) {
        uiLogger.warn(`⚠️ ${errorCount} tarjetas fallaron al renderizar`);
    }
}

export function displayRecommendedMovie(movie) {
    if (!movie) {
        uiLogger.error('No se puede mostrar recomendación: película inválida');
        return;
    }

    uiLogger.info(`🎲 Mostrando recomendación: "${movie.title}"`);

    const posterUrl = movie.poster_path 
        ? imageBaseUrl + movie.poster_path 
        : 'https://via.placeholder.com/300x450/1f1f1f/808080?text=Sin+Poster';

    const voteAverage = (movie.vote_average && movie.vote_average > 0) 
        ? movie.vote_average.toFixed(1) 
        : 'N/A';

    try {
        document.getElementById('recommended-poster').src = posterUrl;
        document.getElementById('recommended-poster').alt = movie.title || 'Película recomendada';
        document.getElementById('recommended-title').textContent = movie.title || 'Sin título';
        document.getElementById('recommended-overview').textContent = movie.overview || 'Sin descripción disponible';
        document.getElementById('recommended-rating').textContent = voteAverage;
        document.getElementById('recommended-year').textContent = formatDate(movie.release_date);
        document.getElementById('recommended-movie').classList.add('show');
        
        uiLogger.success(`✓ Recomendación mostrada: "${movie.title}" (${voteAverage}/10)`);
    } catch (error) {
        uiLogger.error('Error al mostrar recomendación:', error);
    }
}
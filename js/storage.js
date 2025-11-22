import { storageLogger } from './logger.js';

storageLogger.info('💾 Módulo de almacenamiento inicializado');

export function getFavorites() {
    try {
        const favorites = JSON.parse(localStorage.getItem('movieFavorites') || '[]');
        storageLogger.debug(`📖 Leyendo favoritos: ${favorites.length} películas`);
        return favorites;
    } catch (error) {
        storageLogger.error('Error al leer favoritos:', error);
        return [];
    }
}

export function getWatchedMovies() {
    try {
        const watched = JSON.parse(localStorage.getItem('watchedMovies') || '[]');
        storageLogger.debug(`📖 Leyendo películas vistas: ${watched.length} películas`);
        return watched;
    } catch (error) {
        storageLogger.error('Error al leer películas vistas:', error);
        return [];
    }
}

export function addToFavorites(movie) {
    try {
        const favorites = getFavorites();
        
        if (favorites.some(f => f.id === movie.id)) {
            storageLogger.warn(`⚠️ Película "${movie.title}" ya está en favoritos`);
            return false;
        }
        
        favorites.push({
            id: movie.id,
            title: movie.title,
            poster_path: movie.poster_path,
            release_date: movie.release_date,
            vote_average: movie.vote_average,
            overview: movie.overview,
            dateAdded: new Date().toISOString()
        });
        
        localStorage.setItem('movieFavorites', JSON.stringify(favorites));
        storageLogger.success(`✓ "${movie.title}" añadida a favoritos (Total: ${favorites.length})`);
        return true;
    } catch (error) {
        storageLogger.error('Error al añadir a favoritos:', error);
        return false;
    }
}

export function removeFromFavorites(movieId) {
    try {
        const favorites = getFavorites();
        const movie = favorites.find(f => f.id === movieId);
        const filtered = favorites.filter(f => f.id !== movieId);
        
        localStorage.setItem('movieFavorites', JSON.stringify(filtered));
        
        if (movie) {
            storageLogger.info(`🗑️ "${movie.title}" eliminada de favoritos (Restantes: ${filtered.length})`);
        } else {
            storageLogger.warn(`⚠️ ID ${movieId} no encontrado en favoritos`);
        }
    } catch (error) {
        storageLogger.error('Error al eliminar de favoritos:', error);
    }
}

export function addToWatched(movie) {
    try {
        const watched = getWatchedMovies();
        
        if (watched.some(w => w.id === movie.id)) {
            storageLogger.warn(`⚠️ Película "${movie.title}" ya está en vistas`);
            return false;
        }
        
        watched.unshift({
            id: movie.id,
            title: movie.title,
            poster_path: movie.poster_path,
            release_date: movie.release_date,
            vote_average: movie.vote_average,
            overview: movie.overview,
            dateWatched: new Date().toISOString()
        });
        
        localStorage.setItem('watchedMovies', JSON.stringify(watched));
        storageLogger.success(`✓ "${movie.title}" marcada como vista (Total: ${watched.length})`);
        return true;
    } catch (error) {
        storageLogger.error('Error al añadir a vistas:', error);
        return false;
    }
}

export function removeFromWatched(movieId) {
    try {
        const watched = getWatchedMovies();
        const movie = watched.find(w => w.id === movieId);
        const filtered = watched.filter(w => w.id !== movieId);
        
        localStorage.setItem('watchedMovies', JSON.stringify(filtered));
        
        if (movie) {
            storageLogger.info(`🗑️ "${movie.title}" eliminada de vistas (Restantes: ${filtered.length})`);
        } else {
            storageLogger.warn(`⚠️ ID ${movieId} no encontrado en vistas`);
        }
    } catch (error) {
        storageLogger.error('Error al eliminar de vistas:', error);
    }
}

export function isFavorite(movieId) {
    const result = getFavorites().some(f => f.id === movieId);
    storageLogger.debug(`Verificando favorito ID ${movieId}: ${result ? 'SÍ' : 'NO'}`);
    return result;
}

export function isWatched(movieId) {
    const result = getWatchedMovies().some(w => w.id === movieId);
    storageLogger.debug(`Verificando vista ID ${movieId}: ${result ? 'SÍ' : 'NO'}`);
    return result;
}

// Inicialización: Verificar estado del localStorage
storageLogger.group('Estado inicial del localStorage');
storageLogger.info(`Favoritos: ${getFavorites().length} películas`);
storageLogger.info(`Vistas: ${getWatchedMovies().length} películas`);
storageLogger.groupEnd();
import { storageLogger } from '../logger.js';

storageLogger.info('💾 StorageService inicializado');

export class StorageService {
    static getFavorites() {
        try {
            const favorites = JSON.parse(localStorage.getItem('movieFavorites') || '[]');
            storageLogger.debug(`📖 Leyendo favoritos: ${favorites.length} películas`);
            return favorites;
        } catch (error) {
            storageLogger.error('Error al leer favoritos:', error);
            return [];
        }
    }

    static getWatchedMovies() {
        try {
            const watched = JSON.parse(localStorage.getItem('watchedMovies') || '[]');
            storageLogger.debug(`📖 Leyendo películas vistas: ${watched.length} películas`);
            return watched;
        } catch (error) {
            storageLogger.error('Error al leer películas vistas:', error);
            return [];
        }
    }

    static addToFavorites(movie) {
        try {
            const favorites = this.getFavorites();

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

    static removeFromFavorites(movieId) {
        try {
            const favorites = this.getFavorites();
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

    static addToWatched(movie) {
        try {
            const watched = this.getWatchedMovies();

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

    static removeFromWatched(movieId) {
        try {
            const watched = this.getWatchedMovies();
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

    static isFavorite(movieId) {
        const result = this.getFavorites().some(f => f.id === movieId);
        storageLogger.debug(`Verificando favorito ID ${movieId}: ${result ? 'SÍ' : 'NO'}`);
        return result;
    }

    static isWatched(movieId) {
        const result = this.getWatchedMovies().some(w => w.id === movieId);
        storageLogger.debug(`Verificando vista ID ${movieId}: ${result ? 'SÍ' : 'NO'}`);
        return result;
    }
}
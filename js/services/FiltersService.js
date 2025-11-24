import { mainLogger } from '../logger.js';

const filtersLogger = mainLogger;

export class FiltersService {
    static filterByYear(movies, yearFilter) {
        if (!yearFilter) return movies;

        return movies.filter(movie => {
            if (!movie.release_date) return false;
            const year = new Date(movie.release_date).getUTCFullYear();

            switch (yearFilter) {
                case '2025':
                    return year === 2025;
                case '2024':
                case '2023':
                case '2022':
                case '2021':
                case '2020':
                    return year === parseInt(yearFilter);
                case '2010s':
                    return year >= 2010 && year <= 2019;
                case '2000s':
                    return year >= 2000 && year <= 2009;
                case '1990s':
                    return year >= 1990 && year <= 1999;
                case '1980s':
                    return year >= 1980 && year <= 1989;
                case 'classic':
                    return year < 1980;
                default:
                    return true;
            }
        });
    }

    static filterByRating(movies, ratingFilter) {
        if (!ratingFilter) return movies;
        const minRating = parseFloat(ratingFilter);
        return movies.filter(movie => (movie.vote_average || 0) >= minRating);
    }

    static sortMovies(movies, sortBy) {
        if (!sortBy) return movies;
        const sortedMovies = [...movies];

        switch (sortBy) {
            case 'title-asc':
                sortedMovies.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
                break;
            case 'rating-desc':
                sortedMovies.sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0));
                break;
            case 'date-desc':
                sortedMovies.sort((a, b) => {
                    const dateA = new Date(a.release_date || '1900-01-01');
                    const dateB = new Date(b.release_date || '1900-01-01');
                    return dateB - dateA;
                });
                break;
            case 'popularity-desc':
                sortedMovies.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
                break;
            default:
                break;
        }
        return sortedMovies;
    }

    static applyFilters(movies, filters) {
        if (!Array.isArray(movies) || movies.length === 0) {
            return movies;
        }

        let filteredMovies = [...movies];

        // Filtrar por año
        filteredMovies = this.filterByYear(filteredMovies, filters.year);

        // Filtrar por calificación
        filteredMovies = this.filterByRating(filteredMovies, filters.rating);

        // Ordenar
        filteredMovies = this.sortMovies(filteredMovies, filters.sortBy);

        filtersLogger.debug(`Filtros aplicados: ${movies.length} -> ${filteredMovies.length} resultados`);
        return filteredMovies;
    }
}
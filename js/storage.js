export function getFavorites() {
    return JSON.parse(localStorage.getItem('movieFavorites') || '[]');
}

export function getWatchedMovies() {
    return JSON.parse(localStorage.getItem('watchedMovies') || '[]');
}

export function addToFavorites(movie) {
    const favorites = getFavorites();
    if (favorites.some(f => f.id === movie.id)) return false;
    
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
    return true;
}

export function removeFromFavorites(movieId) {
    const filtered = getFavorites().filter(f => f.id !== movieId);
    localStorage.setItem('movieFavorites', JSON.stringify(filtered));
}

export function addToWatched(movie) {
    const watched = getWatchedMovies();
    if (watched.some(w => w.id === movie.id)) return false;
    
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
    return true;
}

export function removeFromWatched(movieId) {
    const filtered = getWatchedMovies().filter(w => w.id !== movieId);
    localStorage.setItem('watchedMovies', JSON.stringify(filtered));
}

export function isFavorite(movieId) {
    return getFavorites().some(f => f.id === movieId);
}

export function isWatched(movieId) {
    return getWatchedMovies().some(w => w.id === movieId);
}
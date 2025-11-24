# Services Documentation

## Overview

This document describes the three service classes created during Refactor #2 to encapsulate business logic and external dependencies.

## TMDBService

**Location:** `js/services/TMDBService.js`

Handles all interactions with The Movie Database (TMDB) API.

### Features
- **Request Queue Management**: Prevents duplicate simultaneous requests to the same endpoint
- **Automatic Caching**: Caches responses for 100ms to avoid redundant API calls
- **Comprehensive Logging**: Tracks all API requests, responses, and errors
- **Error Handling**: Gracefully handles network errors and invalid responses

### Methods

#### `clearCache()`
Manually clears the request queue cache (primarily for testing).

```javascript
TMDBService.clearCache();
```

#### `fetchFromAPI(endpoint)`
Core method for making API requests.

```javascript
const data = await TMDBService.fetchFromAPI('movie/popular');
```

#### `loadGenres()`
Loads the list of movie genres.

```javascript
const genresData = await TMDBService.loadGenres();
```

#### `getMovies(endpoint, page = 1)`
Fetches movies from a specific endpoint with pagination.

```javascript
const movies = await TMDBService.getMovies('movie/popular', 1);
```

#### `getMovieDetails(movieId)`
Fetches complete details for a specific movie including credits, videos, providers, keywords, reviews, and similar movies.

```javascript
const details = await TMDBService.getMovieDetails(550);
```

#### `searchPerson(query, page = 1)`
Searches for people (actors, directors, etc.).

```javascript
const people = await TMDBService.searchPerson('Tom Hanks');
```

#### `getMoviesByPerson(personId)`
Gets all movies associated with a person.

```javascript
const credits = await TMDBService.getMoviesByPerson(31);
```

#### `multiSearch(query, page = 1)`
Performs a multi-type search (movies and people).

```javascript
const results = await TMDBService.multiSearch('Matrix');
// Returns: { movies: [...], people: [...], ...otherData }
```

#### `discoverByPerson(personId, role = 'cast', page = 1)`
Discovers movies by person ID and role.

```javascript
const movies = await TMDBService.discoverByPerson(31, 'cast');
```

---

## StorageService

**Location:** `js/services/StorageService.js`

Manages browser local storage for user preferences (favorites and watched movies).

### Methods

#### `getFavorites()`
Returns array of favorite movies.

```javascript
const favorites = StorageService.getFavorites();
```

#### `addToFavorites(movie)`
Adds a movie to favorites. Returns `true` if successful, `false` if already exists.

```javascript
const added = StorageService.addToFavorites(movieData);
```

#### `removeFromFavorites(movieId)`
Removes a movie from favorites by ID.

```javascript
StorageService.removeFromFavorites(550);
```

#### `isFavorite(movieId)`
Checks if a movie is in favorites.

```javascript
const isFav = StorageService.isFavorite(550);
```

#### `getWatched()`
Returns array of watched movies.

```javascript
const watched = StorageService.getWatched();
```

#### `addToWatched(movie)`
Adds a movie to watched list.

```javascript
StorageService.addToWatched(movieData);
```

#### `removeFromWatched(movieId)`
Removes a movie from watched list.

```javascript
StorageService.removeFromWatched(550);
```

#### `isWatched(movieId)`
Checks if a movie is in watched list.

```javascript
const isWatched = StorageService.isWatched(550);
```

---

## FiltersService

**Location:** `js/services/FiltersService.js`

Provides filtering and sorting functionality for movie collections.

### Methods

#### `filterByYear(movies, yearFilter)`
Filters movies by year or decade.

**Supported filters:**
- Specific years: `'2025'`, `'2024'`, `'2023'`, `'2022'`, `'2021'`, `'2020'`
- Decades: `'2010s'`, `'2000s'`, `'1990s'`, `'1980s'`
- Classic: `'classic'` (before 1980)

```javascript
const filtered = FiltersService.filterByYear(movies, '2023');
```

#### `filterByRating(movies, ratingFilter)`
Filters movies by minimum rating.

```javascript
const filtered = FiltersService.filterByRating(movies, '7.0');
```

#### `sortMovies(movies, sortBy)`
Sorts movies by various criteria.

**Supported sort options:**
- `'title-asc'`: Alphabetical by title
- `'rating-desc'`: Highest rating first
- `'date-desc'`: Newest first
- `'popularity-desc'`: Most popular first

```javascript
const sorted = FiltersService.sortMovies(movies, 'rating-desc');
```

#### `applyFilters(movies, filters)`
Applies multiple filters and sorting in one call.

```javascript
const filtered = FiltersService.applyFilters(movies, {
    year: '2023',
    rating: '7.0',
    sortBy: 'rating-desc'
});
```

---

## Testing

All services have comprehensive unit tests in `tests/services.test.js`.

Run tests with:
```bash
npm test
```

Current test coverage:
- **TMDBService**: 2 tests (API requests, error handling)
- **StorageService**: 3 tests (add, duplicate prevention, status check)
- **FiltersService**: 3 tests (year filter, rating filter, sorting)

---

## Migration Notes

### From `api.js` to `TMDBService`

**Before:**
```javascript
import { fetchFromAPI, getMovieDetails } from './api.js';
const data = await fetchFromAPI('movie/popular');
```

**After:**
```javascript
import { TMDBService } from './services/TMDBService.js';
const data = await TMDBService.fetchFromAPI('movie/popular');
```

### From `storage.js` to `StorageService`

**Before:**
```javascript
import { addToFavorites, isFavorite } from './storage.js';
addToFavorites(movie);
```

**After:**
```javascript
import { StorageService } from './services/StorageService.js';
StorageService.addToFavorites(movie);
```

### New: FiltersService

**Before (in main.js):**
```javascript
function applyFiltersToMovies(movies) {
    // 70+ lines of filtering logic
}
```

**After:**
```javascript
import { FiltersService } from './services/FiltersService.js';
const filtered = FiltersService.applyFilters(movies, currentFilters);
```

---

## Benefits

1. **Separation of Concerns**: Each service has a single, well-defined responsibility
2. **Testability**: Static methods are easy to test in isolation
3. **Reusability**: Services can be used across different parts of the application
4. **Maintainability**: Centralized logic is easier to update and debug
5. **Type Safety**: Clear method signatures improve code documentation

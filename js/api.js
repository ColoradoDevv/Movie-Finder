import { apiKey, apiUrl } from './config.js';
import { apiLogger } from './logger.js';

// Cola de peticiones para evitar race conditions
const requestQueue = new Map();

apiLogger.info('📡 Módulo API inicializado');
apiLogger.debug('API URL configurada:', apiUrl);

export async function fetchFromAPI(endpoint) {
    const separator = endpoint.includes('?') ? '&' : '?';
    const url = `${apiUrl}/${endpoint}${separator}api_key=${apiKey}&language=es-ES`;
    
    apiLogger.debug(`Preparando petición a: ${endpoint}`);
    
    // Si ya existe una petición a esta URL, reutilizarla
    if (requestQueue.has(url)) {
        apiLogger.warn('Petición duplicada detectada, reutilizando cache');
        return requestQueue.get(url);
    }

    apiLogger.time(`Petición ${endpoint}`);

    const fetchPromise = (async () => {
        try {
            apiLogger.info(`🌐 Realizando petición GET: ${endpoint}`);
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            apiLogger.success(`✓ Respuesta exitosa de: ${endpoint}`, {
                resultados: data.results?.length || 'N/A',
                páginas: data.total_pages || 'N/A'
            });
            apiLogger.timeEnd(`Petición ${endpoint}`);
            
            return data;
        } catch (error) {
            apiLogger.error(`✗ Error en petición: ${endpoint}`, error.message);
            apiLogger.timeEnd(`Petición ${endpoint}`);
            return null;
        } finally {
            // Limpiar el cache después de 100ms
            setTimeout(() => {
                if (requestQueue.has(url)) {
                    requestQueue.delete(url);
                    apiLogger.debug(`Cache limpiado para: ${endpoint}`);
                }
            }, 100);
        }
    })();

    requestQueue.set(url, fetchPromise);
    return fetchPromise;
}

export async function loadGenres() {
    apiLogger.info('📂 Cargando lista de géneros...');
    const data = await fetchFromAPI('genre/movie/list');
    
    if (data && data.genres) {
        apiLogger.success(`✓ ${data.genres.length} géneros cargados exitosamente`);
        apiLogger.table(data.genres);
    } else {
        apiLogger.error('✗ No se pudieron cargar los géneros');
    }
    
    return data;
}

export async function getMovies(endpoint, page = 1) {
    apiLogger.info(`🎬 Obteniendo películas - Página ${page}`);
    const pageQuery = `${endpoint}${endpoint.includes('?') ? '&' : '?'}page=${page}`;
    const data = await fetchFromAPI(pageQuery);
    
    if (data && data.results) {
        apiLogger.success(`✓ ${data.results.length} películas obtenidas (Página ${page}/${data.total_pages})`);
    }
    
    return data;
}

export async function getMovieDetails(movieId) {
    if (!movieId || isNaN(movieId)) {
        apiLogger.error('ID de película inválido:', movieId);
        return null;
    }
    
    apiLogger.info(`🎥 Obteniendo detalles de película ID: ${movieId}`);
    const data = await fetchFromAPI(`movie/${movieId}?append_to_response=credits,videos,watch/providers,keywords,reviews,similar`);
    
    if (data) {
        apiLogger.success(`✓ Detalles cargados: "${data.title}" (${data.release_date})`);
        apiLogger.debug('Información adicional cargada:', {
            videos: data.videos?.results?.length || 0,
            similares: data.similar?.results?.length || 0,
            reviews: data.reviews?.results?.length || 0,
            keywords: data.keywords?.keywords?.length || 0
        });
    } else {
        apiLogger.error(`✗ No se pudieron cargar detalles de película ID: ${movieId}`);
    }
    
    return data;
}

// ============================================
// NUEVAS FUNCIONES DE BÚSQUEDA MEJORADA
// ============================================

/**
 * Busca personas (actores/directores) por nombre
 * @param {string} query - Nombre a buscar
 * @param {number} page - Número de página
 * @returns {Promise} - Resultados de personas
 */
export async function searchPerson(query, page = 1) {
    apiLogger.info(`👤 Buscando persona: "${query}"`);
    const endpoint = `search/person?query=${encodeURIComponent(query)}&page=${page}`;
    const data = await fetchFromAPI(endpoint);
    
    if (data && data.results) {
        apiLogger.success(`✓ ${data.results.length} personas encontradas para "${query}"`);
    } else {
        apiLogger.warn(`Sin resultados de personas para: "${query}"`);
    }
    
    return data;
}

/**
 * Obtiene películas de un actor específico
 * @param {number} personId - ID de la persona
 * @returns {Promise} - Películas del actor
 */
export async function getMoviesByPerson(personId) {
    if (!personId || isNaN(personId)) {
        apiLogger.error('ID de persona inválido:', personId);
        return null;
    }
    
    apiLogger.info(`🎭 Obteniendo películas de persona ID: ${personId}`);
    const data = await fetchFromAPI(`person/${personId}/movie_credits`);
    
    if (data && data.cast) {
        apiLogger.success(`✓ ${data.cast.length} películas encontradas como actor`);
    }
    if (data && data.crew) {
        apiLogger.success(`✓ ${data.crew.filter(c => c.job === 'Director').length} películas como director`);
    }
    
    return data;
}

/**
 * Búsqueda inteligente multi-tipo
 * Busca tanto películas como personas y devuelve resultados combinados
 * @param {string} query - Término de búsqueda
 * @param {number} page - Número de página
 * @returns {Promise} - Objeto con resultados de películas y personas
 */
export async function multiSearch(query, page = 1) {
    apiLogger.info(`🔍 Búsqueda multi-tipo: "${query}"`);
    const endpoint = `search/multi?query=${encodeURIComponent(query)}&page=${page}`;
    const data = await fetchFromAPI(endpoint);
    
    if (data && data.results) {
        const movies = data.results.filter(r => r.media_type === 'movie');
        const people = data.results.filter(r => r.media_type === 'person');
        
        apiLogger.success(`✓ Búsqueda multi: ${movies.length} películas, ${people.length} personas`);
        apiLogger.debug('Desglose de resultados:', {
            películas: movies.length,
            personas: people.length,
            otros: data.results.length - movies.length - people.length
        });
        
        return {
            ...data,
            movies,
            people
        };
    }
    
    return data;
}

/**
 * Descubre películas por actor/director
 * @param {number} personId - ID de la persona
 * @param {string} role - 'cast' para actor, 'crew' para director
 * @param {number} page - Número de página
 * @returns {Promise} - Películas descubiertas
 */
export async function discoverByPerson(personId, role = 'cast', page = 1) {
    apiLogger.info(`🎬 Descubriendo películas por persona ID: ${personId} (${role})`);
    
    const param = role === 'cast' ? 'with_cast' : 'with_crew';
    const endpoint = `discover/movie?${param}=${personId}&sort_by=popularity.desc&page=${page}`;
    
    const data = await fetchFromAPI(endpoint);
    
    if (data && data.results) {
        apiLogger.success(`✓ ${data.results.length} películas descubiertas`);
    }
    
    return data;
}
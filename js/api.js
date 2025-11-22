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
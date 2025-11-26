import { TMDBService } from '../services/TMDBService.js';
import { MoviesView } from '../ui/views/MoviesView.js';
import { EmptyStateView } from '../ui/views/EmptyStateView.js';
import { clearResults, sectionTitle, resultsGrid } from '../utils.js';
import Logger from '../logger.js';

export class SearchController {
    constructor(state) {
        this.state = state;
        this.logger = new Logger('SEARCH_CONTROLLER');

        // Inicializar vistas
        this.moviesView = new MoviesView(resultsGrid);
        this.emptyStateView = new EmptyStateView(resultsGrid);

        this.logger.info('🔍 SearchController inicializado con State centralizado');
    }

    /**
     * Realiza una búsqueda inteligente que detecta si es película o persona
     * @param {string} query - Término de búsqueda
     * @param {number} page - Página actual
     * @returns {Promise<Object>} - Resultados y metadatos
     */
    async intelligentSearch(query, page = 1) {
        this.logger.info(`🧠 Búsqueda inteligente iniciada: "${query}"`);
        this.logger.time('Búsqueda inteligente');

        // Actualizar estado global
        this.state.set('movies.searchQuery', query);

        try {
            // Realizar búsqueda multi-tipo
            const results = await TMDBService.multiSearch(query, page);

            if (!results) {
                this.logger.error('No se obtuvieron resultados de la búsqueda');
                return null;
            }

            const { movies, people, total_results, total_pages } = results;

            this.logger.debug('Análisis de resultados:', {
                películas: movies?.length || 0,
                personas: people?.length || 0,
                total: total_results
            });

            // Determinar el tipo de búsqueda predominante
            const searchType = this._analyzeSearchType(movies, people);

            this.logger.info(`📊 Tipo de búsqueda detectado: ${searchType}`);
            this.logger.timeEnd('Búsqueda inteligente');

            return {
                movies: movies || [],
                people: people || [],
                searchType,
                total_results,
                total_pages,
                page: results.page
            };
        } catch (error) {
            this.logger.error('Error en búsqueda inteligente:', error);
            this.logger.timeEnd('Búsqueda inteligente');
            return null;
        }
    }

    /**
     * Analiza los resultados para determinar el tipo de búsqueda
     * @param {Array} movies - Películas encontradas
     * @param {Array} people - Personas encontradas
     * @returns {string} - Tipo de búsqueda: 'movie', 'person', o 'mixed'
     */
    _analyzeSearchType(movies, people) {
        const movieCount = movies?.length || 0;
        const peopleCount = people?.length || 0;

        if (peopleCount === 0 && movieCount > 0) {
            return 'movie';
        }

        if (movieCount === 0 && peopleCount > 0) {
            return 'person';
        }

        // Si hay más personas que películas, probablemente buscan un actor/director
        if (peopleCount > movieCount) {
            return 'person';
        }

        // Si hay resultados mixtos pero equilibrados
        if (movieCount > 0 && peopleCount > 0) {
            return 'mixed';
        }

        return 'unknown';
    }

    /**
     * Procesa los resultados de búsqueda y los muestra
     * @param {Object} searchResults - Resultados de intelligentSearch
     * @param {string} query - Término de búsqueda original
     */
    async processSearchResults(searchResults, query) {
        if (!searchResults) {
            this.logger.warn('No hay resultados para procesar');
            this.emptyStateView.show(`No se encontraron resultados para "${query}"`);
            return;
        }

        const { movies, people, searchType } = searchResults;

        this.logger.info(`🎯 Procesando resultados de tipo: ${searchType}`);

        switch (searchType) {
            case 'movie':
                // Solo películas
                this.logger.debug('Mostrando solo películas');
                sectionTitle.textContent = `Películas: "${query}"`;
                clearResults();
                this.moviesView.render(movies);
                break;

            case 'person':
                // Principalmente personas - mostrar opción de ver sus películas
                this.logger.debug('Búsqueda de persona detectada');
                await this._handlePersonSearch(people, query);
                break;

            case 'mixed':
                // Resultados mixtos - priorizar películas pero informar sobre personas
                this.logger.debug('Resultados mixtos detectados');
                await this._handleMixedSearch(movies, people, query);
                break;

            default:
                this.logger.warn('Tipo de búsqueda desconocido');
                this.emptyStateView.show(`No se encontraron resultados para "${query}"`);
        }
    }

    /**
     * Maneja búsquedas que son principalmente de personas
     * @param {Array} people - Personas encontradas
     * @param {string} query - Término de búsqueda
     */
    async _handlePersonSearch(people, query) {
        this.logger.info(`👤 Manejando búsqueda de persona: ${people.length} resultados`);

        if (people.length === 0) {
            this.emptyStateView.show(`No se encontraron actores o directores con el nombre "${query}"`);
            return;
        }

        // Tomar la persona más relevante (primera del resultado)
        const topPerson = people[0];

        this.logger.info(`🎭 Persona principal: ${topPerson.name} (ID: ${topPerson.id})`);

        // Mostrar mensaje de carga personalizado
        clearResults();
        sectionTitle.innerHTML = `
            <span>Películas de <strong>${topPerson.name}</strong></span>
            <span style="font-size: 0.8em; color: var(--text-secondary); margin-left: 1rem;">
                ${topPerson.known_for_department || 'Actuación/Dirección'}
            </span>
        `;

        // Obtener películas de esta persona
        const credits = await TMDBService.getMoviesByPerson(topPerson.id);

        if (!credits) {
            this.emptyStateView.show(`No se pudieron cargar las películas de ${topPerson.name}`);
            return;
        }

        // Combinar películas como actor y director
        let allMovies = [];

        if (credits.cast) {
            this.logger.debug(`${credits.cast.length} películas como actor`);
            allMovies = [...credits.cast];
        }

        if (credits.crew) {
            const directedMovies = credits.crew.filter(c => c.job === 'Director');
            this.logger.debug(`${directedMovies.length} películas como director`);
            allMovies = [...allMovies, ...directedMovies];
        }

        // Eliminar duplicados por ID
        const uniqueMovies = Array.from(new Map(allMovies.map(m => [m.id, m])).values());

        // Ordenar por popularidad
        uniqueMovies.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));

        this.logger.success(`✓ ${uniqueMovies.length} películas únicas encontradas`);

        if (uniqueMovies.length === 0) {
            this.emptyStateView.show(`${topPerson.name} no tiene películas registradas en TMDB`);
            return;
        }

        // Mostrar las películas
        clearResults();
        this.moviesView.render(uniqueMovies.slice(0, 60)); // Limitar a 60 para rendimiento

        // Mostrar información adicional si hay más personas
        if (people.length > 1) {
            this.logger.info(`ℹ️ También se encontraron ${people.length - 1} personas adicionales`);
            this._addPersonSuggestions(people.slice(1, 4), query);
        }
    }

    /**
     * Maneja búsquedas con resultados mixtos
     * @param {Array} movies - Películas encontradas
     * @param {Array} people - Personas encontradas
     * @param {string} query - Término de búsqueda
     */
    async _handleMixedSearch(movies, people, query) {
        this.logger.info(`🎭 Manejando búsqueda mixta: ${movies.length} películas, ${people.length} personas`);

        // Mostrar películas primero
        sectionTitle.innerHTML = `
            <span>Resultados para "${query}"</span>
            <span style="font-size: 0.8em; color: var(--text-secondary); margin-left: 1rem;">
                ${movies.length} películas, ${people.length} actores/directores
            </span>
        `;

        clearResults();
        this.moviesView.render(movies);

        // Agregar sugerencias de personas al final
        if (people.length > 0) {
            this._addPersonSuggestions(people.slice(0, 3), query);
        }
    }

    /**
     * Agrega sugerencias de personas al final de los resultados
     * @param {Array} people - Personas sugeridas
     * @param {string} query - Término de búsqueda
     */
    _addPersonSuggestions(people, query) {
        this.logger.debug(`💡 Agregando ${people.length} sugerencias de personas`);

        const resultsGrid = document.getElementById('results-grid');
        const suggestionBox = document.createElement('div');
        suggestionBox.className = 'person-suggestions';
        suggestionBox.innerHTML = `
            <div class="suggestion-header">
                <h3>¿Buscabas a alguna de estas personas?</h3>
            </div>
            <div class="person-grid">
                ${people.map(person => `
                    <div class="person-card" data-person-id="${person.id}" data-person-name="${person.name}">
                        <img src="${person.profile_path ? 'https://image.tmdb.org/t/p/w185' + person.profile_path : 'https://via.placeholder.com/185x278/1f1f1f/808080?text=Sin+Foto'}" 
                             alt="${person.name}"
                             loading="lazy">
                        <div class="person-info">
                            <h4>${person.name}</h4>
                            <p>${person.known_for_department || 'Actuación'}</p>
                            ${person.known_for ? `<p class="known-for">Conocido por: ${person.known_for.slice(0, 2).map(m => m.title || m.name).join(', ')}</p>` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        resultsGrid.appendChild(suggestionBox);

        // Agregar event listeners a las tarjetas de personas
        suggestionBox.querySelectorAll('.person-card').forEach(card => {
            card.addEventListener('click', async () => {
                const personId = parseInt(card.dataset.personId);
                const personName = card.dataset.personName;

                this.logger.info(`👤 Usuario seleccionó a: ${personName}`);

                // Recargar la página con las películas de esta persona
                const credits = await TMDBService.getMoviesByPerson(personId);

                if (credits) {
                    let allMovies = [...(credits.cast || []), ...(credits.crew || []).filter(c => c.job === 'Director')];
                    const uniqueMovies = Array.from(new Map(allMovies.map(m => [m.id, m])).values());
                    uniqueMovies.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));

                    sectionTitle.textContent = `Películas de ${personName}`;
                    clearResults();
                    this.moviesView.render(uniqueMovies.slice(0, 60));
                }
            });
        });
    }
}

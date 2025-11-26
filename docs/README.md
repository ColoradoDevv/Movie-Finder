# 🎬 MovieFinder: Explora el Universo del Cine

[![Tecnología](https://img.shields.io/badge/Tecnología-Vanilla%20JavaScript-yellowgreen)](https://developer.mozilla.org/es/docs/Web/JavaScript)
[![Estilo](https://img.shields.io/badge/Estilo-Dark%20Mode-282c34)](styles.css)
[![API](https://img.shields.io/badge/API-TMDB-00D47B)](https://www.themoviedb.org/)
[![Diseño](https://img.shields.io/badge/Diseño-Responsive-blue)](styles.css)

## 🌟 Descripción General

**MovieFinder** es una aplicación web dinámica y moderna diseñada para la exploración cinematográfica. Construida enteramente con **Vanilla JavaScript** (módulos ES6), HTML semántico y CSS3, la aplicación consume la API de The Movie Database (TMDB) para ofrecer una experiencia de descubrimiento de películas robusta y de alto rendimiento.

El proyecto destaca por su **diseño responsivo de tema oscuro** y su arquitectura modular, que separa claramente las capas de UI, API, y lógica de negocio. Es la herramienta perfecta para "Descubrir tu próxima película favorita".

***

## ✨ Características Clave (Deep Dive)

### 1. Funcionalidad de Búsqueda y Navegación

* **Página Principal y Populares:** Muestra automáticamente las películas más populares al inicio, con un botón de "Cargar más" para paginación incremental.
* **Búsqueda Rápida:** Permite buscar películas por título y actualiza la cuadrícula de resultados y el título de la sección dinámicamente.
* **Filtro por Género Dinámico:** La barra de géneros se carga al inicio directamente desde la API y permite filtrar los resultados utilizando el *endpoint* `discover/movie`.

### 2. Gestión de Estado Local (LocalStorage)

La aplicación utiliza `localStorage` para persistir la información del usuario.

* **Mis Favoritos ❤️:** Permite guardar o eliminar películas de una lista local.
* **Películas Vistas 📺:** Permite registrar las películas que el usuario ya ha visto.
* **Indicadores Visuales:** Las tarjetas de película en la cuadrícula principal se actualizan en tiempo real para mostrar un ícono de corazón o de visto si la película está en las listas del usuario, garantizando una experiencia coherente.

### 3. Modal Detallado y Experiencia de Descubrimiento

Al hacer clic en cualquier película, se abre un modal que realiza una consulta detallada a la API (`movie/{id}`) con múltiples *appends*:

* **Información Financiera y Técnica:** Sinopsis, puntuación, duración, título original, votos, presupuesto y recaudación.
* **Contenido Multimedia:** Tráiler de YouTube incrustado.
* **Disponibilidad de Streaming:** Muestra los logos de las plataformas de *streaming* donde la película está disponible (con soporte para países como CO/ES).
* **Contexto Adicional:** Listado de palabras clave (`keywords`) y un resumen de las reseñas de usuarios (`reviews`).
* **Recomendaciones Similares:** Muestra una cuadrícula de películas similares con funcionalidad de clic para abrir directamente el detalle de la nueva película, facilitando el "deep diving".

### 4. Función de Recomendación Aleatoria

La sección "¿No sabes qué ver?" ofrece una recomendación al azar.

* Permite al usuario seleccionar un género como filtro.
* La lógica de recomendación usa películas mejor calificadas con un número mínimo de votos (`vote_count.gte=500`) para garantizar la calidad, y selecciona una al azar de la primera página de resultados.

***

## 🚀 Tecnologías Utilizadas

* **HTML5** (Semántico y Accesible)
* **CSS3** (Variables CSS, Flexbox, Grid, Media Queries)
* **Vanilla JavaScript** (Módulos ES6)
* **The Movie Database (TMDB) API**

***

## ⚙️ Estructura del Proyecto

El proyecto está diseñado bajo una **arquitectura modular moderna** con separación clara de responsabilidades:

```bash
├── index.html              # Estructura principal de la aplicación
├── styles.css              # Estilos completos con variables CSS y diseño responsivo
├── assets/
│   └── images/
│       └── logo-tmdb.svg   # Logo de TMDB
└── js/
    ├── app.js              # Punto de entrada principal (50 líneas)
    ├── AppInitializer.js   # Inicialización de controladores y vistas
    ├── EventHandlers.js    # Gestión centralizada de eventos
    ├── config.js           # Configuración (API Key, URLs)
    ├── logger.js           # Sistema de logging profesional
    ├── utils.js            # Utilidades DOM
    ├── mobile-nav.js       # Navegación móvil
    │
    ├── core/               # Núcleo de la aplicación
    │   ├── State.js        # Gestión de estado con patrón Observer
    │   ├── Router.js       # Sistema de routing
    │   └── EventBus.js     # Comunicación desacoplada (Pub/Sub)
    │
    ├── controllers/        # Lógica de negocio
    │   ├── MoviesController.js
    │   ├── SearchController.js
    │   ├── FiltersController.js
    │   ├── FavoritesController.js
    │   └── RecommendationsController.js
    │
    ├── services/           # Acceso a datos
    │   ├── TMDBService.js      # Abstracción de API TMDB
    │   ├── StorageService.js   # Gestión de localStorage
    │   └── FiltersService.js   # Lógica pura de filtrado
    │
    └── ui/                 # Capa de presentación
        ├── components/     # Componentes reutilizables
        │   ├── MovieCard.js
        │   ├── Modal.js
        │   └── Recommendation.js
        └── views/          # Vistas de renderizado
            ├── MoviesView.js
            ├── ModalView.js
            └── EmptyStateView.js
```

### Arquitectura

- **app.js**: Punto de entrada minimalista que orquesta la inicialización
- **Core**: Módulos fundamentales (State, Router, EventBus)
- **Controllers**: Lógica de negocio separada por funcionalidad
- **Services**: Capa de acceso a datos (API, Storage)
- **UI**: Componentes y vistas reutilizables
- **Utils**: Funciones de utilidad compartidas

***

## 🛠️ Instalación y Uso Local

Para ejecutar el proyecto en tu máquina local, sigue estos sencillos pasos:

1.  **Clonar el repositorio:**
    ```bash
    git clone [https://git-scm.com/book/es/v2/Fundamentos-de-Git-Guardando-cambios-en-el-Repositorio](https://git-scm.com/book/es/v2/Fundamentos-de-Git-Guardando-cambios-en-el-Repositorio)
    cd MovieFinder
    ```
2.  **Configurar la API Key:**
    * Obtén una clave de API gratuita en [The Movie Database (TMDB)](https://www.themoviedb.org/documentation/api).
    * Abre el archivo `js/config.js`.
    * Reemplaza el valor de `apiKey` con tu clave personal.

3.  **Ejecutar la Aplicación:**
    * Abre el archivo `index.html` en tu navegador. Dado que el proyecto utiliza módulos ES6 (`<script type="module">`), puede que necesites un servidor local simple (como Live Server de VS Code o Python `http.server`) para evitar problemas de CORS y `file://` con módulos.

***

## 📝 Agradecimientos y Disclaimer

* **Desarrollador:** Juan Manuel Colorado.
* **Fuente de Datos:** Esta página utiliza la API de TMDB pero **no está respaldada ni certificada por TMDB**.
* **Licencia:** [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

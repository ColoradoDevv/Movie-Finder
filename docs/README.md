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

El proyecto está diseñado bajo un enfoque modular, donde cada archivo JavaScript tiene una única responsabilidad.
```bash
├── index.html # Estructura principal de la aplicación y base del DOM. 
├── styles.css # Estilos completos, manejo de variables para colores y diseño responsivo. 
├── assets/ 
│ └── images/ 
│ └── logo-tmdb.svg # Logo de TMDB utilizado en el footer. 
└── js/ 
    ├── api.js # Capa de Datos: Abstracción del Fetch para todas las llamadas a TMDB, incluyendo getMovieDetails con append_to_response.
    ├── config.js # Configuración: Almacena la apiKey, apiUrl, imageBaseUrl y youtubeBaseUrl. 
    ├── main.js # Controlador Principal: Inicializa la app, maneja Event Listeners de navegación, búsqueda, y coordina las llamadas a otras capas. 
    ├── modal.js # Manejo del Modal: Lógica para construir el contenido detallado de la película, manejar botones de estado (favoritos/vistas) dentro del modal, y abrir/cerrar. 
    ├── recommendations.js # Lógica de Recomendación: Funcionalidad para calcular y mostrar una película aleatoria basada en criterios de calidad. 
    ├── storage.js # Persistencia Local: Funciones de CRUD para localStorage (añadir, remover, verificar favoritos y vistas). 
    ├── ui.js # Renderizado: Funciones encargadas de crear y renderizar elementos del DOM, como las tarjetas de películas (createMovieCard) y la recomendación destacada.
    └── utils.js # Utilidades: Herramientas de ayuda como manejo del Loader, limpieza de resultados, y formateo de fechas.
```

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

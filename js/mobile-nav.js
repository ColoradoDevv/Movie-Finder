// mobile-nav.js - Manejador de navegación móvil
import { mainLogger } from './logger.js';

mainLogger.info('📱 Módulo de navegación móvil inicializado');

// Referencias a elementos del DOM
const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebar-overlay');
const bottomNavItems = document.querySelectorAll('.bottom-nav-item');

// Estado del menú móvil
let isMobileMenuOpen = false;

/**
 * Abre el menú móvil (sidebar)
 */
function openMobileMenu() {
    if (isMobileMenuOpen) return;
    
    mainLogger.info('📂 Abriendo menú móvil');
    
    sidebar.classList.add('active');
    sidebarOverlay.classList.add('active');
    sidebarOverlay.style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    isMobileMenuOpen = true;
    
    // Cambiar ícono del botón
    updateMenuIcon(true);
}

/**
 * Cierra el menú móvil (sidebar)
 */
function closeMobileMenu() {
    if (!isMobileMenuOpen) return;
    
    mainLogger.info('📁 Cerrando menú móvil');
    
    sidebar.classList.remove('active');
    sidebarOverlay.classList.remove('active');
    
    // Esperar a que termine la transición antes de ocultar
    setTimeout(() => {
        if (!sidebar.classList.contains('active')) {
            sidebarOverlay.style.display = 'none';
        }
    }, 300);
    
    document.body.style.overflow = '';
    
    isMobileMenuOpen = false;
    
    // Restaurar ícono del botón
    updateMenuIcon(false);
}

/**
 * Toggle del menú móvil
 */
function toggleMobileMenu() {
    if (isMobileMenuOpen) {
        closeMobileMenu();
    } else {
        openMobileMenu();
    }
}

/**
 * Actualiza el ícono del botón de menú
 * @param {boolean} isOpen - Si el menú está abierto
 */
function updateMenuIcon(isOpen) {
    const icon = mobileMenuToggle.querySelector('svg');
    
    if (isOpen) {
        // Ícono de X
        icon.innerHTML = `
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
        `;
    } else {
        // Ícono de hamburguesa
        icon.innerHTML = `
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
        `;
    }
}

/**
 * Sincroniza los estados activos entre sidebar y bottom nav
 * @param {string} section - Sección activa
 */
export function syncNavigationState(section) {
    mainLogger.debug(`🔄 Sincronizando navegación: ${section}`);
    
    // Actualizar sidebar
    const sidebarItems = document.querySelectorAll('.sidebar-nav-item');
    sidebarItems.forEach(item => {
        const itemSection = item.dataset.section;
        if (itemSection === section) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
    
    // Actualizar bottom nav
    bottomNavItems.forEach(item => {
        const itemSection = item.dataset.section;
        if (itemSection === section) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

/**
 * Maneja el clic en items de navegación del sidebar
 * Cierra el menú móvil automáticamente después de seleccionar
 */
function handleSidebarNavClick(e) {
    const navItem = e.target.closest('.sidebar-nav-item');
    if (!navItem) return;
    
    const section = navItem.dataset.section;
    if (section) {
        mainLogger.info(`📍 Navegando a sección: ${section}`);
        
        // Cerrar menú móvil si está en mobile
        if (window.innerWidth <= 768) {
            setTimeout(() => {
                closeMobileMenu();
            }, 150);
        }
        
        syncNavigationState(section);
    }
}

/**
 * Maneja el clic en géneros
 */
function handleGenreClick(e) {
    const genreBtn = e.target.closest('.genre-btn');
    if (!genreBtn) return;
    
    // Cerrar menú móvil si está en mobile
    if (window.innerWidth <= 768) {
        setTimeout(() => {
            closeMobileMenu();
        }, 150);
    }
}

/**
 * Maneja el redimensionamiento de la ventana
 */
function handleResize() {
    const width = window.innerWidth;
    
    // Si cambia a desktop, cerrar menú móvil
    if (width > 768 && isMobileMenuOpen) {
        closeMobileMenu();
    }
}

/**
 * Previene el scroll cuando el sidebar móvil está abierto
 */
function preventScroll(e) {
    if (isMobileMenuOpen && !sidebar.contains(e.target)) {
        e.preventDefault();
    }
}

/**
 * Maneja gestos táctiles para cerrar el sidebar
 */
let touchStartX = 0;
let touchEndX = 0;

function handleTouchStart(e) {
    if (!isMobileMenuOpen) return;
    touchStartX = e.changedTouches[0].screenX;
}

function handleTouchEnd(e) {
    if (!isMobileMenuOpen) return;
    
    touchEndX = e.changedTouches[0].screenX;
    const swipeDistance = touchStartX - touchEndX;
    
    // Si desliza hacia la izquierda más de 50px, cerrar menú
    if (swipeDistance > 50 && !sidebar.contains(e.target)) {
        closeMobileMenu();
    }
}

/**
 * Inicializa los event listeners
 */
function initMobileNav() {
    mainLogger.info('🚀 Inicializando navegación móvil...');
    
    // Toggle del menú móvil
    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', toggleMobileMenu);
        mainLogger.debug('✓ Listener del botón menú móvil agregado');
    }
    
    // Cerrar al hacer clic en el overlay
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', closeMobileMenu);
        mainLogger.debug('✓ Listener del overlay agregado');
    }
    
    // Manejar clics en items de navegación del sidebar
    const sidebarNav = document.querySelector('.sidebar');
    if (sidebarNav) {
        sidebarNav.addEventListener('click', handleSidebarNavClick);
        mainLogger.debug('✓ Listener de navegación sidebar agregado');
    }
    
    // Manejar clics en géneros
    const genreNav = document.getElementById('genre-nav');
    if (genreNav) {
        genreNav.addEventListener('click', handleGenreClick);
        mainLogger.debug('✓ Listener de géneros agregado');
    }
    
    // Cerrar con tecla Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && isMobileMenuOpen) {
            closeMobileMenu();
        }
    });
    
    // Manejar redimensionamiento
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(handleResize, 250);
    });
    
    // Gestos táctiles
    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchend', handleTouchEnd);
    
    // Prevenir scroll cuando el menú está abierto
    document.addEventListener('touchmove', preventScroll, { passive: false });
    
    mainLogger.success('✅ Navegación móvil inicializada correctamente');
}

/**
 * Actualiza los badges de contador en el sidebar y bottom nav
 * @param {number} favoritesCount - Número de favoritos
 * @param {number} watchedCount - Número de películas vistas
 */
export function updateNavigationBadges(favoritesCount, watchedCount) {
    mainLogger.debug(`🔢 Actualizando badges: ${favoritesCount} favoritos, ${watchedCount} vistas`);
    
    // Actualizar badges en sidebar
    const favBadge = document.getElementById('favorites-count');
    const watchedBadge = document.getElementById('watched-count');
    
    if (favBadge) {
        favBadge.textContent = favoritesCount;
        favBadge.style.display = favoritesCount > 0 ? 'inline-block' : 'none';
    }
    
    if (watchedBadge) {
        watchedBadge.textContent = watchedCount;
        watchedBadge.style.display = watchedCount > 0 ? 'inline-block' : 'none';
    }
}

/**
 * Detecta si está en dispositivo móvil
 */
export function isMobileDevice() {
    return window.innerWidth <= 768;
}

/**
 * Obtiene el estado del menú móvil
 */
export function isMobileMenuActive() {
    return isMobileMenuOpen;
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMobileNav);
} else {
    initMobileNav();
}

// Exportar funciones públicas
export { openMobileMenu, closeMobileMenu, toggleMobileMenu };
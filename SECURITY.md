# 🔐 Configuración de Seguridad para Producción

## API Key de TMDB

Para proteger tu API key en producción, sigue estos pasos:

### Opción 1: Variables de Entorno (Recomendado para Vercel/Netlify)

1. **En tu plataforma de hosting:**
   - Vercel: Settings → Environment Variables
   - Netlify: Site settings → Build & deploy → Environment
   
2. **Agrega la variable:**
   ```
   TMDB_API_KEY=tu_api_key_aqui
   ```

3. **Actualiza `config.js` para usar la variable:**
   ```javascript
   export const apiKey = import.meta.env.TMDB_API_KEY || 'fallback_key';
   ```

### Opción 2: Archivo Local (Desarrollo)

1. **Copia el archivo de ejemplo:**
   ```bash
   cp js/config.example.js js/config.js
   ```

2. **Edita `js/config.js` con tu API key**

3. **Verifica que `js/config.js` está en `.gitignore`** ✅

### Opción 3: Backend Proxy (Máxima Seguridad)

Para ocultar completamente la API key del cliente:

1. Crea un backend simple (Node.js, Python, etc.)
2. El backend hace las peticiones a TMDB
3. Tu frontend llama a tu backend
4. La API key nunca se expone al cliente

## ⚠️ Importante

- **NUNCA** subas `js/config.js` con tu API key a Git
- **NUNCA** expongas tu API key en el código fuente público
- Usa variables de entorno en producción
- Rota tu API key si fue expuesta accidentalmente

## 📝 Obtener API Key

1. Crea una cuenta en [TMDB](https://www.themoviedb.org/)
2. Ve a [Settings → API](https://www.themoviedb.org/settings/api)
3. Solicita una API key (es gratuita)
4. Copia tu API key v3

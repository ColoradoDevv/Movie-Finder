# 🚀 Despliegue en Vercel

## Configuración de Variables de Entorno

1. **En Vercel Dashboard:**
   - Ve a tu proyecto → Settings → Environment Variables
   - Agrega: `TMDB_API_KEY` = `tu_api_key_aqui`

2. **La aplicación usará:**
   - Serverless function en `/api/tmdb.js` para proxy de peticiones
   - La API key nunca se expone al cliente

## Cómo Funciona

### Antes (Inseguro):
```
Cliente → TMDB API (con API key expuesta)
```

### Ahora (Seguro):
```
Cliente → Vercel Function → TMDB API
         (API key oculta)
```

## Uso

La aplicación automáticamente usará el endpoint `/api/tmdb` cuando esté desplegada en Vercel.

Para desarrollo local, crea `js/config.js` con tu API key:
```bash
cp js/config.example.js js/config.js
# Edita config.js con tu API key
```

## Deploy

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel

# Deploy a producción
vercel --prod
```

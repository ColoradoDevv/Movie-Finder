// Vercel Serverless Function
// Este archivo maneja las peticiones a TMDB de forma segura
export default async function handler(req, res) {
    const { endpoint } = req.query;
    const apiKey = process.env.TMDB_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'API key not configured' });
    }

    try {
        const url = `https://api.themoviedb.org/3/${endpoint}?api_key=${apiKey}`;
        const response = await fetch(url);
        const data = await response.json();

        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch from TMDB' });
    }
}

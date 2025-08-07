import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch'; 

// C'est la durée de vie du cache, ici 30 secondes.
const CACHE_EXPIRATION_TIME = 30 * 1000; 

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const finnhubNewsApiKey = process.env.FINNHUB_NEWS_API_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default async function handler(req, res) {
  try {
    // 1. On essaie de lire les données dans la table de cache de Supabase
    let { data: cachedData, error: readError } = await supabase
      .from('news_cache')
      .select('data, last_updated')
      .eq('id', 1) 
      .single();

    if (readError && readError.code !== 'PGRST116') {
        console.error('Erreur de lecture du cache Supabase :', readError);
    }
    
    // On vérifie si le cache est périmé
    const isCacheStale = !cachedData || (Date.now() - new Date(cachedData.last_updated).getTime() > CACHE_EXPIRATION_TIME);

    if (!isCacheStale) {
      // 2. Si le cache est bon, on l'envoie à l'utilisateur
      res.status(200).json(cachedData.data);
      console.log("Données servies depuis le cache Supabase.");
      return;
    }

    // 3. Si le cache est trop vieux, on fait UNE SEULE requête à Finnhub
    console.log("Cache périmé, récupération des données depuis Finnhub...");
    const response = await fetch(`https://finnhub.io/api/v1/news?category=general&token=${finnhubNewsApiKey}`);
    const rawNews = await response.json();

    const formattedNews = rawNews.map(item => ({
      id: item.id.toString(),
      title: item.headline,
      summary: item.summary,
      source: item.source,
      publishedAt: new Date(item.datetime * 1000).toISOString(),
      url: item.url,
      category: item.category,
    }));

    // 4. On met à jour la table de cache avec les nouvelles données
    const { error: writeError } = await supabase
      .from('news_cache')
      .upsert({ id: 1, data: formattedNews, last_updated: new Date().toISOString() }, { onConflict: 'id' });

    if (writeError) {
      console.error('Erreur de mise à jour du cache Supabase :', writeError);
    }
    
    // 5. On envoie les nouvelles données à l'utilisateur
    res.status(200).json(formattedNews);
  } catch (error) {
    console.error('Erreur dans la fonction Vercel :', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des actualités' });
  }
}

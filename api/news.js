// /api/news.js
// Cette fonction gère la récupération et le cache des actualités de Finnhub et CoinDesk
// avec des durées de cache différentes et un flux CoinDesk alternatif.

import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

// Configuration des clés d'API depuis les variables d'environnement Vercel
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const finnhubNewsApiKey = process.env.FINNHUB_NEWS_API_KEY;

// Durées de cache spécifiques
const CACHE_DURATION_SECONDS = 30; // 30 secondes pour le cache global (Finnhub)
const COINDESK_CACHE_DURATION_SECONDS = 244; // 4 minutes et 4 secondes pour le cache de CoinDesk

// Clés de cache
const NEWS_CACHE_KEY = 'news_cache'; // Clé pour le cache global (Finnhub + CoinDesk)
const COINDESK_CACHE_KEY = 'coindesk_news_cache'; // Clé pour le cache de CoinDesk

// Initialisation du client Supabase
const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Fonction utilitaire pour fetch avec un mécanisme de réessai et un délai exponentiel.
 * @param {string} url - L'URL à appeler.
 * @param {Object} [options={}] - Options pour la requête fetch.
 * @param {number} [retries=3] - Nombre maximum de réessais.
 * @returns {Promise<Response>}
 */
const fetchWithRetry = async (url, options = {}, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) {
        return response;
      }
    } catch (error) {
      console.warn(`Erreur de fetch pour ${url}. Tentative de réessai ${i + 1}/${retries}...`, error.message);
      // Délai exponentiel: 1s, 2s, 4s...
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }
  throw new Error(`Échec de la récupération de ${url} après ${retries} tentatives.`);
};

/**
 * Récupère les actualités de Finnhub, les formate et ajoute une catégorie.
 * @returns {Promise<Array<Object>>}
 */
const fetchFinnhubNews = async () => {
  console.log('Récupération des actualités depuis Finnhub...');
  if (!finnhubNewsApiKey) {
    console.error("Clé API Finnhub manquante. Impossible de récupérer les actualités.");
    return [];
  }

  try {
    const finnhubUrl = `https://finnhub.io/api/v1/news?category=general&token=${finnhubNewsApiKey}`;
    const finnhubResponse = await fetchWithRetry(finnhubUrl);

    const rawNews = await finnhubResponse.json();
    console.log(`Finnhub : ${rawNews.length} articles récupérés.`);
    return rawNews.map(item => ({
      id: item.id.toString(),
      title: item.headline,
      summary: item.summary,
      source: item.source,
      publishedAt: new Date(item.datetime * 1000).toISOString(),
      url: item.url,
      category: 'stock'
    }));
  } catch (error) {
    console.error('Erreur lors de la récupération des actualités Finnhub:', error);
    return [];
  }
};

/**
 * Récupère les actualités de CoinDesk en utilisant un cache spécifique de 4 minutes.
 * Utilise un flux de données public au lieu de l'API v2.
 * @returns {Promise<Array<Object>>}
 */
const getCoinDeskNews = async () => {
  // 1. On essaie de lire le cache de CoinDesk
  console.log('Vérification du cache CoinDesk...');
  try {
    const { data: coindeskCache } = await supabase
      .from('kv')
      .select('value')
      .eq('key', COINDESK_CACHE_KEY)
      .single();

    if (coindeskCache && coindeskCache.value) {
      const { news, lastUpdated } = coindeskCache.value;
      const now = new Date();
      const timeElapsed = (now.getTime() - new Date(lastUpdated).getTime()) / 1000;

      if (timeElapsed < COINDESK_CACHE_DURATION_SECONDS) {
        console.log('Cache de CoinDesk valide. Réutilisation des données.');
        return news;
      }
    }
  } catch (error) {
    if (error.code !== 'PGRST116') {
      console.error('Erreur lors de la vérification du cache de CoinDesk:', error);
    }
  }

  // 2. Si le cache est périmé, on fait un nouvel appel au flux de données
  console.log('Cache de CoinDesk périmé ou inexistant. Récupération des actualités...');

  try {
    // Utilisation d'un flux de données public alternatif de CoinDesk
    const coindeskUrl = `https://www.coindesk.com/arc/outboundfeeds/feed.json`;
    console.log(`Appel au flux CoinDesk à l'URL: ${coindeskUrl}`);
    const coindeskResponse = await fetchWithRetry(coindeskUrl);
    console.log(`Réponse CoinDesk - Statut: ${coindeskResponse.status}`);

    if (!coindeskResponse.ok) {
      console.error(`Erreur du flux CoinDesk: ${coindeskResponse.status} - ${coindeskResponse.statusText}`);
      return [];
    }

    const coindeskData = await coindeskResponse.json();
    const formattedNews = coindeskData.headlines.map(item => ({
      // La structure des données a changé, nous l'adaptons en conséquence
      id: item.id.toString(),
      title: item.headline,
      summary: item.standfirst,
      source: 'CoinDesk',
      publishedAt: new Date(item.last_updated_date).toISOString(),
      url: item.canonical_url,
      category: 'crypto'
    }));
    console.log(`CoinDesk : ${formattedNews.length} articles formatés.`);

    // 3. On met à jour le cache spécifique de CoinDesk
    const newCacheValue = {
      news: formattedNews,
      lastUpdated: new Date().toISOString()
    };
    const { error: updateError } = await supabase
      .from('kv')
      .upsert({ key: COINDESK_CACHE_KEY, value: newCacheValue }, { onConflict: 'key' });

    if (updateError) {
      console.error('Erreur lors de la mise à jour du cache de CoinDesk:', JSON.stringify(updateError));
    } else {
      console.log('Cache de CoinDesk mis à jour.');
    }

    return formattedNews;

  } catch (error) {
    console.error('Erreur lors de la récupération des actualités CoinDesk:', error);
    return [];
  }
};

/**
 * Fonction principale de l'API pour gérer les requêtes.
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée.' });
  }

  // 1. On essaie de lire le cache global des actualités combinées
  let cacheData = null;
  try {
    const { data } = await supabase
      .from('kv')
      .select('value')
      .eq('key', NEWS_CACHE_KEY)
      .single();
    cacheData = data;
  } catch (error) {
    if (error.code !== 'PGRST116') {
      console.error('Erreur lors de la vérification du cache global:', JSON.stringify(error));
    }
  }

  if (cacheData && cacheData.value) {
    const { news, lastUpdated } = cacheData.value;
    const now = new Date();
    const timeElapsed = (now.getTime() - new Date(lastUpdated).getTime()) / 1000;

    if (timeElapsed < CACHE_DURATION_SECONDS) {
      console.log('Cache global valide. Utilisation des données du cache.');
      return res.status(200).json(news);
    }
  }

  // 2. Si le cache global est périmé, on récupère les nouvelles actualités
  try {
    const [finnhubNews, coinDeskNews] = await Promise.all([
      fetchFinnhubNews(),
      getCoinDeskNews()
    ]);

    // On combine et on trie les résultats par date de publication
    const allNews = [...finnhubNews, ...coinDeskNews].sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

    // 3. On met à jour le cache global avec le nouveau contenu
    const newCacheValue = {
      news: allNews,
      lastUpdated: new Date().toISOString()
    };

    const { error: updateError } = await supabase
      .from('kv')
      .upsert({ key: NEWS_CACHE_KEY, value: newCacheValue }, { onConflict: 'key' });

    if (updateError) {
      console.error('Erreur lors de la mise à jour du cache global:', JSON.stringify(updateError));
    } else {
      console.log('Cache global mis à jour avec succès.');
    }

    console.log(`Total des articles combinés : ${allNews.length}`);
    // 4. On renvoie les actualités combinées
    return res.status(200).json(allNews);

  } catch (error) {
    console.error('Erreur lors de la récupération et de la combinaison des actualités:', error);
    return res.status(500).json({ error: 'Échec de la récupération des actualités.' });
  }
}

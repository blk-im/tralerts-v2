// /api/news.js
// Cette fonction gère la récupération et le cache des actualités de Finnhub et CoinDesk
// avec des durées de cache différentes et l'API officielle de CoinDesk.

import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

// Configuration des clés d'API depuis les variables d'environnement Vercel
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const finnhubNewsApiKey = process.env.FINNHUB_NEWS_API_KEY;
const coindeskApiKey = process.env.COINDESK_API_KEY; // Utilisation de votre nouvelle clé

// Durées de cache spécifiques
const CACHE_DURATION_SECONDS = 30; // 30 secondes pour le cache global
const CRYPTO_CACHE_DURATION_SECONDS = 7; // Durée de cache de 7 secondes pour la crypto

// Clés de cache
const NEWS_CACHE_KEY = 'news_cache';
const CRYPTO_NEWS_CACHE_KEY = 'crypto_news_cache';

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
 * Récupère les actualités crypto via l'API officielle de CoinDesk en utilisant un cache spécifique.
 * @returns {Promise<Array<Object>>}
 */
const fetchCryptoNews = async () => {
  // 1. On essaie de lire le cache des actualités crypto
  console.log('Vérification du cache crypto...');
  try {
    const { data: cryptoCache } = await supabase
      .from('kv')
      .select('value')
      .eq('key', CRYPTO_NEWS_CACHE_KEY)
      .single();

    if (cryptoCache && cryptoCache.value) {
      const { news, lastUpdated } = cryptoCache.value;
      const now = new Date();
      const timeElapsed = (now.getTime() - new Date(lastUpdated).getTime()) / 1000;

      if (timeElapsed < CRYPTO_CACHE_DURATION_SECONDS) {
        console.log('Cache crypto valide. Réutilisation des données.');
        return news;
      }
    }
  } catch (error) {
    if (error.code !== 'PGRST116') {
      console.error('Erreur lors de la vérification du cache crypto:', error);
    }
  }

  // 2. Si le cache est périmé, on fait un nouvel appel à l'API CoinDesk
  console.log('Cache crypto périmé ou inexistant. Récupération des actualités...');

  if (!coindeskApiKey) {
    console.error("Clé API CoinDesk manquante. Impossible de récupérer les actualités crypto.");
    return [];
  }

  try {
    // Utilisation de l'URL de l'endpoint correct pour les actualités
    const coindeskUrl = `https://data-api.coindesk.com/news/v1/article/list?api_key=${coindeskApiKey}&lang=fr`;
    
    console.log(`Appel à l'API CoinDesk à l'URL: ${coindeskUrl}`);
    const coindeskResponse = await fetchWithRetry(coindeskUrl);
    console.log(`Réponse CoinDesk - Statut: ${coindeskResponse.status}`);

    if (!coindeskResponse.ok) {
        console.error(`Erreur de l'API CoinDesk: ${coindeskResponse.status} - ${coindeskResponse.statusText}`);
        return [];
    }

    const coindeskData = await coindeskResponse.json();
    const formattedNews = coindeskData.data.map(item => ({
      id: item.ID.toString(),
      title: item.TITLE,
      summary: item.BODY,
      source: item.SOURCE_NAME,
      publishedAt: new Date(item.PUBLISHED_ON * 1000).toISOString(),
      url: item.URL,
      category: 'crypto'
    }));
    console.log(`CoinDesk : ${formattedNews.length} articles formatés.`);

    // 3. On met à jour le cache spécifique de la crypto
    const newCacheValue = {
      news: formattedNews,
      lastUpdated: new Date().toISOString()
    };
    const { error: updateError } = await supabase
      .from('kv')
      .upsert({ key: CRYPTO_NEWS_CACHE_KEY, value: newCacheValue }, { onConflict: 'key' });

    if (updateError) {
      console.error('Erreur lors de la mise à jour du cache crypto:', JSON.stringify(updateError));
    } else {
      console.log('Cache crypto mis à jour.');
    }

    return formattedNews;

  } catch (error) {
    console.error('Erreur lors de la récupération des actualités crypto:', error);
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
    const [finnhubNews, cryptoNews] = await Promise.all([
      fetchFinnhubNews(),
      fetchCryptoNews()
    ]);

    // On combine et on trie les résultats par date de publication
    const allNews = [...finnhubNews, ...cryptoNews].sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

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

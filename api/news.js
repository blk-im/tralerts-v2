// /api/news.js
// Cette fonction récupère et met en cache les actualités de Finnhub et CoinDesk.

import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch'; // Utilisez `fetch` pour les appels API

// Configuration des clés d'API depuis les variables d'environnement Vercel
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const finnhubNewsApiKey = process.env.FINNHUB_NEWS_API_KEY;
const coinDeskApiKey = process.env.COINDESK_API_KEY;

// Durée de vie du cache en secondes
const CACHE_DURATION_SECONDS = 30;
const NEWS_CACHE_KEY = 'news_cache';

// Initialisation du client Supabase
const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Récupère les actualités de Finnhub, les formate et ajoute la source.
 * En cas d'échec de l'API, retourne un tableau vide.
 */
const fetchFinnhubNews = async () => {
  console.log('Récupération des actualités depuis Finnhub...');
  if (!finnhubNewsApiKey) {
    console.error("Clé API Finnhub manquante. Impossible de récupérer les actualités.");
    return [];
  }
  
  try {
    const finnhubUrl = `https://finnhub.io/api/v1/news?category=general&token=${finnhubNewsApiKey}`;
    const finnhubResponse = await fetch(finnhubUrl);

    if (!finnhubResponse.ok) {
      console.error(`Erreur de l'API Finnhub: ${finnhubResponse.status} - ${finnhubResponse.statusText}`);
      return [];
    }
    
    const rawNews = await finnhubResponse.json();
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
 * Récupère les actualités de CoinDesk, les formate et ajoute la source.
 * En cas d'échec de l'API, retourne un tableau vide.
 */
const fetchCoinDeskNews = async () => {
  console.log('Récupération des actualités depuis CoinDesk...');
  if (!coinDeskApiKey) {
    console.error("Clé API CoinDesk manquante. Impossible de récupérer les actualités.");
    return [];
  }

  try {
    // Note: L'API de CoinDesk nécessite une clé pour l'accès aux actualités.
    const coindeskUrl = `https://news.api.coindesk.com/v2/news/?api_key=${coinDeskApiKey}`;
    const coindeskResponse = await fetch(coindeskUrl);

    if (!coindeskResponse.ok) {
      console.error(`Erreur de l'API CoinDesk: ${coindeskResponse.status} - ${coindeskResponse.statusText}`);
      return [];
    }
    
    const coindeskData = await coindeskResponse.json();
    // On s'assure que les données de CoinDesk ont la même structure que Finnhub
    return coindeskData.articles.map(item => ({
      id: item.articleId,
      title: item.title,
      summary: item.summary,
      source: 'CoinDesk',
      publishedAt: new Date(item.publishedAt).toISOString(),
      url: item.url,
      category: 'crypto'
    }));
  } catch (error) {
    console.error('Erreur lors de la récupération des actualités CoinDesk:', error);
    return [];
  }
};

/**
 * Fonction principale de l'API pour gérer les requêtes.
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée.' });
  }

  // 1. On essaie de lire les données du cache dans Supabase
  try {
    // Utilisation d'une table "kv" (key-value) avec la clé 'news_cache'
    const { data: cacheData } = await supabase
      .from('kv')
      .select('value')
      .eq('key', NEWS_CACHE_KEY)
      .single();

    if (cacheData) {
      const cacheValue = cacheData.value;
      const lastUpdated = new Date(cacheValue.lastUpdated);
      const now = new Date();
      const timeElapsed = (now.getTime() - lastUpdated.getTime()) / 1000;

      // Si le cache est encore valide, on le renvoie
      if (timeElapsed < CACHE_DURATION_SECONDS) {
        console.log('Cache hit. Utilisation des données du cache.');
        return res.status(200).json(cacheValue.news);
      }
    }
  } catch (error) {
    console.error('Erreur lors de la vérification du cache:', error);
  }

  // 2. Si le cache est périmé, on récupère de nouvelles actualités de toutes les sources
  try {
    // Exécution des appels API en parallèle pour optimiser la performance
    const [finnhubNews, coinDeskNews] = await Promise.all([
      fetchFinnhubNews(),
      fetchCoinDeskNews()
    ]);

    // On fusionne les actualités et on les trie par date de publication (récent en premier)
    const allNews = [...finnhubNews, ...coinDeskNews].sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

    // 3. On met à jour le cache dans Supabase
    const newCacheValue = {
      news: allNews,
      lastUpdated: new Date().toISOString()
    };

    const { error: updateError } = await supabase
      .from('kv')
      .upsert({ key: NEWS_CACHE_KEY, value: newCacheValue }, { onConflict: 'key' });

    if (updateError) {
      console.error('Erreur lors de la mise à jour du cache:', updateError);
    } else {
      console.log('Cache mis à jour avec succès.');
    }

    // 4. On renvoie les actualités combinées
    return res.status(200).json(allNews);

  } catch (error) {
    console.error('Erreur lors de la récupération et de la combinaison des actualités:', error);
    return res.status(500).json({ error: 'Échec de la récupération des actualités.' });
  }
}

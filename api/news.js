// api/news.js - Fonction Vercel pour le cache des actualités
import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

// Le cache expire après 1 heure pour les actualités.
// Les actualités ne nécessitent pas un rafraîchissement aussi fréquent que les prix.
const CACHE_EXPIRATION_TIME = 60 * 60 * 1000; // 1 heure

// On récupère les variables d'environnement de Vercel.
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
// On utilise la clé API spécifique pour les actualités.
const finnhubNewsApiKey = process.env.FINNHUB_NEWS_API_KEY; 

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default async function handler(req, res) {
  const { category = 'general' } = req.query; 

  // Vérification de la présence de la clé API.
  if (!finnhubNewsApiKey) {
    console.error('FINNHUB_NEWS_API_KEY est manquante dans les variables d\'environnement Vercel.');
    return res.status(500).json({ error: 'Clé API Finnhub pour les actualités manquante.' });
  }

  try {
    // 1. Tente de lire les données du cache depuis Supabase.
    let { data: cachedData, error: readError } = await supabase
      .from('news') // Assurez-vous que cette table existe
      .select('data, last_updated')
      .eq('category', category)
      .single();

    // 2. Si le cache est valide, on le renvoie.
    if (!readError && cachedData && (Date.now() - new Date(cachedData.last_updated).getTime() < CACHE_EXPIRATION_TIME)) {
      console.log(`Actualités pour la catégorie ${category} servies depuis le cache.`);
      res.status(200).json(cachedData.data);
      return;
    }

    // 3. Le cache est périmé, on fait une requête à Finnhub.
    console.log(`Cache périmé pour la catégorie ${category}, récupération depuis Finnhub...`);
    const response = await fetch(`https://finnhub.io/api/v1/news?category=${category}&token=${finnhubNewsApiKey}`);

    if (!response.ok) {
        const errorText = await response.text();
        console.error(`Erreur Finnhub API pour les actualités: Status ${response.status}. Body:`, errorText);
        throw new Error(`Finnhub API returned status ${response.status}`);
    }

    const newsData = await response.json();
    
    if (!newsData || newsData.length === 0) { 
      console.warn(`Aucune actualité trouvée pour la catégorie: ${category}`);
      res.status(404).json({ error: 'Actualités non trouvées ou données indisponibles' });
      return;
    }

    // 4. Mettre à jour le cache Supabase avec les nouvelles données.
    const { error: writeError } = await supabase
      .from('news')
      .upsert({ category: category, data: newsData, last_updated: new Date().toISOString() }, { onConflict: 'category' });

    if (writeError) {
      console.error('Erreur de mise à jour du cache Supabase pour les actualités:', writeError);
    }

    // 5. Renvoyer les nouvelles données à l'utilisateur.
    res.status(200).json(newsData);
  } catch (error) {
    console.error('Erreur dans la fonction Vercel pour les actualités :', error.message);
    res.status(500).json({ error: 'Erreur lors de la récupération des actualités' });
  }
}


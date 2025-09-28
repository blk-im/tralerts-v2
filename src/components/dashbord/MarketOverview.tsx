// ... (autres imports et logiques)

const fetchData = async () => {
    // URL de votre fonction Vercel
    const apiUrl = '/api/market-data';
    
    try {
        // Ajout de { cache: 'no-store' } et de la gestion d'erreur détaillée
        const response = await fetch(apiUrl, { 
            cache: 'no-store' // Désactive le cache du navigateur
        }); 
        
        if (!response.ok) {
            // Tentative de lire le corps de l'erreur pour obtenir plus de détails
            let errorBody = "No details available";
            try {
                errorBody = await response.text();
            } catch (e) {
                // Ignore l'erreur si le corps est vide ou non lisible
            }

            // Log de l'erreur dans la console du navigateur
            console.error("Erreur détaillée de l'API:", response.status, errorBody);
            
            // Lève une erreur qui sera capturée par le 'catch' pour afficher le message à l'utilisateur
            const userMessage = errorBody.length > 100 ? errorBody.substring(0, 100) + '...' : errorBody;
            throw new Error(`Erreur de récupération des données du marché: Statut HTTP ${response.status} - ${userMessage}`);
        }
        
        const data = await response.json();
        // ... (votre logique pour mettre à jour l'état avec les données)

    } catch (error) {
        // C'est ici que l'erreur est finalement attrapée et où le message utilisateur est affiché.
        console.error("Erreur générale lors de la récupération des données:", error);
        // Vous devez utiliser la fonction de gestion d'erreur de votre contexte/hook ici.
        // Par exemple: setErrorMessage(error.message);
    }
};

// ... (le reste de votre composant)
